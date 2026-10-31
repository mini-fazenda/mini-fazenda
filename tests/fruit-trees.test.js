import test from 'node:test';import assert from 'node:assert/strict';import '../public/fruit-trees.js';
const core=globalThis.MFFruitTrees;
const table={limao:[3000,35,150,30,4],cereja:[3500,45,220,35,5],maca:[4000,50,290,40,5],banana:[4500,60,380,45,6],laranja:[5000,75,520,50,8],sakura:[5500,90,690,55,9],acerola:[6000,120,1000,60,12]};
test('tabela exata de compra, tempo, lucro e XP',()=>{for(const [k,v]of Object.entries(table)){const c=core.types[k];assert.deepEqual([c.price,c.minutes,c.saleCoins,c.plantXP,c.stars],v);}});
for(const type of Object.keys(table)){
 test(type+': estágios, offline, colheita direta sem duplicação e novo ciclo',()=>{const c=core.types[type],t={itemId:'item-arvore-'+type,gx:3,gy:4,w:2,h:2};core.start(t,1000);assert.equal(core.collect(t,1000),null);assert.equal(core.sync(t,1000+c.cycle*.49).stage,0);assert.equal(core.sync(t,1000+c.cycle*.5).stage,1);const saved=JSON.parse(JSON.stringify(t));saved.gx=8;const now=1000+c.cycle*20;const result=core.collect(saved,now);assert.equal(result.saleCoins,c.saleCoins);assert.equal(result.directCoins,true);assert.equal(result.stars,c.stars);assert.equal(core.collect(saved,now),null);assert.equal(saved.imgSrc,c.stages[0]);assert.equal(saved.gx,8);assert.equal(core.sync(saved,now+c.cycle).ready,true);});
 test(type+': migração conserva prazo atual, posição, footprint e não repete',()=>{const c=core.types[type],now=100000000,old=c.previousMinutes*60000;const t={gx:7,gy:8,w:1,h:1,imgSrc:'antiga.png',fruitTree:{tipo:type,startTime:now-old*.6}};const s=core.sync(t,now);assert.ok(Math.abs(s.remaining-old*.4)<1);assert.equal(s.stage,1);assert.deepEqual([t.gx,t.gy,t.w,t.h],[7,8,1,1]);const start=t.fruitTree.startTime;assert.equal(core.migrate(t,now+1000),false);assert.equal(t.fruitTree.startTime,start);assert.equal(core.state(JSON.parse(JSON.stringify(t)),now+1000).remaining,s.remaining-1000);assert.equal(t.imgSrc,c.stages[1]);});
 test(type+': pronta antes da atualização continua pronta',()=>{const c=core.types[type],now=90000000,t={fruitTree:{tipo:type,startTime:now-c.previousMinutes*60000*3}};assert.equal(core.sync(t,now).ready,true);assert.equal(core.collect(t,now).saleCoins,c.saleCoins);assert.equal(core.collect(t,now),null);});
}
test('Aceroleira existente mantém o prazo antigo e começa 2h após coletar',()=>{
 const now=100000000,t={gx:7,gy:8,w:1,h:1,fruitTree:{tipo:'acerola',startTime:now-30*60000}};
 const start=t.fruitTree.startTime;assert.equal(core.state(t,now).remaining,30*60000);assert.equal(t.fruitTree.startTime,start);
 const result=core.collect(t,now+30*60000);assert.equal(result.saleCoins,1000);assert.equal(result.stars,12);assert.equal(result.directCoins,true);
 assert.equal(core.state(t,now+30*60000).remaining,120*60000);assert.equal(core.collect(t,now+30*60000),null);
 assert.deepEqual([t.gx,t.gy,t.w,t.h],[7,8,1,1]);
});
test('save da versão 2 mantém cycleMs e só atualiza ao coletar',()=>{
 const now=100000000,t={fruitTree:{tipo:'acerola',balanceVersion:2,cycleMs:3600000,startTime:now-1800000}};
 assert.equal(core.state(t,now).remaining,1800000);assert.equal(core.migrate(t,now),false);
 core.collect(t,now+1800000);assert.equal(t.fruitTree.cycleMs,7200000);
});
