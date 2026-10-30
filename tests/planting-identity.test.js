import test from 'node:test';import assert from 'node:assert/strict';
import '../public/planting-core.js';import '../public/save-runtime.js';
test('pedido de plantio fixa espécie e preço independentemente da seleção e do catálogo posterior',()=>{
 const selection={id:'item-melancia',price:650,xp:14},seed=MFPlanting.snapshot(selection);
 const job={itemId:seed.id,price:seed.price,seed};selection.id='item-cenoura';selection.price=50;
 const result=MFPlanting.fromJob(job,{id:'item-melancia',dataset:{preco:'999',xp:'50'}});
 assert.equal(result.id,'item-melancia');assert.equal(result.price,650);
 assert.equal(MFPlanting.fromJob(job,{id:'item-cenoura',dataset:{}}),null);
 assert.equal(MFPlanting.snapshot({id:'item-milho',price:-1}),null);
});
test('cultura e animal prevalecem sobre identificador antigo ao sincronizar aparência',()=>{
 assert.equal(MFPlanting.matches({itemId:'item-cenoura',cultura:{tipo:'melancia'}},'cenoura'),false);
 assert.equal(MFPlanting.matches({itemId:'item-cenoura',cultura:{tipo:'melancia'}},'melancia'),true);
 assert.equal(MFPlanting.matches({itemId:'item-vaca',animal:{tipo:'ovelha'}},'vaca'),false);
});
test('proveniência nova corrige espécie divergente sem adivinhar culturas de saves antigos',()=>{
 const project={items:{'item-melancia':{growTime:100},'item-cenoura':{growTime:10}}};
 const old={moedas:700,terrenos:[{itemId:'item-cenoura',cultura:{tipo:'cenoura',seedId:'item-melancia',paidCoins:650,startTime:123}},{itemId:'item-melancia',cultura:{tipo:'cenoura',startTime:456}}]};
 const next=MFSaveRuntime.refresh(old,project);
 assert.equal(next.terrenos[0].cultura.tipo,'melancia');assert.equal(next.terrenos[0].cultura.paidCoins,650);assert.equal(next.terrenos[0].cultura.startTime,123);
 assert.equal(next.terrenos[1].cultura.tipo,'cenoura');assert.equal(next.moedas,700);assert.equal(old.terrenos[0].cultura.tipo,'cenoura');
});
