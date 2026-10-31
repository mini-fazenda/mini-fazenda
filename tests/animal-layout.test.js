import test from 'node:test';import assert from 'node:assert/strict';import '../public/animal-layout.js';import '../public/sheep-animation.js';
test('todos os animais usam dois blocos sem perder posição, orientação ou relógios',()=>{
 for(const type of Object.keys(MFAnimalLayout.scales)){
  const animal={tipo:type,etapa:2,startTime:123,totalTime:456,flipped:true,production:{readyAt:999}};
  const t={itemId:'item-'+type,gx:4,gy:6,w:2,h:2,animal:structuredClone(animal)};
  assert.equal(MFAnimalLayout.normalize(t),true);assert.deepEqual([t.w,t.h],[2,1]);assert.deepEqual([t.gx,t.gy],[4,6]);assert.deepEqual(t.animal,animal);assert.equal(MFAnimalLayout.normalize(t),false);
 }
});
test('catálogo e prévia usam a mesma área compacta; ovelha não volta a 1x1 ao carregar',()=>{
 const items={},cards=Object.fromEntries(Object.keys(MFAnimalLayout.scales).map(k=>['item-'+k,{dataset:{}}]));MFAnimalLayout.applyCatalog(items,{getElementById:id=>cards[id]});
 for(const [id,cfg]of Object.entries(items)){assert.equal(cfg.w*cfg.h,2);assert.equal(cards[id].dataset.w,'2');assert.equal(cards[id].dataset.h,'1');const preview={id,...cfg};assert.equal(MFAnimalLayout.normalize(preview),false);}
 const sheep={animal:{tipo:'ovelha',etapa:2},w:1,h:1};MFSheepAnimation.normalize(sheep);assert.deepEqual([sheep.w,sheep.h,sheep.visualScale],[2,1,.45]);
});
test('animais cabem lado a lado e construções e árvores mantêm a área original',()=>{
 const a={gx:3,gy:3,animal:{tipo:'vaca'}},b={gx:3,gy:4,animal:{tipo:'ovelha'}};MFAnimalLayout.normalize(a);MFAnimalLayout.normalize(b);
 assert.equal(a.gx<b.gx+b.w&&a.gx+a.w>b.gx&&a.gy<b.gy+b.h&&a.gy+a.h>b.gy,false);
 for(const t of [{itemId:'item-chiqueiro',w:6,h:6},{itemId:'item-celeiro',w:4,h:6},{fruitTree:{tipo:'sakura'},w:2,h:2}]){const before=structuredClone(t);assert.equal(MFAnimalLayout.normalize(t),false);assert.deepEqual(t,before);}
});
