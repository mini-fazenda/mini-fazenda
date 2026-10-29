import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextDocument} from '../public/persistence.js';
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
