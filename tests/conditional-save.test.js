import test from 'node:test';import assert from 'node:assert/strict';
import {conditionalSave,isMaxRetry} from '../public/conditional-save.js';
import {nextDocument} from '../public/persistence.js';
const remote={revision:4,saveId:'old',sessionId:'s',state:{moedas:4321},adminMetadata:'keep'};
const response=(value,status=200,etag='"base"')=>new Response(JSON.stringify(value),{status,headers:etag?{ETag:etag}:{}});
const args={databaseURL:'https://firebase.test',uid:'owner',getToken:async()=> 'secret-token',active:()=>true,update:current=>nextDocument(current,{sessionId:'s',revision:4,id:'new',state:{moedas:4322},timestamp:123})};
test('ETag salva somente a versão lida, preservando backup e metadados',async()=>{
 const calls=[];const r=await conditionalSave({...args,fetchImpl:async(url,options)=>{calls.push({url,options});return options.method==='GET'?response(remote):response(JSON.parse(options.body));}});
 assert.equal(r.committed,true);assert.equal(r.snapshot.val().state.moedas,4322);assert.equal(r.snapshot.val().adminMetadata,'keep');
 assert.deepEqual(r.snapshot.val().legacyStateBackup,remote.state);
 assert.equal(calls[0].options.headers['X-Firebase-ETag'],'true');assert.equal(calls[1].options.headers['If-Match'],'"base"');
 assert.equal(new URL(calls[0].url).searchParams.get('auth'),'secret-token');assert.equal(calls[1].options.cache,'no-store');
});
test('mudança entre leitura e gravação retorna conflito sem sobrescrever versão nova',async()=>{
 let writes=0;const newer={...remote,revision:5,saveId:'other',state:{moedas:9000}};
 const r=await conditionalSave({...args,fetchImpl:async(url,o)=>o.method==='GET'?response(remote):(writes++,response(newer,412,'"new"'))});
 assert.equal(r.committed,false);assert.equal(r.snapshot.val().state.moedas,9000);assert.equal(writes,1);
});
test('resposta perdida de gravação já confirmada é reconhecida sem reaplicar',async()=>{
 let requests=0;const acknowledged={...remote,revision:5,saveId:'new'};
 const r=await conditionalSave({...args,fetchImpl:async()=>{requests++;return response(acknowledged);}});
 assert.equal(r.committed,false);assert.equal(r.snapshot.val().saveId,'new');assert.equal(requests,1);
});
test('revisão diferente não produz PUT e sessão encerrada interrompe antes da escrita',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;return response({...remote,revision:7});};
 const r=await conditionalSave({...args,fetchImpl});assert.equal(r.committed,false);assert.equal(calls,1);
 calls=0;await assert.rejects(conditionalSave({...args,active:()=>false,fetchImpl}),{code:'save/session-ended'});assert.equal(calls,0);
});
test('token expirado é renovado uma vez; permissão negada não vira gravação sem proteção',async()=>{
 const refresh=[];let calls=0;
 const r=await conditionalSave({...args,getToken:async(force)=>{refresh.push(force);return force?'new-token':'old-token';},fetchImpl:async(url,o)=>++calls===1?response({error:'expired'},401):o.method==='GET'?response(remote):response(JSON.parse(o.body))});
 assert.equal(r.committed,true);assert.deepEqual(refresh,[false,true]);
 await assert.rejects(conditionalSave({...args,fetchImpl:async()=>response({error:'denied'},403)}),{code:'PERMISSION_DENIED'});
});
test('sem ETag, timeout ou falha de rede não remove proteções nem revela token',async()=>{
 await assert.rejects(conditionalSave({...args,fetchImpl:async()=>response(remote,200,null)}),{code:'save/missing-etag'});
 await assert.rejects(conditionalSave({...args,fetchImpl:async()=>{throw Error('https://firebase.test?auth=secret-token')}}),e=>e.code==='save/network-error'&&!e.message.includes('secret-token'));
 await assert.rejects(conditionalSave({...args,timeoutMs:5,fetchImpl:async(url,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(Error('aborted'))))}),{code:'save/timeout'});
});
test('identifica maxretry com e sem prefixo Firebase',()=>{
 for(const e of [{code:'maxretry'},{code:'database/maxretry'},{message:'maxretry'}])assert.equal(isMaxRetry(e),true);
 assert.equal(isMaxRetry({code:'PERMISSION_DENIED'}),false);
});
