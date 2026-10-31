import test from 'node:test';
import assert from 'node:assert/strict';
import {publicProjection,reconcilePublicProjection} from '../public/public-projection.js';

const save=(label)=>({
 version:2,farmName:label,moedas:1200,playerXP:500,playerLevel:4,
 COLS:25,ROWS:25,terrenos:[{gx:2,gy:3,w:2,h:2,imgSrc:'assets/terra-arada.png'}],
 inventory:{milho:{count:100}},storedObjects:[{imgSrc:'private.png'}],
 player:{gx:1,gy:1}
});

test('projeção pública associa cena ao save privado confirmado, sem divulgar inventário',()=>{
 const desired=publicProjection(save('Nova'),9,'save-9',1200);
 assert.equal(desired.saveId,'save-9');
 assert.equal(desired.state.farmName,'Nova');
 assert.deepEqual(desired.state.inventory,{});
 assert.deepEqual(desired.state.storedObjects,[]);
 const stale={state:{...desired.state,farmName:'Antiga'},revision:9,updatedAt:1100};
 assert.deepEqual(reconcilePublicProjection(stale,desired),desired,'mesma revisão sem saveId deve ser reparada');
 assert.equal(reconcilePublicProjection(desired,desired),undefined,'mesmo saveId não duplica publicação');
 assert.equal(reconcilePublicProjection({...desired,revision:10},desired),undefined,'não sobrescrever revisão pública mais recente');
});

test('cena legada sem saveId é reparada somente se estiver desatualizada',()=>{
 const desired=publicProjection(save('Legada'),0,null,1200);
 const publicDoc={...desired,updatedAt:1100};
 assert.equal(reconcilePublicProjection(publicDoc,desired),undefined,'cena idêntica não exige atualização');
 assert.deepEqual(reconcilePublicProjection({...publicDoc,state:{...desired.state,farmName:'Antes'}},desired),desired);
});
