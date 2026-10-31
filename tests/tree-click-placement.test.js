import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
test('primeira compra por mousedown e segunda só por click criam Sakuras completas e cobram uma vez',()=>{
 const env={Date,Set,console,setTimeout(){},window:{},document:{querySelectorAll:()=>[],getElementById:()=>null},moedas:20000,moedasSpan:{},xp:0,ANIMAL_ADULT:{},terrenos:[],spawnedTiles:new Set(),COLS:30,ROWS:30,preload:()=>({}),preview:{},continuousSelection:true,modoColocar:'placing',selectedItem:{id:'item-arvore-sakura',tipo:'proprio',w:2,h:2,imgSrc:'assets/arvores-chao/sakura-1.png',price:5500,xp:55},addXP(n){env.xp+=n;}};
 env.placingItem={...env.selectedItem};env.globalThis=env.window;
 vm.createContext(env);vm.runInContext(fs.readFileSync(new URL('../public/fruit-trees.js',import.meta.url),'utf8'),env);
 const start=html.indexOf('function trySpawnProprioAt(gx, gy)'),end=html.indexOf('\ncanvas.addEventListener("mousedown"',start);vm.runInContext(html.slice(start,end),env);
 const clickStart=html.indexOf('  // placing mode\n'),clickEnd=html.indexOf('  const clickedTerreno',clickStart);
 vm.runInContext('function clickPlace(gx,gy){'+html.slice(clickStart,clickEnd)+'}',env);
 assert.equal(vm.runInContext('trySpawnProprioAt(4,4)',env),true);vm.runInContext('clickPlace(4,4)',env);
 env.spawnedTiles.clear();vm.runInContext('clickPlace(8,8)',env);
 assert.equal(env.terrenos.length,2);assert.equal(env.moedas,9000);assert.equal(env.xp,110);
 for(const t of env.terrenos){assert.equal(t.itemId,'item-arvore-sakura');assert.equal(t.name,'Sakura');assert.equal(t.fruitTree.tipo,'sakura');assert.equal(t.w,2);assert.equal(t.h,2);assert.ok(env.window.MFFruitTrees.collect(t,Date.now()+5400000));}
 vm.runInContext('clickPlace(8,8)',env);assert.equal(env.moedas,9000);assert.equal(env.terrenos.length,2);
});
test('compra de vaca só por click também inicializa animal e primeira produção',()=>{
 const env={Date,Set,console,setTimeout(){},window:{},document:{querySelectorAll:()=>[],getElementById:()=>null},moedas:2000,moedasSpan:{},ANIMAL_ADULT:{vaca:{totalTime:300000,adultImg:'vaca.png'}},terrenos:[],spawnedTiles:new Set(),COLS:30,ROWS:30,preload:()=>({}),preview:{},continuousSelection:true,modoColocar:'placing',selectedItem:{id:'item-vaca',tipo:'proprio',w:2,h:2,imgSrc:'vaca.png',price:750,xp:5},addXP(){},startAnimalGrowth(){},imgCache:{},Image:class{}};
 env.placingItem={...env.selectedItem};env.globalThis=env.window;
 vm.createContext(env);vm.runInContext(fs.readFileSync(new URL('../public/animal-production.js',import.meta.url),'utf8'),env);
 const start=html.indexOf('function trySpawnProprioAt(gx, gy)'),end=html.indexOf('\ncanvas.addEventListener("mousedown"',start);vm.runInContext(html.slice(start,end),env);
 const clickStart=html.indexOf('  // placing mode\n'),clickEnd=html.indexOf('  const clickedTerreno',clickStart);vm.runInContext('function clickPlace(gx,gy){'+html.slice(clickStart,clickEnd)+'}',env);
 vm.runInContext('clickPlace(8,8)',env);assert.equal(env.moedas,1250);assert.equal(env.terrenos.length,1);assert.equal(env.terrenos[0].animal.tipo,'vaca');assert.equal(env.window.MFAnimalProduction.collect(env.terrenos[0].animal).product,'leite');assert.equal(env.window.MFAnimalProduction.collect(env.terrenos[0].animal),null);
});
