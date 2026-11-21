/** @vitest-environment jsdom */
/**
 * Editor-scope regression for the document capability switches.
 *
 * The editor never interprets capabilities itself: it hands the same
 * `LocalCompileOptions` to the analysis worker and to every authoring entry.
 * These tests therefore assert the two boundaries the editor owns:
 *
 *  - explicit `false` reaches the Worker intact and keys differently from an
 *    omitted (default-on) CSS flag;
 *  - with any combination of the three flags, RMD components, bindings and
 *    binding completion keep working on one mixed document.
 */
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {
  analyzeLocalSource,
  completeLocalSource,
  formatLocalSource,
  localCompileOptionsKey,
  LocalCompileScheduler,
  renameLocalBinding,
  type LocalCompileOptions,
  type LocalCompileWorker,
} from 'reactive-md';
import {
  createLocalComponentCatalogForOptions,
  insertLocalComponentFromOptions,
} from 'reactive-md/authoring';
import {
  ReactiveMarkdownCodeEditor,
} from '../src/codemirror/ReactiveMarkdownCodeEditor';
import {bindingAtOffset} from '../src/authoring/source-selection';

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});

/** The single mixed document all editor and worker checks share. */
const MIXED=[
  '<css>',
  'h2 { color: #24549a; }',
  '</css>',
  '',
  '## 人数',
  '',
  '<slider bind="people" label="人数" initial="2" min="1" max="20"',
  '        css="max-width: 24rem; margin-block: 1rem">',
  '',
  '当前人数：{{ people }}',
  '',
  '<iframe title="嵌入样例" srcdoc="<p>嵌入样例</p>"></iframe>',
  '',
  '<javascript>',
  'await rmd.set("people", 10)',
  '</javascript>',
].join('\n');

const CASES=Array.from({length:8},(_,policy)=>({
  enableCss:Boolean(policy&1),
  enableJavaScript:Boolean(policy&2),
  enableExtendedHtml:Boolean(policy&4),
}));
const DEFAULTS:LocalCompileOptions={enableCss:true,enableJavaScript:false,enableExtendedHtml:false};
const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

/** Structural double for the small worker surface the scheduler consumes. */
interface FakeWorker{
  messages:unknown[];
  postMessage(message:unknown):void;
  terminate():void;
  onmessage:((event:any)=>void)|null;
  onerror:((event:any)=>void)|null;
  onmessageerror:(()=>void)|null;
}
interface FullRequest{source:string;options?:LocalCompileOptions}

function lastFull(worker:FakeWorker):FullRequest|undefined{
  for(let index=worker.messages.length-1;index>=0;index--){
    const message=worker.messages[index] as Partial<FullRequest>|null;
    if(message&&typeof message.source==='string')return message as FullRequest;
  }
  return undefined;
}

/** Records what the scheduler posts; replies are irrelevant to these checks. */
function fakeWorker():FakeWorker{
  const worker:FakeWorker={
    messages:[] as unknown[],
    onmessage:null,
    onerror:null,
    onmessageerror:null,
    postMessage(message:unknown){worker.messages.push(message);},
    terminate(){},
  };
  return worker;
}

const roots:Root[]=[];
const hosts:HTMLElement[]=[];

afterEach(()=>{
  for(const root of roots.splice(0))act(()=>root.unmount());
  for(const host of hosts.splice(0))host.remove();
});

