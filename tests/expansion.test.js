import test from 'node:test';import assert from 'node:assert/strict';
import '../public/expansion-core.js';
const c=globalThis.MFExpansionCore;
test('expansões em ordem: custo, nível, saldo e borda do rio fixa na terceira',()=>{
 let state,cols=20,rows=20,coins=420000;
 assert.match(c.plan(state,cols,rows,2,50,coins).error,/anterior/);
 assert.match(c.plan(state,cols,rows,1,1,19999).error,/insuficientes/);
 for(const id of [1,2,3]){
  if(id>1)assert.match(c.plan(state,cols,rows,id,id===2?24:49,coins).error,/nível/);
  const p=c.plan(state,cols,rows,id,50,coins);assert.equal(p.error,undefined);({state,cols,rows,coins}=p);
  assert.equal(c.plan(state,cols,rows,id,50,coins).error,'Comprada ✓');
 }
 assert.deepEqual([cols,rows,coins],[54,64,0]);assert.deepEqual([state.shiftX,state.shiftY],[12,22]);assert.deepEqual(state.applied,[1,2,3]);
});
test('migração mantém fazendas legadas, reconhece compras e nunca desloca no login',()=>{
 for(const [cols,rows,n]of [[20,20,0],[25,23,0],[32,32,1],[44,44,2],[54,64,3],[80,80,3]]){
 const a=c.normalize(null,cols,rows);assert.equal(a.applied.length,n);assert.equal(a.shiftX,0);assert.equal(a.shiftY,0);assert.deepEqual(c.normalize(a,cols,rows),a);
 }
 const p=c.plan(null,25,23,1,1,20000);assert.deepEqual([p.cols,p.rows],[37,35]);
});

import {publicState} from '../public/public-state.js';
test('visitas recebem dimensões e origem do cenário sem publicar saldo',()=>{const expansions={version:1,applied:[1,2],shiftX:12,shiftY:12},s=publicState({COLS:44,ROWS:44,moedas:100,expansions,player:{gx:17,gy:17}});assert.deepEqual(s.expansions,expansions);assert.equal(s.COLS,44);assert.equal(s.moedas,0);});
