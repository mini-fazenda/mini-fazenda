import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../public/animal-production.js';import '../public/farm-economy.js';
const html=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
test('vaca e ovelha crescem e produzem um lote, sem resgate repetido',()=>{
 for(const tipo of ['vaca','ovelha']){
  const a={tipo,etapa:0,startTime:1000,totalTime:300000};const cfg=MFAnimalProduction.types[tipo];
  assert.equal(MFAnimalProduction.sync(a,300999),null);
  assert.equal(MFAnimalProduction.sync(a,301000).ready,false);
  assert.equal(MFAnimalProduction.collect(a,301000+cfg.cycle-1),null);
  const reward=MFAnimalProduction.collect(a,301000+cfg.cycle);assert.equal(reward.amount,1);assert.equal(reward.product,cfg.product);
  assert.equal(MFAnimalProduction.collect(a,301000+cfg.cycle),null);
 }
});
test('reabrir o save preserva o relógio e não acumula lotes infinitos offline',()=>{
 const a={tipo:'ovelha',etapa:2,startTime:1000,totalTime:300000};MFAnimalProduction.sync(a,301000);
 const saved=JSON.parse(JSON.stringify(a));const now=301000+10*MFAnimalProduction.types.ovelha.cycle;
 assert.equal(MFAnimalProduction.collect(saved,now).amount,1);assert.equal(MFAnimalProduction.collect(saved,now),null);assert.equal(saved.production.readyAt,now+1800000);
});
test('coleta animal espera a chegada e os 1300 ms da ação antes de entregar ao Celeiro',()=>{
 let clock=100,credited=0;const animal={gx:4,gy:4,w:2,h:2,animal:{tipo:'vaca',etapa:2,startTime:1,totalTime:1,production:{readyAt:0}}};
 const env={console,window:{MFAnimalProduction},document:{},performance:{now:()=>clock},terrenos:[animal],player:{gx:0,gy:0,path:[],currentSprite:{}},filaAcoes:[],arando:false,spriteFront:{},spriteArando:{},requestRedraw(){},findPath:(x,y,gx,gy)=>[{x:gx,y:gy}],queueArar(){},collectAnimalProduct(t){const r=MFAnimalProduction.collect(t.animal);if(r)credited+=r.amount;}};
 vm.createContext(env);vm.runInContext(html.slice(html.indexOf('const JOB_TIME ='),html.indexOf('// === PERMITIR CLIQUES NORMAIS')),env);
 assert.equal(env.queueJob(animal,'animal'),true);assert.equal(env.queueJob(animal,'animal'),false);
 clock=10000;env.processArar(0);assert.equal(credited,0);assert.equal(env.player.acaoAtual.state,'indo');
 env.player.gx=4;env.player.gy=4;env.player.path=[];env.processArar(0);clock+=1299;env.processArar(0);assert.equal(credited,0);clock++;env.processArar(0);assert.equal(credited,1);assert.equal(env.queueJob(animal,'animal'),false);
});
test('colheita inteira usa a quantidade centralizada sem multiplicar os drops',()=>{
 const env={window:{MFFarmEconomy,MFAdapter:{project:{items:{}}}},gridToScreen:()=>({x:0,y:0}),MFViewport:{width:800,height:600},canvas:{width:800,height:600},offsetX:0,offsetY:0,zoom:1,TERRA_SECA_SRC:'terra-seca.png',requestRedraw(){},addXP(){},spawnLoot:()=>{env.drops++;return true;}};
 vm.createContext(env);vm.runInContext(html.slice(html.indexOf('function tryHarvestAtTile('),html.indexOf('// ---------------------------\n// Ações: Arar')),env);
 for(const [tipo,cfg] of Object.entries(MFFarmEconomy.crops)){
  env.drops=0;const tile={gx:1,gy:1,cultura:{tipo,etapa:2}};assert.equal(env.tryHarvestAtTile(tile),true);assert.equal(env.drops,1);assert.equal(env.tryHarvestAtTile(tile),false);
 }
 assert.equal(MFFarmEconomy.crops.cenoura.saleCoins*MFFarmEconomy.crops.cenoura.yieldCount,70);assert.equal(MFFarmEconomy.crops.trigo.saleCoins*MFFarmEconomy.crops.trigo.yieldCount,300);
});
test('balde e tesoura só aparecem para produção pronta e preços dos produtos são próprios',()=>{
 const env={window:{MFAnimalProduction}};vm.createContext(env);vm.runInContext(html.slice(html.indexOf('function farmPointerAction('),html.indexOf('function refreshFarmTool(')),env);
 for(const [tipo,tool] of [['vaca','bucket'],['ovelha','shears']])assert.equal(env.farmPointerAction({animal:{tipo,etapa:2,startTime:1,totalTime:1,production:{readyAt:0}}}),tool);
 const cfg=JSON.parse(html.match(/window.__MF_PROJECT = (.*?);<\/script>/)[1]);
 for(const kind of ['vaca','ovelha']){assert.equal(cfg.items['item-'+kind].level,1);assert.equal(cfg.items['item-'+kind].growTime,300000);}
 assert.equal(cfg.items['item-leite'].saleCoins,60);assert.equal(cfg.items['item-la'].saleCoins,100);
});

test('não apaga a plantação nem concede estrelas se o inventário recusar a colheita',()=>{
 let stars=0;
 const env={window:{MFFarmEconomy,MFAdapter:{project:{items:{}}}},gridToScreen:()=>({x:0,y:0}),MFViewport:{width:800,height:600},canvas:{width:800,height:600},offsetX:0,offsetY:0,zoom:1,TERRA_SECA_SRC:'terra-seca.png',requestRedraw(){},addXP(){stars++},spawnLoot:()=>false};
 vm.createContext(env);vm.runInContext(html.slice(html.indexOf('function tryHarvestAtTile('),html.indexOf('// ---------------------------\n// Ações: Arar')),env);
 const tile={gx:1,gy:1,imgSrc:'espinafre-final.png',cultura:{tipo:'espinafre',etapa:2}};
 assert.equal(env.tryHarvestAtTile(tile),false);assert.equal(tile.cultura.tipo,'espinafre');assert.equal(tile.imgSrc,'espinafre-final.png');assert.equal(stars,0);
});
test('compra de vaca/ovelha já tem primeira coleta e intervalo começa depois dela',()=>{
 for(const [tipo,cfg]of Object.entries(MFAnimalProduction.types)){
  const now=1800000000000,animal={tipo,startTime:now,totalTime:300000,etapa:0};
  assert.equal(MFAnimalProduction.start(animal,now),true);assert.equal(MFAnimalProduction.sync(animal,now).ready,true);
  const saved=JSON.parse(JSON.stringify(animal));assert.equal(MFAnimalProduction.collect(saved,now).amount,1);assert.equal(MFAnimalProduction.collect(saved,now),null);
  assert.equal(MFAnimalProduction.sync(saved,now+cfg.cycle-1).ready,false);assert.equal(MFAnimalProduction.sync(saved,now+cfg.cycle).ready,true);
 }
});
