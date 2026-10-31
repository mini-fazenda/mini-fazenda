import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import '../public/release-notes-core.js';import '../public/release-notes-data.js';
test('novidades aparecem uma vez por versão e a leitura acompanha o save de cada conta',()=>{
 const a=new MFReleaseNotesState(),b=new MFReleaseNotesState();assert.equal(a.pending('v1'),true);assert.equal(a.seen('v1'),true);assert.equal(a.seen('v1'),false);assert.equal(a.pending('v1'),false);
 const reload=new MFReleaseNotesState(JSON.parse(JSON.stringify(a.capture())));assert.equal(reload.pending('v1'),false);assert.equal(reload.pending('v2'),true);assert.equal(b.pending('v1'),true);reload.seen('v2');assert.equal(reload.pending('v2'),false);assert.equal(a.capture().seenVersion,'v1');
});
test('save antigo ou inválido não impede a primeira leitura',()=>{
 for(const saved of [undefined,null,{},'v1',{seenVersion:5}])assert.equal(new MFReleaseNotesState(saved).pending('v1'),true);
 assert.equal(new MFReleaseNotesState().pending(''),false);
});
test('painel permite abertura manual após leitura, fecha e preserva conta em visitas',()=>{
 const nodes=new Map();let tick,saves=0,visit=false;
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.style={};this.events={};this.complete=true;this.naturalWidth=1536;this.parentElement=this;}
  append(...els){this.children.push(...els)}
  querySelector(key){if(!nodes.has(key))nodes.set(key,new Element(key));return nodes.get(key);}
  addEventListener(key,fn){this.events[key]=fn}
  focus(){doc.activeElement=this}
 }
 const doc={currentScript:{src:'https://example.com/release-notes.js'},head:new Element('head'),body:new Element('body'),activeElement:new Element('previous'),hidden:false,createElement:tag=>new Element(tag),querySelector:key=>{if(key==='#config-content h3')return {parentElement:settings};return null},querySelectorAll:()=>[],getElementById:id=>id==='overlay-config'?settings:null};
 const settings=new Element('settings'),env={URL,document:doc,globalThis:null,MFReleaseNotesData,MFReleaseNotesState,setInterval(fn){tick=fn;return 1},clearInterval(){},getComputedStyle:()=>({display:'none'}),window:{MFHost:{playing:()=>true,isVisiting:()=>visit,changed(){saves++}},__mfCharacter:'menino'}};env.globalThis=env;
 vm.runInNewContext(fs.readFileSync(new URL('../public/release-notes.js',import.meta.url),'utf8'),env);
 const api=env.window.MFReleaseNotes,overlay=doc.body.children[0];visit=true;api.restore({});tick();assert.equal(overlay.hidden,true);assert.equal(saves,0);visit=false;tick();assert.equal(overlay.hidden,false);assert.equal(saves,1);api.close();assert.equal(overlay.hidden,true);tick();assert.equal(overlay.hidden,true);assert.equal(api.open(),true);assert.equal(saves,1);api.close();
 visit=true;assert.equal(api.open(),false);assert.equal(overlay.hidden,true);assert.equal(saves,1);visit=false;
 settings.children[0].onclick();assert.equal(overlay.hidden,false);assert.equal(settings.style.display,'none');nodes.get('.mr-continue').onclick();assert.equal(overlay.hidden,true);
 assert.deepEqual(JSON.parse(JSON.stringify(api.capture())),{seenVersion:MFReleaseNotesData.id});
});
test('tópicos cabem nos quatro espaços e ponte persiste o recibo',()=>{
 for(const key of ['features','fixes']){assert.ok(MFReleaseNotesData[key].length<=4);for(const text of MFReleaseNotesData[key])assert.ok(text.length<=60);}
 const bridge=fs.readFileSync(new URL('../public/game-bridge.js',import.meta.url),'utf8');assert.match(bridge,/releaseNotes:window\.MFReleaseNotes\?\.capture/);assert.match(bridge,/MFReleaseNotes\?\.restore\(data\?\.releaseNotes\)/);
});
