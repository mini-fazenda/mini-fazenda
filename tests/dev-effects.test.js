import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
// Executa dev-effects.js com o motor de fertilizante real e um "jogo" mínimo.
function game(){
 const notes=[];let redraws=0,changes=0;
 const el=()=>({style:{},children:[],appendChild(c){this.children.push(c);this.childElementCount=this.children.length},remove(){},get firstChild(){return {remove:()=>{}}},childElementCount:0});
 const ctx={Date,Math,Number,String,Array,console,setTimeout:()=>0,setInterval:()=>0,requestAnimationFrame:f=>f(),
  document:{getElementById:()=>null,createElement:()=>{const e=el();return e},body:el()},
  addEventListener(){}};
 ctx.window=ctx;vm.createContext(ctx);
 vm.runInContext(readFileSync('public/fertilizer-core.js','utf8'),ctx);
 vm.runInContext(`
  var terrenos=[];let moedas=100;const moedasSpan={textContent:''};let xpTotal=0;
  function addXP(n){xpTotal+=n}function requestRedraw(){globalThis.__redraw=(globalThis.__redraw||0)+1}
  function startGrowthTimer(t){globalThis.MFFertilizerCore.bind(t)}
  globalThis.MFPlotGround={isPlot:t=>!!t&&!t.animal&&!!t.cultura||/terra-(?:seca|arada)/.test(t.imgSrc||'')};
  globalThis.MFHost={changed(){globalThis.__changed=(globalThis.__changed||0)+1}};
 `,ctx);
 vm.runInContext(readFileSync('public/dev-effects.js','utf8'),ctx);
 return ctx;
}
const crop=(extra={})=>({tipo:'cenoura',startTime:Date.now()-1000,totalTime:600000,...extra});
test('moedas e XP chegam e o dev-effects avisa o jogo para salvar',()=>{
 const g=game();
 assert.equal(g.MFDev.apply({type:'moedas',amount:5000,from:'Recanto'}),true);
 assert.equal(vm.runInContext('moedas',g),5100);assert.equal(vm.runInContext('moedasSpan.textContent',g),5100);
 g.MFDev.apply({type:'xp',amount:300,from:'Recanto'});assert.equal(vm.runInContext('xpTotal',g),300);
 assert.ok(g.__changed>=2);
});
test('fertilizar aplica 12h nas plantações e não repete em bloco já adubado',()=>{
 const g=game();vm.runInContext('terrenos.push({gx:1,gy:1,w:1,h:1,cultura:'+JSON.stringify(crop())+'},{gx:2,gy:1,w:1,h:1,imgSrc:"terra-seca.png"},{gx:9,gy:9,animal:true})',g);
 g.MFDev.apply({type:'fertilizar',from:'Dev'});
 const t=vm.runInContext('terrenos[0]',g);
 assert.ok(g.MFFertilizerCore.active(t));assert.ok(Math.abs(t.fertilizerUntil-t.fertilizerAt-12*3600000)<5);
 const until=t.fertilizerUntil;g.MFDev.apply({type:'fertilizar',from:'Dev'});assert.equal(t.fertilizerUntil,until);
});
test('fertilizante infinito não acumula bônus em dobro e desliga limpando só o infinito',()=>{
 const g=game();vm.runInContext('terrenos.push({gx:1,gy:1,w:1,h:1,cultura:'+JSON.stringify(crop())+'})',g);
 g.MFDev.apply({type:'fertilizar',from:'Dev'});g.MFDev.apply({type:'fertilizar_infinito',from:'Dev'});
 const t=vm.runInContext('terrenos[0]',g),now=Date.now();
 assert.ok(t.fertilizerUntil-now>300*86400000);assert.equal(g.MFDev.infinite(),true);
 const open=t.cultura.fertWindows.filter(w=>w.until>now+1000);assert.equal(open.length,1,'só uma janela aberta por vez');
 g.MFDev.apply({type:'fertilizar_infinito_off',from:'Dev'});
 assert.ok(t.fertilizerUntil<=Date.now());assert.equal(g.MFDev.infinite(),false);
 assert.ok(t.cultura.fertWindows.every(w=>w.until<Date.now()+1000));
});
test('crescer adianta o plantio e tipo desconhecido é recusado',()=>{
 const g=game();vm.runInContext('terrenos.push({gx:1,gy:1,w:1,h:1,cultura:'+JSON.stringify(crop())+'})',g);
 const t=vm.runInContext('terrenos[0]',g);const before=t.cultura.startTime;
 g.MFDev.apply({type:'crescer',from:'Dev'});assert.ok(Date.now()-t.cultura.startTime>=t.cultura.totalTime);
 assert.equal(g.MFDev.apply({type:'inexistente',from:'Dev'}),false);
});

test('recibo acompanha recompensa, impede repetição e sobrevive ao restore',()=>{
 const g=game();const grant={type:'moedas',amount:500,from:'Recanto'};
 g.MFDev.apply(grant,'command1');g.MFDev.apply(grant,'command1');
 assert.equal(vm.runInContext('moedas',g),600);
 const saved=JSON.parse(JSON.stringify(g.MFDev.capture()));
 assert.equal(saved.receipts.command1,true);
 const restored=game();vm.runInContext('moedas=600',restored);
 restored.MFDev.restore(saved);restored.MFDev.apply(grant,'command1');
 assert.equal(vm.runInContext('moedas',restored),600);
 restored.MFDev.apply(grant,'command2');assert.equal(vm.runInContext('moedas',restored),1100);
});
test('fertilizante permanente persiste mesmo sem terrenos e visitas recusam efeitos',()=>{
 const g=game();g.MFDev.apply({type:'fertilizar_infinito',from:'Dev'},'on');
 const saved=g.MFDev.capture(),h=game();h.MFDev.restore(saved);
 assert.equal(h.MFDev.infinite(),true);
 h.MFHost.isVisiting=()=>true;
 assert.equal(h.MFDev.apply({type:'moedas',amount:5},'visit'),false);
 assert.equal(vm.runInContext('moedas',h),100);
});
