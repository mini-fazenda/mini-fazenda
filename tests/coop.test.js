import test from 'node:test';import assert from 'node:assert/strict';import '../public/materials-core.js';import '../public/coop-core.js';
const C=MFCoopCore;
function complete(){const t=C.start(3,4),stock=MFMaterialsCore.create();stock.grant({madeira:8,telha:4,feno:3},'setup');C.advance(t,stock,0);C.advance(t,stock,1);return t;}
test('preço, XP e duas entregas exatas de materiais para 0, 60 e 100%',()=>{
 assert.equal(C.CONFIG.price,10000);assert.equal(C.CONFIG.xp,600);const t=C.start(3,4),s=MFMaterialsCore.create();assert.equal(t.coop.phase,0);assert.match(t.imgSrc,/etapa-0-0/);assert.equal(C.buy(t,100000,1000,'h').error,'building');
 assert.equal(C.advance(t,s,0).error,'materials');assert.equal(t.coop.phase,0);s.grant({madeira:8,telha:4,feno:3},'g');assert.equal(C.advance(t,s,0).percent,60);assert.deepEqual(s.counts(),{madeira:4,telha:2,feno:2});assert.equal(C.advance(t,s,0).error,'stale');assert.deepEqual(s.counts(),{madeira:4,telha:2,feno:2});assert.equal(C.advance(t,s,1).percent,100);assert.deepEqual(s.counts(),{madeira:0,telha:0,feno:0});assert.equal(C.advance(t,s,2).error,'complete');
});
test('cada galinha custa mil moedas, dá 5 XP e só produz após trinta minutos',()=>{
 const t=complete();assert.equal(C.buy(t,999,1000,'h').error,'coins');assert.deepEqual(C.buy(t,1000,1000,'h'),{cost:1000,xp:5});assert.equal(C.buy(t,1000,1000,'h').error,'duplicate');assert.equal(C.sync(t,1000+C.CONFIG.cycle-1),0);assert.equal(t.coop.eggs,0);assert.equal(C.sync(t,1000+C.CONFIG.cycle),1);assert.equal(C.sync(t,1000+C.CONFIG.cycle),0);assert.equal(t.coop.hens.length,1);
});
test('ovos acumulam offline por galinha, preservam fração do ciclo e vendem uma única vez',()=>{
 const t=complete();C.buy(t,1000,0,'a');C.buy(t,1000,900000,'b');const at=7200000+600000;assert.equal(C.sync(t,at),7);assert.equal(t.coop.hens[0].nextEggAt,9000000);assert.equal(t.coop.hens[1].nextEggAt,8100000);
 const saved=JSON.parse(JSON.stringify(t)),hens=JSON.stringify(saved.coop.hens);assert.deepEqual(C.sell(saved,at),{count:7,coins:280});assert.equal(C.sell(saved,at),null);assert.equal(JSON.stringify(saved.coop.hens),hens);assert.equal(C.sync(saved,8100000),1);assert.equal(saved.coop.hens.length,2);
});
test('dez galinhas rendem oitocentas moedas por hora',()=>{
 const t=complete();for(let i=0;i<10;i++)C.buy(t,1000,1000,'h'+i);assert.equal(C.buy(t,1000,1000,'extra').error,'full');assert.deepEqual(C.sell(t,3601000),{count:20,coins:800});assert.equal(t.coop.hens.length,10);
});
test('ampliações exigem nível 15/25 e 30k/70k sem consumir materiais nem reiniciar galinhas',()=>{
 const t=complete();C.buy(t,1000,1000,'h');const hens=JSON.stringify(t.coop.hens);assert.equal(C.upgrade(t,14,999999,1).error,'level');assert.equal(C.upgrade(t,15,29999,1).error,'coins');assert.deepEqual(C.upgrade(t,15,30000,1),{cost:30000,capacity:20});assert.equal(C.upgrade(t,25,999999,1).error,'stale');assert.equal(C.upgrade(t,24,70000,2).error,'level');assert.deepEqual(C.upgrade(t,25,70000,2),{cost:70000,capacity:35});assert.equal(C.upgrade(t,25,70000,3).error,'max');assert.equal(JSON.stringify(t.coop.hens),hens);
 for(let i=1;i<35;i++)assert.equal(C.buy(t,1000,2000,'h'+i).cost,1000);assert.equal(C.buy(t,1000,2000,'last').error,'full');
});
test('rotação, MiniBaú, objeto Firebase e restauração preservam obra e produção',()=>{
 const t=complete();C.buy(t,1000,1000,'h');C.sync(t,1801000);const save=JSON.parse(JSON.stringify(t));save.coop.hens={0:save.coop.hens[0]};C.normalize(save);assert.equal(save.coop.hens.length,1);const before=JSON.stringify(save.coop.hens);C.rotate(save);assert.match(save.imgSrc,/100-1/);assert.equal(save.coop.eggs,1);assert.equal(JSON.stringify(save.coop.hens),before);assert.equal(C.sync(save,3601000),1);assert.equal(save.coop.eggs,2);
 assert.equal(C.fits(C.start(18,18),20,20,[]),false);assert.equal(C.fits(C.start(0,0),20,20,[{gx:2,gy:2,w:2,h:2}]),false);assert.equal(C.fits(C.start(0,0),20,20,[]),true);
});
test('desvio fracionário do relógio do servidor não bloqueia compras nem produção',()=>{
 const t=complete();assert.equal(C.buy(t,1000,1000.5,'h').cost,1000);assert.equal(t.coop.hens[0].nextEggAt,1801000);assert.equal(C.sync(t,1801000.5),1);assert.equal(C.buy(t,1000,Infinity,'bad').error,'clock');assert.equal(C.sync(t,Infinity),0);
});
