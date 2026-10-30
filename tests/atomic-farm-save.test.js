import test from 'node:test';import assert from 'node:assert/strict';
import {atomicFarmSave} from '../public/atomic-farm-save.js';import {nextDocument} from '../public/persistence.js';import {publicState} from '../public/public-state.js';
const current={compatVersion:1,revision:4,saveId:'old',sessionId:'s',state:{version:2,moedas:900,playerXP:400,farmName:'Recanto',inventory:{milho:{count:5}},terrenos:[{gx:1,gy:2,cultura:{tipo:'melancia',startTime:123}}],player:{gx:4,gy:5,path:[{x:5,y:5}],action:{job:'plantar'}},actionQueue:[{job:{kind:'plantar'}}],levelRewards:{secret:true}},legacyStateBackup:{secret:'backup'}};
const update=doc=>nextDocument(doc,{sessionId:'s',revision:4,id:'new',state:current.state,timestamp:123});
test('um único update atômico confirma save privado e visita na mesma revisão',async()=>{
 let writes;const sdk={ref:(db,p='')=>p,get:async()=>({val:()=>current}),update:async(ref,v)=>{assert.equal(ref,'');writes=v;}};
 const result=await atomicFarmSave({sdk,db:{},uid:'u',update});assert.equal(result.committed,true);
 assert.equal(writes['farms/u'].revision,5);assert.equal(writes['publicFarms/u'].revision,5);
 assert.deepEqual(writes['publicFarms/u'].state.terrenos,writes['farms/u'].state.terrenos);
 assert.equal(writes['farms/u'].legacyStateBackup.secret,'backup');
});
test('projeção exclui inventário, tarefas, recompensas e backups sem perder a cena',()=>{
 const state=publicState(current.state);assert.equal(state.moedas,0);assert.equal(state.playerXP,400);assert.deepEqual(state.inventory,{});assert.deepEqual(state.actionQueue,[]);assert.equal(state.levelRewards,undefined);assert.equal(state.legacyStateBackup,undefined);assert.deepEqual(state.terrenos,current.state.terrenos);assert.equal(state.player.action,null);
});
test('revisão concorrente retorna documento novo; nunca confirma uma projeção isolada',async()=>{
 let reads=0;const latest={...current,revision:5,saveId:'elsewhere'};
 const sdk={ref:(db,p='')=>p,get:async()=>({val:()=>reads++?latest:current}),update:async()=>{throw Object.assign(Error('denied'),{code:'PERMISSION_DENIED'});}};
 const result=await atomicFarmSave({sdk,db:{},uid:'u',update});assert.equal(result.committed,false);assert.equal(result.snapshot.val().saveId,'elsewhere');
});
test('erro de permissão genuíno não é disfarçado de confirmação',async()=>{
 const sdk={ref:(db,p='')=>p,get:async()=>({val:()=>current}),update:async()=>{throw Object.assign(Error('denied'),{code:'PERMISSION_DENIED'});}};
 await assert.rejects(atomicFarmSave({sdk,db:{},uid:'u',update}),{code:'PERMISSION_DENIED'});
});
