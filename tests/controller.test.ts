/** @vitest-environment jsdom */
import {forEachDiagnostic} from '@codemirror/lint';
import {afterEach,describe,expect,it} from 'vitest';
import {CodeEditorController,type ControllerOptions} from '../src/codemirror/controller';
import type {EditorTransaction} from '../src/codemirror/types';

const controllers:CodeEditorController[]=[];

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

afterEach(()=>{
  for(const controller of controllers.splice(0))controller.destroy();
  document.body.replaceChildren();
});

describe('CodeEditorController',()=>{
  it('applies an edit and reports the raw-source change',()=>{
    const {controller,transactions}=create('hello');
    controller.edit({value:'**hello**',selection:{start:2,end:7}});

    expect(controller.source).toBe('**hello**');
    expect(controller.selection()).toEqual({start:2,end:7});
    expect(transactions.at(-1)).toMatchObject({
      previousSource:'hello',
      source:'**hello**',
      changes:[{from:0,to:5,insert:'**hello**'}],
    });
  });

  it('keeps CRLF line endings in the model and selection mapping',()=>{
    const {controller}=create('a\r\nb');
    controller.edit({value:'a\r\nbc',selection:{start:5,end:5}});

    expect(controller.model.text).toBe('a\nbc');
    expect(controller.source).toBe('a\r\nbc');
    expect(controller.selection()).toEqual({start:5,end:5});
    expect(controller.canUndo).toBe(true);
  });

  it('ignores edits while read-only',()=>{
    const {controller,transactions}=create('fixed',{readOnly:true});
    controller.edit({value:'changed',selection:{start:0,end:0}});

    expect(controller.source).toBe('fixed');
    expect(transactions).toHaveLength(0);
  });

  it('preserves engine error and warning severity in CodeMirror',()=>{
    const {controller}=create('alpha beta');
    controller.setAnalysis(null,'alpha beta',[
      {code:'local.parse.unclosed',message:'Unclosed block',severity:'error',range:{start:0,end:5},line:1,column:1},
      {code:'local.parse.spacing',message:'Spacing hint',severity:'warning',range:{start:6,end:10},line:1,column:7},
    ]);

    const diagnostics:{from:number;to:number;severity:string;message:string}[]=[];
    forEachDiagnostic(controller.view.state,diagnostic=>{
      diagnostics.push({from:diagnostic.from,to:diagnostic.to,severity:diagnostic.severity,message:diagnostic.message});
    });
    expect(diagnostics).toEqual([
      {from:0,to:5,severity:'error',message:'Unclosed block'},
      {from:6,to:10,severity:'warning',message:'Spacing hint'},
    ]);
  });
});
