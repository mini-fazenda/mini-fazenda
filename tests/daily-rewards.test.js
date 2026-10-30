import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/daily-state.js';
test('recompensa diária bloqueia resgate repetido e preserva a sequência no save',()=>{
 const m=new globalThis.MFRewardState(),grants=[];
 const t=Date.parse('2026-10-29T15:00:00Z');
 assert.equal(m.claim(i=>grants.push(i),t),true);
 assert.equal(m.claim(i=>grants.push(i),t+30000),false);
 const restored=new globalThis.MFRewardState(m.capture());
 assert.equal(restored.available(t),false);
 assert.equal(restored.claim(i=>grants.push(i),t+3*86400000),true);
 assert.deepEqual(grants,[0,1]);
});
test('virada do dia usa Brasília e o baú permanece somente prévia',()=>{
 const m=new globalThis.MFRewardState();
 m.claim(()=>{},Date.parse('2026-10-30T02:59:00Z'));
 assert.equal(m.available(Date.parse('2026-10-30T03:01:00Z')),true);
 for(let i=0;i<5;i++)m.claim(()=>{},Date.parse('2026-10-31T12:00:00Z')+i*86400000);
 assert.equal(m.capture().claimed,6);assert.equal(m.available(Date.parse('2026-11-20T12:00:00Z')),false);
});
