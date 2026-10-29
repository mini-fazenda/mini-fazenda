import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectRecovery,nextDocument} from '../public/persistence.js';
const state={moedas:123,terrenos:[{gx:1,gy:2,animal:{milk:{progress:76}}}],inventory:{milho:{count:6}},farmName:'Recanto'};
test('primeira entrada e entrada sem pendência usam o estado da nuvem',()=>{
 assert.deepEqual(selectRecovery(null,null),{state:null,revision:0});
 assert.equal(selectRecovery({state,revision:3},null).state,state);
});
test('reabre alterações offline quando a revisão da nuvem não mudou',()=>{
 const r=selectRecovery({state:{moedas:10},revision:3},{pending:true,baseRevision:3,state});
 assert.equal(r.state,state);assert.equal(r.pending,true);
});
test('confirmação perdida não reaplica recompensa nem incrementa revisão',()=>{
 const remote={revision:4,sessionId:'s',saveId:'i',state};
 assert.deepEqual(selectRecovery(remote,{pending:true,id:'i',baseRevision:3,state}),{state,revision:4});
 assert.equal(nextDocument(remote,{sessionId:'s',revision:3,id:'i',state,timestamp:1}),undefined);
});
test('conflito entre dispositivos preserva a cópia local e não substitui a nuvem',()=>{
 assert.deepEqual(selectRecovery({revision:8},{pending:true,baseRevision:7,state}),{conflict:true});
 assert.equal(nextDocument({revision:8},{sessionId:'s',revision:7,id:'x',state,timestamp:1}),undefined);
});
test('save atômico mantém inventário, produção, nome e revisão',()=>{
 const doc=nextDocument({revision:2},{sessionId:'s',revision:2,id:'x',state,timestamp:10});
 assert.equal(doc.revision,3);assert.deepEqual(doc.state,state);
 assert.equal(nextDocument(null,{sessionId:'s',revision:0,id:'x',state,timestamp:1}).revision,1);
});
