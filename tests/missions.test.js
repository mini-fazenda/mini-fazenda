import test from 'node:test';import assert from 'node:assert/strict';import '../public/farm-economy.js';
test('primeiras cinco missões usam somente culturas disponíveis e venda mais bônus',()=>{
 const api=MFMissions;api.restore({});
 for(let n=1;n<=5;n++){
  const order=api.next();assert.equal(order.mission,n);
  const base=order.pedidos.reduce((sum,p)=>sum+MFFarmEconomy.crops[p.tipo].saleCoins*p.qtd,0);
  assert.equal(order.recompensa,base+order.bonusExtra);assert.ok(order.bonusExtra>=200);
  assert.equal(api.complete(order),false);
  order.pedidos.forEach(p=>p.entregue=p.qtd);assert.equal(api.complete(order),true);assert.equal(api.complete(order),false);
 }
 assert.equal(api.next(),null);
});
test('segunda missão usa os preços por unidade rebalanceados',()=>{
 MFMissions.restore({});let o=MFMissions.next();o.pedidos.forEach(p=>p.entregue=p.qtd);MFMissions.complete(o);o=MFMissions.next();assert.equal(o.recompensaBase,1540);assert.equal(o.recompensa,1840);
 const saved=MFMissions.capture();MFMissions.restore(saved);assert.equal(MFMissions.next().mission,2);
});
test('toda cultura vende por mais que custa e culturas longas rendem mais estrelas',()=>{
 for(const c of Object.values(MFFarmEconomy.crops))assert.ok(c.saleCoins*c.yieldCount>c.price);
 assert.equal(MFFarmEconomy.crops.cenoura.xp,1);assert.ok(MFFarmEconomy.crops.trigo.xp>1);assert.ok(MFFarmEconomy.crops.cana.xp>MFFarmEconomy.crops.trigo.xp);
});
test('loja e missão compartilham os preços e estrelas',async()=>{
 const {readFile}=await import('node:fs/promises');const html=await readFile(new URL('../public/game.html',import.meta.url),'utf8');
 const cfg=JSON.parse(html.match(/window.__MF_PROJECT = (.*?);<\/script>/)[1]);
 for(const [type,values] of Object.entries(MFFarmEconomy.crops)){
  const item=cfg.items['item-'+type];assert.equal(item.price,values.price);assert.equal(item.saleCoins,values.saleCoins);assert.equal(item.xp,values.xp);assert.equal(item.harvestXP,values.xp);
 }
});
