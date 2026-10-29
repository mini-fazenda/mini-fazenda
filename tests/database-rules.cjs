// Este processo acessa apenas o emulador local.
for (const k of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy']) delete process.env[k];
process.env.NODE_USE_ENV_PROXY='0';
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {ref,set,get,query,orderByKey,limitToFirst,runTransaction}=require('firebase/database');
const fs=require('fs');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-mini-fazenda',database:{host:'127.0.0.1',port:9000,rules:fs.readFileSync('database.rules.json','utf8')}});
 try{
 console.log('Rules loaded');
 const own=env.authenticatedContext('owner').database(),other=env.authenticatedContext('other').database(),anon=env.unauthenticatedContext().database();
 await assertSucceeds(set(ref(own,'sessions/owner'),'session-1'));console.log('Session created');
 const state={version:2,moedas:600,playerXP:0,playerLevel:1,COLS:23,ROWS:23,player:{gx:5,gy:5},farmName:'Recanto'};
 const doc={sessionId:'session-1',revision:1,saveId:'id-1',updatedAt:1,state};
 await assertSucceeds(set(ref(own,'farms/owner'),doc));
 await assertSucceeds(get(ref(own,'farms/owner')));
 await assertFails(get(ref(other,'farms/owner')));
 await assertFails(set(ref(other,'farms/owner'),{...doc,revision:2}));
 await assertFails(get(ref(anon,'farms/owner')));
 await assertSucceeds(set(ref(own,'publicFarms/owner'),{state,updatedAt:1}));
 await assertSucceeds(get(ref(other,'publicFarms/owner')));
 await assertFails(set(ref(other,'publicFarms/owner'),{state,updatedAt:2}));
 await assertFails(get(ref(anon,'publicFarms/owner')));
 await assertSucceeds(set(ref(own,'directory/owner'),{name:'Recanto',level:1,updatedAt:1}));
 await assertSucceeds(get(query(ref(other,'directory'),orderByKey(),limitToFirst(31))));
 await assertFails(get(ref(other,'directory')));
 await assertFails(get(query(ref(other,'directory'),orderByKey())));
 await assertFails(get(query(ref(other,'directory'),orderByKey(),limitToFirst(1000))));
 await assertFails(set(ref(own,'farms/owner'),{...doc,state:{...state,moedas:999}}));
 await assertSucceeds(set(ref(own,'sessions/owner'),'session-2'));
 await assertFails(set(ref(own,'farms/owner'),{...doc,revision:2}));
 await assertSucceeds(set(ref(own,'farms/owner'),{...doc,sessionId:'session-2',revision:2,saveId:'id-2'}));
 await assertFails(set(ref(own,'farms/owner'),{...doc,sessionId:'session-2',revision:3,state:{...state,moedas:-10}}));
 // O runTransaction usado na aplicação respeita as regras da sessão e revisão.
 const {nextDocument}=await import('../public/persistence.js');
 const result=await assertSucceeds(runTransaction(ref(own,'farms/owner'),current=>nextDocument(current,{sessionId:'session-2',revision:2,id:'id-3',state,timestamp:3}),{applyLocally:false}));
 if(!result.committed)throw new Error('transaction not committed');
 await assertSucceeds(runTransaction(ref(own,'farms/owner'),current=>nextDocument(current,{sessionId:'session-2',revision:2,id:'id-3',state,timestamp:3}),{applyLocally:false}));
 console.log('PASS: 21 verificações de regras, isolamento de contas, visita, paginação, sessão e transação.');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
