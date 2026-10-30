// Este processo acessa apenas o emulador local.
for (const k of ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy']) delete process.env[k];
process.env.NODE_USE_ENV_PROXY='0';
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {ref,set,get,query,orderByKey,limitToFirst,runTransaction,update}=require('firebase/database');
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
 // Documento legado real, criado antes das regras de revisão: só o dono migra.
 await env.withSecurityRulesDisabled(async context=>{
   await set(ref(context.database(),'farms/legacy'),{state:{...state,moedas:4321},oldMetadata:'preservar'});
 });
 const legacyDb=env.authenticatedContext('legacy').database();
 await assertSucceeds(set(ref(legacyDb,'sessions/legacy'),'legacy-session'));
 const legacyCurrent=(await get(ref(legacyDb,'farms/legacy'))).val();
 const migrated=nextDocument(legacyCurrent,{sessionId:'legacy-session',revision:0,id:'migration',state,timestamp:4});
 await assertFails(set(ref(other,'farms/legacy'),migrated));
 await assertFails(set(ref(legacyDb,'farms/legacy'),{...migrated,sessionId:'stale-session'}));
 await assertSucceeds(set(ref(legacyDb,'farms/legacy'),migrated));
 await assertFails(set(ref(legacyDb,'farms/legacy'),migrated));
 const verified=(await get(ref(legacyDb,'farms/legacy'))).val();
 if(verified.legacyStateBackup.moedas!==4321||verified.oldMetadata!=='preservar')throw Error('Migration lost original save');
 console.log('PASS: migração de revisão ausente preserva backup, exige dono/sessão e não permite reiniciar revisão.');
 await env.withSecurityRulesDisabled(async context=>{await set(ref(context.database(),'friends'),{owner:{other:1},other:{owner:1}});});
 await assertSucceeds(get(ref(other,'friends/other/owner')));
 await assertSucceeds(get(ref(other,'fertUsage/other/owner')));
 const now=Date.now();
 for(let n=1;n<=5;n++)await assertSucceeds(update(ref(other),{'fertUsage/other/owner':{start:now,n},['fertilize/owner/other/event'+n]:{gx:n,gy:2,at:now,name:'Amigo'}}));
 await assertFails(update(ref(other),{'fertUsage/other/owner':{start:now,n:6},'fertilize/owner/other/sixth':{gx:6,gy:2,at:now,name:'Amigo'}}));
 await assertFails(set(ref(other,'fertilize/owner/other/no-quota'),{gx:1,gy:1,at:now,name:'Amigo'}));
 await assertSucceeds(get(ref(own,'fertilize/owner')));
 await assertSucceeds(set(ref(own,'fertilize/owner/other/event1'),null));
 console.log('PASS: amigos fertilizam cinco vezes com quota atômica; sexta e envio sem quota negados; dono recebe e confirma.');
 console.log('PASS: 21 verificações de regras, isolamento de contas, visita, paginação, sessão e transação.');
 }finally{await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
