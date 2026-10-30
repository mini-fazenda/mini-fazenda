import test from 'node:test';import assert from 'node:assert/strict';import '../public/fertilizer-core.js';import '../public/growth-info.js';
const F=MFFertilizerCore,start=1800000000000,H=3600000;
const crop=(at=start,total=600000)=>({gx:2,gy:4,cultura:{tipo:'cenoura',startTime:at,totalTime:total,etapa:0}});
test('adubo mantém porcentagem e reduz tempo restante 35%, sem somar por 12 horas',()=>{
 const t=crop(start,6000000),key=F.key(t),at=start+1200000;assert.equal(F.apply(t,{key,at}),true);
 assert.equal(F.elapsed(t.cultura,at)/t.cultura.totalTime,.2);assert.equal(F.delay(t.cultura,t.cultura.totalTime,at),3120000);
 assert.equal(F.apply(t,{key,at:at+10}),false);assert.equal(F.active(t,at+12*H-1),true);assert.equal(F.active(t,at+12*H),false);
 const info=MFGrowthInfo.describe(t,at,{});assert.equal(info.percent,20);assert.equal(info.remaining,3120000);
});
test('mesmo bloco acelera vários replantios por 12h, estrelas ficam na terra vazia e save conserva efeito',()=>{
 let t=crop();F.apply(t,{key:F.key(t),at:start});
 for(const offset of [0,H,6*H,11*H]){t.cultura={tipo:'cenoura',startTime:start+offset,totalTime:600000};assert.equal(F.bind(t),true);assert.equal(F.delay(t.cultura,600000,start+offset),390000);}
 t.cultura=null;assert.equal(F.active(t,start+10*H),true);t=JSON.parse(JSON.stringify(t));
 t.cultura={tipo:'espinafre',startTime:start+11*H,totalTime:1200000};F.bind(t);assert.equal(F.delay(t.cultura,1200000,start+11*H),780000);
 t.cultura={tipo:'milho',startTime:start+12*H,totalTime:H};assert.equal(F.bind(t),false);assert.equal(F.delay(t.cultura,H,start+12*H),H);
});
test('cultivo longo deixa de acelerar na expiração e nova dose só vale após as 12h',()=>{
 const t=crop(start,24*H),key=F.key(t);F.apply(t,{key,at:start});
 const atEnd=F.elapsed(t.cultura,start+12*H);assert.ok(Math.abs(atEnd-12*H/.65)<.001);
 assert.ok(Math.abs(F.elapsed(t.cultura,start+13*H)-atEnd-H)<.001);
 assert.equal(F.apply(t,{key,at:start+12*H}),true);assert.equal(t.cultura.fertWindows.length,2);
 const other=crop();assert.equal(F.apply(other,{key:'block_99_99',at:start}),false);
});
test('save legado com estrela sem relógio recebe aceleração e não renova a janela ao recarregar',()=>{
 const now=Date.now(),t={gx:2,gy:4,cultura:{tipo:'milho',startTime:now-12*60000,totalTime:H,fertilizada:true}};
 const plain=structuredClone(t);plain.cultura.fertilizada=false;
 const faster=MFGrowthInfo.describe(t,now,{}),normal=MFGrowthInfo.describe(plain,now,{});
 assert.equal(faster.percent,normal.percent);assert.ok(Math.abs(faster.remaining-normal.remaining*.65)<3);
 const restored=JSON.parse(JSON.stringify(t)),deadline=restored.fertilizerUntil;F.bind(restored);assert.equal(restored.fertilizerUntil,deadline);
});
test('dois milhos simultâneos: adubado fica pronto em 39min e comum só em 60min, inclusive após save',()=>{
 const t=crop(start,H),plain=crop(start,H);F.apply(t,{key:F.key(t),at:start});const restored=JSON.parse(JSON.stringify(t));F.bind(restored);
 for(const at of [start+12*60000,start+38*60000])assert.ok(MFGrowthInfo.describe(restored,at,{}).remaining<MFGrowthInfo.describe(plain,at,{}).remaining);
 assert.equal(MFGrowthInfo.describe(restored,start+39*60000,{}).ready,true);assert.equal(MFGrowthInfo.describe(plain,start+39*60000,{}).ready,false);
});
