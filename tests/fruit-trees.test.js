import test from 'node:test';import assert from 'node:assert/strict';import '../public/fruit-trees.js';
const core=globalThis.MFFruitTrees;
test('quatro árvores: retorno em dez colheitas e tempos/estrelas crescentes',()=>{
 const values=Object.values(core.types);assert.equal(values.length,4);
 for(const c of values)assert.equal(c.saleCoins*10,c.price);
 assert.deepEqual(values.map(c=>c.minutes),[30,40,50,60]);assert.equal(values[0].stars,150);assert.equal(values[3].stars,250);
});
for(const [type,c]of Object.entries(core.types))test(type+': três estágios, offline e coleta sem destruir ou duplicar',()=>{
 const t={itemId:'item-arvore-'+type,gx:3,gy:4,w:2,h:2};assert.equal(core.start(t,1000),true);
 assert.equal(core.sync(t,1000+c.cycle*.49).stage,0);assert.equal(core.sync(t,1000+c.cycle*.5).stage,1);
 assert.equal(core.collect(t,1000+c.cycle-1),null);
 const saved=JSON.parse(JSON.stringify(t)),now=1000+c.cycle*40;assert.equal(core.sync(saved,now).stage,2);
 assert.equal(core.collect(saved,now).saleCoins,c.price/10);assert.equal(core.collect(saved,now),null);assert.equal(saved.imgSrc,c.stages[0]);assert.equal(saved.gx,3);assert.equal(saved.fruitTree.startTime,now);
 assert.equal(core.collect(saved,now+c.cycle).amount,1);
});
