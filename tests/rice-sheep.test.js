import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import '../public/farm-economy.js';import '../public/sales-core.js';import '../public/sheep-animation.js';
const html=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
const cfg=JSON.parse(html.match(/window.__MF_PROJECT = (.*?);<\/script>/)[1]),rice=cfg.items['item-arroz'];
test('sementes ficam em ordem de tempo mesmo quando o nível é diferente',()=>{
 const extras=fs.readFileSync(new URL('../public/extras.js',import.meta.url),'utf8'),expression=extras.match(/\.sort\((\(a, b\) => state\.tab === 'sementes'.*?)\);/)[1];
 const sort=vm.runInNewContext(expression,{state:{tab:'sementes'}});const list=[{grow:18*3600000,level:1,price:10},{grow:2*3600000,level:10,price:100},{grow:300000,level:2,price:20}].sort(sort);assert.deepEqual(list.map(i=>i.grow),[300000,7200000,64800000]);
});
test('arroz cobra 7000 e rende 10500 por colheita, com lucro de 50%',()=>{
 assert.equal(rice.growTime,86400000);assert.equal(rice.harvestXP,100);assert.equal(rice.plantXP,0);assert.equal(rice.price,7000);assert.equal(rice.saleCoins*rice.yieldCount,10500);
 const result=MFSalesCore.sell({arroz:{count:1,slotIndex:0,imgSrc:rice.lootIcon}},{arroz:1},()=>({coins:rice.saleCoins,xp:0}));assert.equal((result.total-rice.price)/rice.price,.5);
 for(const path of ['stage0','stage1','stage2','icon','lootIcon'])assert.ok(fs.existsSync(new URL('../public/'+rice[path],import.meta.url)));
});
test('arroz planta com sementes na água, muda aos 50%, amadurece em 24h e dá 100 estrelas uma vez',()=>{
 let now=1800000000000,stars=0,drops=0;
 const env={console,Date:{now:()=>now},setTimeout:()=>1,clearTimeout(){},preload(){},requestRedraw(){},window:{MFFarmEconomy,MFAdapter:{project:{items:cfg.items}}},CROP_STAGE_TABLE:{arroz:[rice.stage0,rice.stage1,rice.stage2]},CROP_TIME_TABLE:{arroz:86400000},CROP_FIRST_RATIO:{arroz:.5},placingItem:{id:'item-arroz',price:7000,xp:100},moedas:15000,moedasSpan:{textContent:''},addXP:n=>stars+=n,spawnLoot:()=>{drops++;return true;},gridToScreen:()=>({x:0,y:0}),canvas:{width:800,height:600},offsetX:0,offsetY:0,zoom:1,TERRA_SECA_SRC:'terra-seca.png'};
 vm.createContext(env);vm.runInContext(html.slice(html.indexOf('function startGrowthTimer('),html.indexOf('// Colheita (retorna terra-seca')),env);
 vm.runInContext(html.slice(html.indexOf('function plantCropAtTile('),html.indexOf("canvas.addEventListener('click'",html.indexOf('function plantCropAtTile('))),env);
 const t={gx:2,gy:2,imgSrc:'terra-arada.png'};env.plantCropAtTile(t);assert.equal(env.moedas,8000);assert.equal(stars,0);assert.equal(t.imgSrc,rice.stage0);const start=t.cultura.startTime;
 now=start+43200000-1;env.reapplyGrowthFromTime(t);assert.equal(t.cultura.etapa,0);now++;env.reapplyGrowthFromTime(t);assert.equal(t.imgSrc,rice.stage1);
 const restored=JSON.parse(JSON.stringify(t));now=start+86400000;env.reapplyGrowthFromTime(restored);assert.equal(restored.imgSrc,rice.stage2);assert.equal(restored.cultura.etapa,2);
 vm.runInContext(html.slice(html.indexOf('function tryHarvestAtTile('),html.indexOf('// ---------------------------\n// Ações: Arar')),env);
 assert.equal(env.tryHarvestAtTile(restored),true);assert.equal(stars,100);assert.equal(drops,1);assert.equal(env.tryHarvestAtTile(restored),false);assert.equal(stars,100);
});
test('ovelha existente passa a um quadrado sem perder produção ou idade',()=>{
 const t={gx:5,gy:6,w:2,h:2,visualScale:.7,imgSrc:'antiga.png',animal:{tipo:'ovelha',etapa:2,startTime:123,totalTime:300000,production:{readyAt:999}}};const saved=JSON.stringify(t.animal);MFSheepAnimation.normalize(t);assert.equal(t.w,1);assert.equal(t.h,1);assert.equal(t.visualScale,.9);assert.equal(JSON.stringify(t.animal),saved);assert.equal(t.gx,5);assert.equal(t.gy,6);
 assert.equal(cfg.items['item-ovelha'].w,1);assert.equal(cfg.items['item-ovelha'].h,1);assert.ok(96*.9<96*2*.7);
});
test('ovelha descansa, pasta e volta à posição inicial em ciclos de 20 segundos',()=>{
 assert.equal(MFSheepAnimation.frameIndex(12999),0);assert.equal(MFSheepAnimation.frameIndex(13000),0);assert.equal(MFSheepAnimation.frameIndex(13300),10);assert.ok(MFSheepAnimation.frameIndex(16000)>=20);assert.equal(MFSheepAnimation.frameIndex(19999),0);assert.equal(MFSheepAnimation.frameIndex(20000),0);
 for(let n=0;n<60000;n+=50)assert.ok(MFSheepAnimation.frameIndex(n)>=0&&MFSheepAnimation.frameIndex(n)<26);
});
