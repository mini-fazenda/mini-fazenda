import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import '../public/coop-core.js';import '../public/materials-core.js';
test('snapshot e restauração reais do mapa mantêm fase, orientação, galinhas e ovos',()=>{
 const t=MFCoopCore.start(3,4),m=MFMaterialsCore.create();m.grant({madeira:8,telha:4,feno:3},'g');MFCoopCore.advance(t,m,0);MFCoopCore.advance(t,m,1);MFCoopCore.buy(t,1000,Date.now(),'a');MFCoopCore.rotate(t);t.coop.eggs=7;
 const html=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8'),start=html.indexOf('function getTerrenosSnapshot()'),end=html.indexOf('const USE_LOCAL_SAVE',start),env={console,Date,terrenos:[t],window:{MFCoopCore},resolveLocalFarmImage:p=>p,ANIMAL_ADULT:{}};
 vm.createContext(env);vm.runInContext(html.slice(start,end),env);const saved=JSON.parse(JSON.stringify(env.getTerrenosSnapshot()));env.restoreTerrenosFromSnapshot(saved);assert.deepEqual(JSON.parse(JSON.stringify(env.terrenos[0].coop)),saved[0].coop);assert.equal(env.terrenos[0].itemId,'item-galinheiro');assert.equal(env.terrenos[0].coop.hens.length,1);
});
test('snapshot real do MiniBaú guarda uma cópia independente da produção',()=>{
 const t=MFCoopCore.start(3,4);t.coop.phase=2;MFCoopCore.buy(t,1000,Date.now(),'a');t.coop.eggs=4;const source=fs.readFileSync(new URL('../public/object-storage.js',import.meta.url),'utf8'),start=source.indexOf('function snapshot(t)'),end=source.indexOf('\n function changed',start),env={window:{MFCoopCore},clone:x=>JSON.parse(JSON.stringify(x)),t};
 const stored=vm.runInNewContext('('+source.slice(start,end)+')(t)',env);assert.equal(stored.gx,undefined);assert.equal(stored.coop.eggs,4);assert.equal(stored.coop.hens.length,1);t.coop.eggs=99;assert.equal(stored.coop.eggs,4);const returned={...stored,gx:8,gy:8};assert.equal(MFCoopCore.sell(returned,Date.now()).coins,160);assert.equal(returned.coop.hens.length,1);
});
