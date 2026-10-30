import test from 'node:test';import assert from 'node:assert/strict';import '../public/sales-core.js';
const quote=t=>({coins:t==='cenoura'?18:5,xp:0});
test('vende seleção com quantidades parciais e discrimina o total',()=>{
 const map={cenoura:{count:10,slotIndex:0},trigo:{count:8,slotIndex:1}};
 const result=MFSalesCore.sell(map,{cenoura:4,trigo:3},quote);
 assert.equal(result.total,87);assert.equal(map.cenoura.count,6);assert.equal(map.trigo.count,5);assert.equal(result.rows.length,2);
});
test('vender tudo esvazia estoque e não permite repetir a venda',()=>{
 const map={cenoura:{count:10},trigo:{count:8}},sel={cenoura:10,trigo:8};
 assert.equal(MFSalesCore.sell(map,sel,quote).total,220);assert.deepEqual(map,{});
 assert.throws(()=>MFSalesCore.sell(map,sel,quote));
});
test('seleção inválida não altera nenhum produto',()=>{
 for(const qty of [-1,0,1.5,NaN,11]){
  const map={cenoura:{count:10},trigo:{count:8}};
  assert.throws(()=>MFSalesCore.sell(map,{trigo:3,cenoura:qty},quote));assert.equal(map.trigo.count,8);assert.equal(map.cenoura.count,10);
 }
});
