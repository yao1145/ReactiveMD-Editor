/** @vitest-environment jsdom */
import {afterEach,describe,expect,it} from 'vitest';
import {CodeEditorController,type ControllerOptions} from '../src/codemirror/controller';
import type {EditorTransaction} from '../src/codemirror/types';

const controllers:CodeEditorController[]=[];
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));

function create(value:string,overrides:Partial<ControllerOptions>={}){
  const parent=document.createElement('div');
  document.body.append(parent);
  const transactions:EditorTransaction[]=[];
  const controller=new CodeEditorController(parent,{
    value,readOnly:false,disabled:false,label:'Source',locale:'en',
    onChange(_value,transaction){transactions.push(transaction);},
    onUpdate(){},...overrides,
  });
  controllers.push(controller);
  return{controller,transactions};
}
function compose(controller:CodeEditorController,type:'compositionstart'|'compositionend'){
  controller.view.contentDOM.dispatchEvent(new CompositionEvent(type,{bubbles:true}));
}

afterEach(()=>{
  for(const controller of controllers.splice(0))controller.destroy();
  document.body.replaceChildren();
});

describe('streaming source updates',()=>{
  it('applies rapid snapshots without resetting selection, scroll, or history',()=>{
    const {controller,transactions}=create('Title\n\nBody');
    controller.edit({value:'Title\n\nBody!',selection:{start:8,end:8}});
    controller.view.scrollDOM.scrollTop=240;
    for(const chunk of [' one',' two',' three',' four'])controller.setExternal(controller.source+chunk);

    expect(controller.source).toBe('Title\n\nBody! one two three four');
    expect(controller.selection()).toEqual({start:8,end:8});
    expect(controller.view.scrollDOM.scrollTop).toBe(240);
    expect(controller.canUndo).toBe(true);
    expect(transactions).toHaveLength(1);
    controller.undo();
    expect(controller.source).toBe('Title\n\nBody one two three four');
  });

  it('maps the selection through an insertion before the cursor',()=>{
    const {controller}=create('abcdef');
    controller.view.dispatch({selection:{anchor:4,head:6}});
    controller.setExternal('XXabcdef');

    expect(controller.source).toBe('XXabcdef');
    expect(controller.selection()).toEqual({start:6,end:8});
  });

  it('keeps CRLF source and mapping across snapshots',()=>{
    const {controller}=create('a\r\nb');
    controller.view.dispatch({selection:{anchor:3}});
    controller.setExternal('a\r\nbc');

    expect(controller.source).toBe('a\r\nbc');
    expect(controller.model.text).toBe('a\nbc');
    expect(controller.selection()).toEqual({start:4,end:4});
  });

  it('does not report host-applied updates',()=>{
    const {controller,transactions}=create('alpha');
    controller.setExternal('alpha beta');
    controller.setExternal('alpha beta gamma');

    expect(controller.source).toBe('alpha beta gamma');
    expect(transactions).toHaveLength(0);
  });

  it('applies snapshots in place while read-only',()=>{
    const {controller,transactions}=create('fixed',{readOnly:true});
    controller.setExternal('fixed text');

    expect(controller.source).toBe('fixed text');
    expect(transactions).toHaveLength(0);
  });

  it('defers snapshots during composition and applies the latest afterwards',async()=>{
    const {controller,transactions}=create('abc');
    controller.view.dispatch({selection:{anchor:1}});
    compose(controller,'compositionstart');
    expect(controller.composing).toBe(true);

    controller.setExternal('abc one');
    controller.setExternal('abc one two');
    expect(controller.source).toBe('abc');
    expect(transactions).toHaveLength(0);

    compose(controller,'compositionend');
    await settle();

    expect(controller.composing).toBe(false);
    expect(controller.source).toBe('abc one two');
    expect(controller.selection()).toEqual({start:1,end:1});
    expect(transactions).toHaveLength(0);
  });

  it('applies the host snapshot after composition committed text',async()=>{
    const {controller}=create('abc');
    controller.view.dispatch({selection:{anchor:1}});
    compose(controller,'compositionstart');

    // CodeMirror commits the IME text before compositionend reaches the host.
    controller.view.dispatch({changes:{from:2,insert:'X'},selection:{anchor:3}});
    expect(controller.source).toBe('abXc');

    controller.setExternal('abXc from host');
    expect(controller.source).toBe('abXc');

    compose(controller,'compositionend');
    await settle();

    expect(controller.composing).toBe(false);
    expect(controller.source).toBe('abXc from host');
  });

  it('defers a document switch during composition and resets afterwards',async()=>{
    const {controller,transactions}=create('old text');
    controller.edit({value:'old text!',selection:{start:4,end:4}});
    compose(controller,'compositionstart');

    controller.setExternal('new document',true);
    controller.setExternal('new document!');
    expect(controller.source).toBe('old text!');

    compose(controller,'compositionend');
    await settle();

    expect(controller.source).toBe('new document!');
    expect(controller.selection()).toEqual({start:0,end:0});
    expect(controller.canUndo).toBe(false);
    expect(transactions).toHaveLength(1);
  });

  it('resets state when documentKey changes',()=>{
    const {controller,transactions}=create('first document');
    controller.edit({value:'first document!',selection:{start:6,end:6}});
    controller.view.scrollDOM.scrollTop=90;

    controller.setExternal('second document',true);

    expect(controller.source).toBe('second document');
    expect(controller.selection()).toEqual({start:0,end:0});
    expect(controller.view.scrollDOM.scrollTop).toBe(0);
    expect(controller.canUndo).toBe(false);
    expect(transactions).toHaveLength(1);
  });

  it('resets state for replacements unrelated to the current document',()=>{
    const {controller}=create('alpha beta gamma');
    controller.view.dispatch({selection:{anchor:5}});
    controller.view.scrollDOM.scrollTop=80;
    controller.setExternal('something else entirely');

    expect(controller.source).toBe('something else entirely');
    expect(controller.selection()).toEqual({start:0,end:0});
    expect(controller.view.scrollDOM.scrollTop).toBe(0);
  });
});