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

test('venda selecionada credita saldo antes de retirar estoque e preserva os demais produtos',()=>{
 const map={espinafre:{count:4,slotIndex:0},cenoura:{count:5,slotIndex:1}};let balance=1000;
 const wallet={get:()=>balance,set:n=>{assert.equal(map.espinafre.count,4);balance=n;}};
 const result=MFSalesCore.sell(map,{espinafre:2},()=>({coins:140,xp:0}),wallet);
 assert.equal(balance,1280);assert.equal(result.total,280);assert.equal(map.espinafre.count,2);assert.equal(map.cenoura.count,5);
});
test('crédito recusado ou sem efeito não remove os produtos',()=>{
 for(const mode of ['throw','ignore','partial']){
  const map={espinafre:{count:4},cenoura:{count:5}};let balance=1000;
  const wallet={get:()=>balance,set:n=>{if(n===1000){balance=n;return;}if(mode==='throw')throw Error('Falha no crédito');if(mode==='partial'){balance=1001;throw Error('Falha após crédito parcial');}}};
  assert.throws(()=>MFSalesCore.sell(map,{espinafre:4},()=>({coins:140,xp:0}),wallet));
  assert.equal(balance,1000);assert.equal(map.espinafre.count,4);assert.equal(map.cenoura.count,5);
 }
});
test('preço zero, saldo inválido ou overflow não permitem perder estoque',()=>{
 for(const [balance,price]of [[1000,0],[NaN,140],[-1,140],['1000',140],[Number.MAX_SAFE_INTEGER,140]]){
  const map={espinafre:{count:4}};let current=balance;
  assert.throws(()=>MFSalesCore.sell(map,{espinafre:4},()=>({coins:price,xp:0}),{get:()=>current,set:n=>{current=n;}}));
  assert.equal(map.espinafre.count,4);assert.ok(Object.is(current,balance));
 }
});