describe('document capabilities at the editor boundary',()=>{
  it('distinguishes explicit false from an omitted CSS flag in the canonical keys',()=>{
    // The public compile API keeps CSS enabled by default, so omitting the flag
    // and writing `true` are the same compilation.
    expect(localCompileOptionsKey(undefined)).toBe(localCompileOptionsKey({enableCss:true}));
    expect(localCompileOptionsKey(undefined)).toBe(localCompileOptionsKey(DEFAULTS));
    // Explicit false is a different compilation, not an alias of the default.
    expect(localCompileOptionsKey({enableCss:false})).not.toBe(localCompileOptionsKey(undefined));
    expect(localCompileOptionsKey({enableCss:false,enableJavaScript:false,enableExtendedHtml:false}))
      .not.toBe(localCompileOptionsKey(undefined));
    // Every combination from the acceptance matrix stays distinct.
    expect(new Set(CASES.map(option=>localCompileOptionsKey(option))).size).toBe(8);
  });

  it('keeps RMD components, bindings and binding completion under every switch combination',()=>{
    const bindingOffset=MIXED.indexOf('{{ people }}')+'{{ peo'.length;
    const tagOffset=MIXED.indexOf('<slider')+'<sli'.length;
    // `undefined` is the acceptance row for omitted options: CSS on, JS/HTML off.
    for(const options of [...CASES,undefined] as (LocalCompileOptions|undefined)[]){
      const analysis=analyzeLocalSource(MIXED,options);
      const people=analysis.bindings.find(binding=>binding.name==='people');
      expect(people).toBeDefined();
      expect(people!.declarations.length).toBeGreaterThan(0);
      expect(people!.references.length).toBeGreaterThan(0);
      expect(analysis.tokens.some(token=>token.kind==='tag')).toBe(true);
      // The caret sits on the interpolation reference, not just the declaration.
      expect(bindingAtOffset(analysis.bindings,bindingOffset)?.binding.name).toBe('people');

      const binding=completeLocalSource(MIXED,bindingOffset,options);
      expect(binding.map(item=>item.label)).toContain('people');
      const tags=completeLocalSource(MIXED,tagOffset,options);
      expect(tags.map(item=>item.label)).toContain('slider');

      // The toolbar catalog and insertion also stay RMD under the switches.
      const catalog=createLocalComponentCatalogForOptions(options,'zh');
      expect(catalog.some(entry=>entry.name==='slider')).toBe(true);
      const inserted=insertLocalComponentFromOptions(options,'slider','',{start:0,end:0},'zh');
      expect(inserted.value).toContain('<slider');
    }
  });

  it('keeps declaration text and authoring edits intact under every combination',()=>{
    for(const options of [...CASES,undefined] as (LocalCompileOptions|undefined)[]){
      const formatted=formatLocalSource(MIXED,options);
      expect(formatted).toContain('h2 { color: #24549a; }');
      expect(formatted).toContain('await rmd.set("people", 10)');
      expect(formatted).toContain('srcdoc="<p>嵌入样例</p>"');

      const renamed=renameLocalBinding(MIXED,'people','attendees',options);
      expect(renamed.source).toContain('<slider bind="attendees"');
      expect(renamed.source).toContain('{{ attendees }}');
      expect(renamed.source).toContain('await rmd.set("people", 10)');
      expect(renamed.source).toContain('h2 { color: #24549a; }');
    }
  });

  it('reports author declarations as skipped only when their switch is off',()=>{
    const off=analyzeLocalSource(MIXED,{enableCss:false,enableJavaScript:false}).diagnostics;
    const on=analyzeLocalSource(MIXED,{enableCss:true,enableJavaScript:true}).diagnostics;
    // Both declarations stay locatable: the diagnostic carries their ranges.
    const skipped=off.filter(item=>item.code==='local.author.disabled');
    expect(skipped.length).toBeGreaterThanOrEqual(2);
    expect(skipped.every(item=>item.range.start>=0&&item.range.end>item.range.start)).toBe(true);
    expect(on.some(item=>item.code==='local.author.disabled')).toBe(false);
    // Neither state loses the healthy RMD content around the declarations.
    expect(off.some(item=>item.severity==='error')).toBe(false);
    expect(on.some(item=>item.severity==='error')).toBe(false);
  });

  it('forwards the exact option snapshot through the Worker scheduling entry',async()=>{
    const dispatch=async(options?:LocalCompileOptions)=>{
      // A fresh scheduler per dispatch: an unanswered request keeps the session
      // in flight, which would hold back the next full request.
      const worker=fakeWorker();
      const scheduler=new LocalCompileScheduler({createWorker:()=>worker as unknown as LocalCompileWorker,onResult(){},delay:5});
      try{
        scheduler.schedule(MIXED,options);
        await sleep(30);
        return lastFull(worker);
      }finally{scheduler.dispose();}
    };

    const omitted=await dispatch({enableJavaScript:true,enableExtendedHtml:true});
    expect(omitted?.source).toBe(MIXED);
    expect(omitted?.options).not.toBeUndefined();
    // Omitted CSS keeps its default-on meaning; it is not materialized as false.
    expect(Object.hasOwn(omitted!.options!,'enableCss')).toBe(false);
    expect(omitted!.options).toMatchObject({enableJavaScript:true,enableExtendedHtml:true});

    const explicit=await dispatch({enableCss:false,enableJavaScript:true,enableExtendedHtml:true});
    expect(explicit?.options).toMatchObject({enableCss:false,enableJavaScript:true,enableExtendedHtml:true});
    expect(localCompileOptionsKey(omitted?.options)).not.toBe(localCompileOptionsKey(explicit?.options));
  });

  it('forwards the editor compileOptions to its private analysis worker',async()=>{
    const worker=fakeWorker();
    const host=document.createElement('div');
    document.body.append(host);hosts.push(host);
    const root=createRoot(host);roots.push(root);
    const compileOptions:LocalCompileOptions={enableCss:false,enableJavaScript:true,enableExtendedHtml:false};
    const render=async(options:LocalCompileOptions)=>{
      await act(async()=>{
        root.render(<ReactiveMarkdownCodeEditor
          value={MIXED}
          onChange={()=>{}}
          compileOptions={options}
          createAnalysisWorker={()=>worker as unknown as Worker}/>);
      });
      await vi.waitFor(()=>expect(lastFull(worker)?.options).toMatchObject(options));
    };

    await render(compileOptions);
    const request=lastFull(worker);
    expect(request?.source).toBe(MIXED);
    expect(request?.options).toMatchObject(compileOptions);
    // Explicit false is forwarded as a value; the Worker sees the same key.
    expect(Object.hasOwn(request!.options!,'enableCss')).toBe(true);
    expect(request!.options!.enableCss).toBe(false);

    // An options-only change reschedules: the editor must not keep a worker
    // keyed by the previous capability set.
    await render({...compileOptions,enableCss:true});
    const after=lastFull(worker);
    expect(after?.options).toMatchObject({enableCss:true,enableJavaScript:true,enableExtendedHtml:false});
    expect(localCompileOptionsKey(after?.options)).toBe(
      localCompileOptionsKey({enableCss:true,enableJavaScript:true,enableExtendedHtml:false}));
  });

  it('accepts shared analysis only under the matching options key',async()=>{
    const host=document.createElement('div');
    document.body.append(host);hosts.push(host);
    const root=createRoot(host);roots.push(root);
    const compileOptions:LocalCompileOptions={enableCss:false,enableJavaScript:false,enableExtendedHtml:false};
    const analysis=analyzeLocalSource(MIXED,compileOptions);
    const envelope={source:MIXED,optionsKey:localCompileOptionsKey(compileOptions),analysis};
    const render=(provided:typeof envelope)=>act(()=>root.render(<ReactiveMarkdownCodeEditor
      value={MIXED}
      onChange={()=>{}}
      compileOptions={compileOptions}
      analysis={provided}/>));

    await render(envelope);
    expect(host.querySelector('[data-binding-name="people"]')).not.toBeNull();

    // A result produced under another option set belongs to a different
    // compilation; the editor must not decorate this source with it.
    await render({...envelope,optionsKey:localCompileOptionsKey({enableCss:true})});
    expect(host.querySelector('[data-binding-name="people"]')).toBeNull();
  });
});
