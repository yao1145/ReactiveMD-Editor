import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), 'reactive-md-editor-consumer-'));
function run(args, cwd=root) {
  const r=spawnSync(process.execPath,args,{cwd,encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr); return r.stdout;
}
const npm=args=>run([process.env.npm_execpath,...args]);
const archive=JSON.parse(npm(['pack','--ignore-scripts','--json','--pack-destination',consumer]))[0];
assert.ok(archive.files.some(f=>f.path==='THIRD_PARTY_NOTICES.md'));
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const vendor=join(root,pkg.devDependencies['reactive-md'].slice(5));
writeFileSync(join(consumer,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{
  'reactive-md': 'file:'+vendor.replaceAll('\\','/'),
  'reactive-md-editor':'file:'+join(consumer,archive.filename).replaceAll('\\','/'),
  react:pkg.devDependencies.react,'react-dom':pkg.devDependencies['react-dom'],
  '@types/react':pkg.devDependencies['@types/react'],'@types/react-dom':pkg.devDependencies['@types/react-dom'],
  typescript:pkg.devDependencies.typescript,
}}));
run([process.env.npm_execpath,'install','--ignore-scripts','--no-audit','--no-fund'],consumer);
writeFileSync(join(consumer,'smoke.mjs'), `
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ReactiveMarkdownEditor} from 'reactive-md-editor';
import {ReactiveMarkdownCodeEditor} from 'reactive-md-editor/codemirror';
import {insertTemplate} from 'reactive-md-editor/commands';
assert.equal(ReactiveMarkdownEditor,ReactiveMarkdownCodeEditor);
assert.equal(typeof insertTemplate,'function');
assert.ok(renderToStaticMarkup(createElement(ReactiveMarkdownEditor,{value:'hello',onChange(){}})).length);
`);
run(['smoke.mjs'],consumer);
writeFileSync(join(consumer,'consumer.ts'),"import {ReactiveMarkdownEditor,type ReactiveMarkdownEditorProps} from 'reactive-md-editor';\nimport {ReactiveMarkdownCodeEditor} from 'reactive-md-editor/codemirror';\nimport {insertTemplate} from 'reactive-md-editor/commands';\nvoid ReactiveMarkdownEditor; void ReactiveMarkdownCodeEditor; void insertTemplate; const p:ReactiveMarkdownEditorProps={value:'hello',onChange(){}}; void p;\n");
writeFileSync(join(consumer,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'NodeNext',moduleResolution:'NodeNext',strict:true,skipLibCheck:false,noEmit:true},include:['consumer.ts']}));
run([join(consumer,'node_modules/typescript/bin/tsc'),'-p','tsconfig.json'],consumer);
for(const name of readdirSync(join(root,'dist/assets')).filter(f=>f.startsWith('analysis-worker'))) {
  const source=readFileSync(join(root,'dist/assets',name),'utf8');
  assert.ok(!/from\s*['"]reactive-md(?:\/[^'"]*)?['"]/.test(source),'Worker still has unresolved package imports');
}
console.log('Packed editor SSR, entry identity, Worker asset and NodeNext declarations passed: '+consumer);
