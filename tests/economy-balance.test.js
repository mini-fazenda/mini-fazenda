import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../public/farm-economy.js';
import '../public/fruit-trees.js';
const html=readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
const project=JSON.parse(html.match(/window.__MF_PROJECT = (.*?);<\/script>/)[1]);
const crops={cenoura:[1,10,50,14,5,1],espinafre:[1,20,100,140,1,2],trigo:[1,40,200,50,6,4],milho:[1,60,350,85,6,6],abacaxi:[2,120,500,170,5,12],morango:[3,120,400,260,3,12],cana:[4,480,1200,2400,1,32],girassol:[5,360,1000,2000,1,24],melancia:[6,240,650,365,4,24],feijao:[7,720,2000,4400,1,48],beterraba:[8,240,750,410,4,24],cafe:[10,240,1000,392,5,24],soja:[12,1080,3500,7800,1,72],cebola:[15,1080,5000,9900,1,72],arroz:[18,1440,7000,13700,1,100]};
test('15 culturas usam níveis, venda, quantidade e XP novos sem alterar custo ou duração',()=>{
 for(const [kind,expected]of Object.entries(crops)){
  const c=project.items['item-'+kind],e=MFFarmEconomy.crops[kind];
  assert.deepEqual([c.level,c.growTime/60000,c.price,c.saleCoins,c.yieldCount,c.harvestXP],expected,kind);
  assert.deepEqual([e.price,e.saleCoins,e.yieldCount,e.xp],[c.price,c.saleCoins,c.yieldCount,c.harvestXP],kind+' estoque/missões');
 }
});
test('as sete árvores exigem seus níveis e pagam direto na coleta',()=>{
 for(const [kind,level]of Object.entries({limao:2,cereja:3,maca:5,banana:6,laranja:8,sakura:10,acerola:12})){
  const c=MFFruitTrees.types[kind];assert.equal(c.level,level);assert.equal(c.directCoins,true);
  const t={itemId:'item-arvore-'+kind};MFFruitTrees.start(t,1000);assert.equal(MFFruitTrees.collect(t,1000),null);
 }
});
test('árvore pronta abaixo do novo nível continua coletável e posição é preservada',()=>{
 const now=100000000,t={gx:2,gy:3,w:2,h:2,fruitTree:{tipo:'acerola',startTime:now-3600000}};
 assert.equal(MFFruitTrees.state(t,now).ready,true);const result=MFFruitTrees.collect(t,now);
 assert.equal(result.saleCoins,1000);assert.equal(result.stars,12);assert.equal(MFFruitTrees.state(t,now).remaining,7200000);
 assert.deepEqual([t.gx,t.gy,t.w,t.h],[2,3,2,2]);
});
