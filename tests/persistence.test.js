import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextDocument,recoverPendingState} from '../public/persistence.js';
const state={moedas:123,inventory:{milho:{count:6}},farmName:'Recanto'};
test('grava na revisão esperada, mantendo o estado completo',()=>{
 const saved=nextDocument({revision:4},{sessionId:'new',revision:4,id:'x',state,timestamp:1});
 assert.equal(saved.revision,5);assert.equal(saved.sessionId,'new');assert.deepEqual(saved.state,state);
});
test('não sobrescreve uma revisão mais recente',()=>{
 assert.equal(nextDocument({revision:5},{sessionId:'old',revision:4,id:'x',state,timestamp:1}),undefined);
});
test('confirmação repetida não reaplica o save',()=>{
 assert.equal(nextDocument({revision:5,saveId:'x'},{sessionId:'new',revision:4,id:'x',state,timestamp:1}),undefined);
});
test('primeira gravação funciona sem cache inicial da transação',()=>{
 assert.equal(nextDocument(null,{sessionId:'new',revision:0,id:'x',state,timestamp:1}).revision,1);
});

const remote={revision:5,saveId:'confirmed',sessionId:'old-session',state:{moedas:100}};
const recovery={state:{moedas:200},revision:5,baseSaveId:'confirmed',sessionId:'old-session',inFlightId:'in-flight',at:1000};
test('recupera alteração pendente da mesma base confirmada',()=>{
 assert.deepEqual(recoverPendingState(remote,recovery,1100),{moedas:200});
});
test('recupera após confirmação do save em trânsito sem descartar a alteração mais recente',()=>{
 assert.deepEqual(recoverPendingState({...remote,revision:6,saveId:'in-flight'},recovery,1100),{moedas:200});
});
test('não recupera sobre revisão mais recente de outra sessão, mesmo número com ID diferente ou mais de uma revisão',()=>{
 for(const r of [{...remote,revision:6,saveId:'other'},{...remote,saveId:'other'},{...remote,revision:7,saveId:'in-flight'},{...remote,revision:6,saveId:'in-flight',sessionId:'other'}])assert.equal(recoverPendingState(r,recovery,1100),null);
});
test('recuperação expirada ou incompleta não substitui a nuvem',()=>{
 for(const r of [null,{...recovery,at:NaN},{...recovery,at:100000},{...recovery,revision:-1},{...recovery,state:null}])assert.equal(recoverPendingState(remote,r,1100),null);
 assert.equal(recoverPendingState(remote,recovery,86401001),null);
});
test('preserva início de fazenda ainda sem primeira gravação',()=>{
 assert.deepEqual(recoverPendingState(null,{...recovery,revision:0,baseSaveId:null},1100),{moedas:200});
});
