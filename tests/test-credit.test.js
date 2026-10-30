import test from 'node:test';import assert from 'node:assert/strict';
import {creditDocument,redeemTestCredit,TEST_CREDIT_ID} from '../public/test-credit.js';
import {nextDocument} from '../public/persistence.js';
const args={code:'986568',uid:'owner',ownerUid:'owner',sessionId:'session',timestamp:123};
const farm=()=>({revision:4,state:{moedas:30,playerXP:153,playerLevel:3,terrenos:[{gx:4,gy:4,cultura:{tipo:'arroz',startTime:456}}],inventory:{cenoura:{count:8}}}});
test('crédito soma 50000 e preserva todo o progresso, sem modificar o objeto original',()=>{
 const current=farm(),before=structuredClone(current),credited=creditDocument(current,args);
 assert.equal(credited.state.moedas,50030);assert.deepEqual({...credited.state,moedas:30},current.state);assert.deepEqual(current,before);assert.equal(credited.revision,5);
 assert.equal(credited.creditReceipts[TEST_CREDIT_ID].amount,50000);
});
test('crédito não repete após gastar moedas, salvar e entrar novamente',()=>{
 const credited=creditDocument(farm(),args),saved=nextDocument(credited,{sessionId:'session',revision:5,id:'purchase',state:{...credited.state,moedas:40000},timestamp:200});
 assert.equal(saved.creditReceipts[TEST_CREDIT_ID].amount,50000);assert.equal(creditDocument(saved,args),undefined);
 for(const change of [{code:'111111'},{ownerUid:'other'},{uid:''}])assert.equal(creditDocument(farm(),{...args,...change}),undefined);
});
test('resgate verifica ID e dono no Firebase e aborta revisão antiga',async()=>{
 let current=farm(),code='111111',owner='owner',writes=0;
 const sdk={ref:(_,p)=>p,serverTimestamp:()=>1,get:async p=>({val:()=>p.startsWith('userCodes/')?code:owner}),runTransaction:async(p,fn)=>{writes++;const next=fn(current);if(next)current=next;return {committed:!!next,snapshot:{val:()=>current}};}};
 const request={sdk,db:{},uid:'owner',sessionId:'session',revision:4,active:()=>true};
 assert.equal(await redeemTestCredit(request),null);assert.equal(writes,0);
 code='986568';owner='other';assert.equal(await redeemTestCredit(request),null);assert.equal(writes,0);
 owner='owner';assert.equal(await redeemTestCredit({...request,revision:3}),null);assert.equal(current.state.moedas,30);
 assert.deepEqual(await redeemTestCredit(request),{amount:50000,revision:5,saveId:TEST_CREDIT_ID});assert.equal(current.state.moedas,50030);
 assert.equal(await redeemTestCredit({...request,revision:5}),null);assert.equal(current.state.moedas,50030);
});
