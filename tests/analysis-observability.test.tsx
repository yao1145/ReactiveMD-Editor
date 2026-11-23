/** @vitest-environment jsdom */
/**
 * The editor owns one private analysis scheduler. These checks pin the
 * boundary between that scheduler, the public observer prop, and teardown:
 *
 *  - the observer reaches the scheduler that compiles the source;
 *  - replacing the observer replaces the scheduler without cross-talk;
 *  - a disposed scheduler drops late Worker results.
 */
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,describe,expect,it,vi} from 'vitest';
import type {Diagnostic} from 'reactive-md';
import type {LocalObserver,LocalTraceEvent} from 'reactive-md/observability';
import {ReactiveMarkdownCodeEditor} from '../src/codemirror/ReactiveMarkdownCodeEditor';

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});

const SOURCE='# Title\n\nBody';

interface FakeWorker{
  messages:unknown[];
  onmessage:((event:{data:unknown})=>void)|null;
  onerror:((event:unknown)=>void)|null;
  onmessageerror:(()=>void)|null;
  terminated:boolean;
  postMessage(message:unknown):void;
  terminate():void;
}
interface CompileRequest{id:number;source:string}

function fakeWorker():FakeWorker{
  const worker:FakeWorker={
    messages:[],onmessage:null,onerror:null,onmessageerror:null,terminated:false,
    postMessage(message){worker.messages.push(message);},
    terminate(){worker.terminated=true;},
  };
  return worker;
}

function lastRequest(worker:FakeWorker):CompileRequest|undefined{
  for(let index=worker.messages.length-1;index>=0;index--){
    const message=worker.messages[index] as Partial<CompileRequest>|null;
    if(message&&typeof message.source==='string'&&typeof message.id==='number')return message as CompileRequest;
  }
  return undefined;
}

function issue(message:string,severity:Diagnostic['severity']='error'):Diagnostic{
  return {code:'local.test.issue',message,severity,range:{start:0,end:1},line:1,column:1};
}

interface RecordedObserver extends LocalObserver{
  diagnostics:Diagnostic[];
  traces:LocalTraceEvent[];
}

function recordObserver():RecordedObserver{
  const diagnostics:Diagnostic[]=[],traces:LocalTraceEvent[]=[];
  return{
    diagnostics,traces,
    onDiagnostic(diagnostic){diagnostics.push(diagnostic);},
    onTrace(event){traces.push(event);},
  };
}

const roots:Root[]=[];
const hosts:HTMLElement[]=[];

afterEach(()=>{
  for(const root of roots.splice(0))act(()=>root.unmount());
  for(const host of hosts.splice(0))host.remove();
});

function createMount(createAnalysisWorker:()=>Worker){
  const host=document.createElement('div');
  document.body.append(host);hosts.push(host);
  const root=createRoot(host);roots.push(root);
  const render=async(observer:LocalObserver)=>{
    await act(async()=>{
      root.render(<ReactiveMarkdownCodeEditor
        value={SOURCE}
        onChange={()=>{}}
        observer={observer}
        createAnalysisWorker={createAnalysisWorker}/>);
    });
  };
  return{root,render};
}

async function unmount(root:Root){
  await act(async()=>{root.unmount();});
  const index=roots.indexOf(root);
  if(index>=0)roots.splice(index,1);
}

/** Answers the latest request as a failed compile so the scheduler delivers diagnostics. */
async function complete(worker:FakeWorker,diagnostics:Diagnostic[]){
  const request=lastRequest(worker);
  if(!request)throw new Error('The fake worker has no compile request to answer.');
  await act(async()=>{
    worker.onmessage?.({data:{id:request.id,ok:true,result:{ok:false,diagnostics}}});
  });
}

describe('analysis observer boundary',()=>{
  it('forwards scheduler diagnostics and trace events to the observer prop',async()=>{
    const worker=fakeWorker();
    const observer=recordObserver();
    const {render}=createMount(()=>worker as unknown as Worker);

    await render(observer);
    await vi.waitFor(()=>expect(lastRequest(worker)).toBeDefined());
    expect(observer.traces.map(event=>event.type)).toContain('worker-request');

    const first=issue('First issue');
    await complete(worker,[first]);
    expect(observer.diagnostics.map(diagnostic=>diagnostic.message)).toEqual(['First issue']);
    expect(observer.diagnostics[0]).toMatchObject({code:'local.test.issue',severity:'error',range:{start:0,end:1}});
    expect(observer.traces.some(event=>event.type==='worker-response')).toBe(true);
  });

  it('recreates the scheduler when the observer changes and keeps instances isolated',async()=>{
    const workers:FakeWorker[]=[];
    const createAnalysisWorker=()=>{
      const worker=fakeWorker();
      workers.push(worker);
      return worker as unknown as Worker;
    };
    const first=recordObserver(),second=recordObserver();
    const {render}=createMount(createAnalysisWorker);

    await render(first);
    await vi.waitFor(()=>expect(lastRequest(workers[0])).toBeDefined());
    expect(first.traces.map(event=>event.type)).toContain('worker-request');
    const firstRequest=lastRequest(workers[0])!;
    // Keep the old scheduler's pending handler to prove disposal, not just
    // detaching, stops it from delivering to either observer.
    const staleReceive=workers[0].onmessage!;

    await render(second);
    await vi.waitFor(()=>expect(workers.length).toBe(2));
    expect(workers[0].terminated).toBe(true);
    expect(workers[0].onmessage).toBeNull();
    await vi.waitFor(()=>expect(lastRequest(workers[1])).toBeDefined());

    const next=issue('Second issue');
    await complete(workers[1],[next]);
    expect(second.diagnostics.map(diagnostic=>diagnostic.message)).toEqual(['Second issue']);

    const diagnosed=first.diagnostics.length,traced=first.traces.length;
    await act(async()=>{
      staleReceive({data:{id:firstRequest.id,ok:true,result:{ok:false,diagnostics:[issue('Stale issue')]}}});
    });
    expect(first.diagnostics).toHaveLength(diagnosed);
    expect(first.traces).toHaveLength(traced);
    expect(second.diagnostics.map(diagnostic=>diagnostic.message)).toEqual(['Second issue']);
  });

  it('drops late worker results after unmount cleanup',async()=>{
    const worker=fakeWorker();
    const observer=recordObserver();
    const {root,render}=createMount(()=>worker as unknown as Worker);

    await render(observer);
    await vi.waitFor(()=>expect(lastRequest(worker)).toBeDefined());
    const request=lastRequest(worker)!;
    const staleReceive=worker.onmessage!;

    await unmount(root);
    expect(worker.terminated).toBe(true);
    expect(worker.onmessage).toBeNull();

    // The disposed scheduler reaches neither observer callback nor onResult:
    // its receive guard returns before delivering the late result.
    const diagnosed=observer.diagnostics.length,traced=observer.traces.length;
    await act(async()=>{
      staleReceive({data:{id:request.id,ok:true,result:{ok:false,diagnostics:[issue('Late issue')]}}});
    });
    expect(observer.diagnostics).toHaveLength(diagnosed);
    expect(observer.traces).toHaveLength(traced);
  });
});