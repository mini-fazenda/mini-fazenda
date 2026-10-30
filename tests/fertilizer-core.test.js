import test from 'node:test';import assert from 'node:assert/strict';import '../public/fertilizer-core.js';
const start=1800000000000;
const crop=()=>({gx:2,gy:4,cultura:{tipo:'cenoura',startTime:start,totalTime:6000000,etapa:0}});
test('adubo mantém porcentagem atual e reduz tempo restante 35%, sem somar',()=>{
 const t=crop(),key=MFFertilizerCore.key(t),at=start+1200000;
 assert.equal(MFFertilizerCore.apply(t,{key,at}),true);
 assert.equal((at-t.cultura.startTime)/t.cultura.totalTime,.2);
 assert.equal(t.cultura.startTime+t.cultura.totalTime-at,4800000*.65);
 const saved=structuredClone(t);assert.equal(MFFertilizerCore.apply(t,{key,at:at+10}),false);assert.deepEqual(t,saved);
 assert.equal(MFFertilizerCore.key(t),key);
});
test('replantio não recebe evento do cultivo antigo e adubo vale offline pelo horário do evento',()=>{
 const t=crop(),key=MFFertilizerCore.key(t);t.cultura.startTime+=100;
 assert.equal(MFFertilizerCore.apply(t,{key,at:start+1000}),false);
 const old=crop();assert.equal(MFFertilizerCore.apply(old,{key,at:start+3000000}),true);
 assert.equal(old.cultura.startTime+old.cultura.totalTime,start+4950000);
});
