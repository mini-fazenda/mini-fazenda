import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import '../public/farm-economy.js';
const html=readFileSync(new URL('../public/game.html',import.meta.url),'utf8'),project=JSON.parse(html.match(/window.__MF_PROJECT = (.*?);<\/script>/)[1]);
test('girassol: 6h, custo 1000, colheita inteira 2000 e 24 estrelas apenas ao colher',()=>{
 const c=project.items['item-girassol'];assert.equal(c.growTime,6*60*60*1000);assert.equal(c.price,1000);assert.equal(c.yieldCount*c.saleCoins,2000);assert.equal(c.harvestXP,24);assert.equal(c.plantXP,0);assert.equal(c.saleXP,0);assert.equal(c.firstStageRatio,.5);assert.equal(c.type,'dependente');assert.equal(c.category,'plantacoes');assert.equal(c.w*c.h,4);
 const e=MFFarmEconomy.crops.girassol;assert.equal(e.price,c.price);assert.equal(e.saleCoins*e.yieldCount,2000);assert.equal(e.xp,c.harvestXP);assert.equal(e.saleCoins*e.yieldCount-e.price,1000);
});
