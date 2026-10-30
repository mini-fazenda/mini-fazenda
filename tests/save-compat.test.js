import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave,documentRevision,progressText} from '../public/save-compat.js';
import {nextDocument} from '../public/persistence.js';
const old={moedas:'12345',playerXP:'345',playerLevel:'4',COLS:'25',ROWS:23,terrenos:{2:{gx:'3',gy:'4',cultura:{tipo:'milho',startTime:123}},8:{gx:7,gy:8,animal:{tipo:'vaca'}}},inventory:{milho:{count:'25',imgSrc:'milho.png'}},player:{gx:'6',gy:'7',path:{2:{gx:8,gy:7}}},custom:{old:true}};
test('migra listas esparsas Firebase e números legados sem alterar o original',()=>{
 const original=structuredClone(old),s=normalizeSave(old);
 assert.equal(s.moedas,12345);assert.equal(s.playerXP,345);assert.equal(s.playerLevel,4);
 assert.equal(s.terrenos.length,2);assert.deepEqual(s.terrenos[0],{gx:3,gy:4,cultura:{tipo:'milho',startTime:123}});
 assert.equal(s.inventory.milho.count,25);assert.equal(s.player.path.length,1);
 assert.deepEqual(old,original);assert.deepEqual(normalizeSave(s),s);
});
test('campos opcionais ausentes não impedem entrada nem apagam saldo',()=>{
 const s=normalizeSave({moedas:98765});assert.equal(s.moedas,98765);assert.equal(s.playerLevel,1);
 assert.deepEqual(s.terrenos,[]);assert.deepEqual(s.player.path,[]);
 assert.equal(normalizeSave(null),null);
});
test('dados que não podem ser migrados com segurança bloqueiam sem gerar fazenda nova',()=>{
 for(const patch of [{moedas:'invalido'},{moedas:-1},{moedas:null},{terrenos:{abc:{gx:2}}},{inventory:{milho:{count:'x'}}},{player:{action:{}}}])assert.throws(()=>normalizeSave({...old,...patch}),/save\/incompatible/);
 for(const revision of ['5',-1,NaN,1.5])assert.throws(()=>documentRevision({revision}),/revision/);
});
test('migra revisão ausente uma vez e preserva documento e backup privado',()=>{
 const original={state:old,adminMetadata:{keep:true}};
 const first=nextDocument(original,{sessionId:'s',revision:0,id:'m',state:normalizeSave(old),timestamp:1});
 assert.equal(first.revision,1);assert.deepEqual(first.legacyStateBackup,old);
 assert.deepEqual(first.adminMetadata,original.adminMetadata);
 const second=nextDocument(first,{sessionId:'s',revision:1,id:'n',state:{...first.state,moedas:13000},timestamp:2});
 assert.deepEqual(second.legacyStateBackup,old);assert.equal(second.state.moedas,13000);
 assert.equal(nextDocument(second,{sessionId:'s',revision:1,id:'stale',state:{moedas:0}}),undefined);
});
test('horário e contador de atividade não disparam save contínuo; progresso dispara',()=>{
 const s=normalizeSave(old);
 assert.equal(progressText({...s,savedAt:1,activeSeconds:3}),progressText({...s,savedAt:5000,activeSeconds:4}));
 assert.notEqual(progressText(s),progressText({...s,moedas:12346}));
});
