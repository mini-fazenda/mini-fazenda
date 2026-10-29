import {selectRecovery,nextDocument,openJournal,journal} from './persistence.js';
const $=id=>document.getElementById(id);
let sdk,auth,db,disk,user,sessionId,revision=0,ready=false,visiting=false,bridge=null,initialState=null;
let connected=false,dirty=false,saving=null,localRecord=null,lastText='',saveTimer,stopConnection,stopSession;
let changing=false,lastKey=null,stopped=false,suspending=false;
const config=window.MINI_FAZENDA_FIREBASE;
const sessionKey=()=>`${config.projectId}:${user.uid}`;
const emergencyKey=()=>`mf-online:${sessionKey()}`;
function status(text){$('sync').textContent=text}
function gate(text){$('gate').hidden=false;$('message').textContent=text}
function fail(error){
  console.error(error);ready=false;stopped=true;
  gate('Não foi possível continuar com segurança. '+(error.message || String(error)));
  $('recover').hidden=!localRecord;
}
function exportBackup(){
  const value={format:'mini-fazenda-backup-v1',projectId:config.projectId,uid:user?.uid,...localRecord};
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='mini-fazenda-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
$('recover').onclick=$('backup').onclick=exportBackup;
function localReadSync(){
  const raw=localStorage.getItem(emergencyKey());
  return raw ? JSON.parse(raw) : null;
}
function persistLocal(record){
  // Escrita síncrona primeiro: também cobre pagehide, antes do IndexedDB terminar.
  localStorage.setItem(emergencyKey(),JSON.stringify(record));
  return journal(disk,'readwrite',sessionKey(),record);
}
function checkpoint(){
  if(!ready || visiting || !bridge || stopped || suspending)return;
  try{
    const state=bridge.capture(),text=JSON.stringify(state);
    if(text===lastText)return;
    lastText=text;
    localRecord={id:crypto.randomUUID(),state,baseRevision:revision,pending:true,createdAt:Date.now()};
    // Erro de disco bloqueia o jogo: não finja que o backup foi salvo.
    persistLocal(localRecord).catch(fail);
    dirty=true;
    status(connected?'Salvando…':'Sem conexão · cópia local, envio pendente');
    scheduleSave();
  }catch(e){fail(e)}
}
function scheduleSave(){if(!saveTimer)saveTimer=setTimeout(()=>{saveTimer=null;flush().catch(fail)},1200)}
function publicState(state){
  return {...state,inventory:{},moedas:0,truckOrder:null,loot:[],player:{...state.player,path:[]},aradora:{...state.aradora,path:[],fila:[]}};
}
async function publish(state){
  const name=(state.farmName || 'Minha fazenda').slice(0,12);
  await sdk.update(sdk.ref(db),{
    [`publicFarms/${user.uid}`]:{state:publicState(state),updatedAt:sdk.serverTimestamp()},
    [`directory/${user.uid}`]:{name,level:state.playerLevel || 1,updatedAt:sdk.serverTimestamp()}
  });
}
async function flush(){
  if(saving)return saving;
  if(!dirty || !connected || !ready || visiting || stopped)return;
  saving=(async()=>{
    const record=structuredClone(localRecord),base=revision,uid=user.uid;
    const result=await sdk.runTransaction(sdk.ref(db,`farms/${uid}`), current=>nextDocument(current,{
      sessionId,revision:base,id:record.id,state:record.state,timestamp:sdk.serverTimestamp()
    }),{applyLocally:false});
    if(!result.committed && result.snapshot.val()?.saveId!==record.id){throw new Error('Esta fazenda foi aberta em outra sessão ou houve um conflito. Sua cópia local foi preservada; reabra o jogo para conferir.');}
    revision=result.snapshot.val().revision;
    if(localRecord.id===record.id){
      localRecord={...record,pending:false,baseRevision:revision};dirty=false;
    }else{
      localRecord={...localRecord,baseRevision:revision};
    }
    await persistLocal(localRecord);
    $('farm-title').textContent=record.state.farmName || 'Minha fazenda';
    status(dirty?'Salvando…':'Salvo na nuvem ✓');
    // A projeção de visita não contém inventário nem identidade Google.
    try{await publish(record.state)}catch(e){status('Progresso salvo · visita aguardando atualização');console.warn(e)}
  })().finally(()=>{saving=null;if(dirty&&!stopped)scheduleSave()});
  return saving;
}
window.MFOnline={
  isVisiting:()=>visiting,
  playing:()=>ready&&!visiting&&!stopped&&!suspending,
  bootState:()=>initialState,
  changed:()=>{if(!changing)queueMicrotask(checkpoint)},
  attach(api){bridge=api;if(!visiting){ready=true;$('gate').hidden=true;checkpoint()}else $('gate').hidden=true},
  fail
};
function mount(state,visit){
  bridge=null;initialState=state;visiting=visit;suspending=false;
  $('toolbar').hidden=false;$('home').hidden=!visit;$('neighbors').hidden=visit;
  $('farm-title').textContent=visit?`Visitando: ${state.farmName || 'Fazenda'}`:state?.farmName || 'Minha fazenda';
  gate(visit?'Abrindo visita…':'Carregando sua fazenda…');
  const frame=document.createElement('iframe');frame.title=visit?'Visita à fazenda (somente visualização)':'Minha fazenda';
  frame.src='game.html';frame.allow='fullscreen';
  $('game-container').replaceChildren(frame);
  if(visit)status('Somente visualização · arraste para explorar');
}
async function boot(account){
  user=account;stopped=false;
  if(!user){ready=false;bridge=null;$('game-container').replaceChildren();$('toolbar').hidden=true;$('login').hidden=false;gate('Entre com sua conta Google para continuar.');return}
  $('login').hidden=true;gate('Buscando seu progresso na nuvem…');
  disk=await openJournal(indexedDB);
  // Persistência é solicitada ao navegador, quando suportada; pode ser negada.
  navigator.storage?.persist?.().catch(()=>{});
  const key=sessionKey();
  const records=[await journal(disk,'readonly',key),localReadSync()].filter(Boolean).sort((a,b)=>b.createdAt-a.createdAt);
  localRecord=records[0] || null;
  const target=sdk.ref(db,`farms/${user.uid}`);
  const remote=(await sdk.get(target)).val();
  const recovered=selectRecovery(remote,localRecord);
  if(recovered.conflict){
    $('use-cloud').hidden=false;
    $('use-cloud').onclick=async()=>{
      $('use-cloud').disabled=true;
      try{
        exportBackup();
        await journal(disk,'readwrite',key+':conflict:'+Date.now(),localRecord);
        localRecord={state:remote?.state || null,baseRevision:remote?.revision || 0,id:remote?.saveId || '',pending:false,createdAt:Date.now()};
        await persistLocal(localRecord);location.reload();
      }catch(e){$('use-cloud').disabled=false;fail(e)}
    };
    throw new Error('Existe uma cópia local pendente e a fazenda na nuvem mudou em outro dispositivo. Baixe o backup antes de resolver o conflito; nenhum deles foi substituído.');
  }
  revision=recovered.revision;initialState=recovered.state;
  sessionId=crypto.randomUUID();
  await sdk.set(sdk.ref(db,`sessions/${user.uid}`),sessionId);
  const latest=(await sdk.get(target)).val();
  if((latest?.revision || 0)!==revision)throw new Error('A fazenda mudou enquanto você entrava. Recarregue para buscar a versão atual.');
  dirty=!!recovered.pending;
  if(dirty)lastText=JSON.stringify(localRecord.state);else lastText='';
  stopConnection?.();stopSession?.();
  stopConnection=sdk.onValue(sdk.ref(db,'.info/connected'),snap=>{
    connected=snap.val()===true;
    if(!visiting)status(connected?(dirty?'Salvando…':'Conectado'):'Sem conexão · cópia local, envio pendente');
    if(connected)flush().catch(fail);
  });
  stopSession=sdk.onValue(sdk.ref(db,`sessions/${user.uid}`),snap=>{
    if(snap.val()!==sessionId)fail(new Error('Sua conta abriu a fazenda em outra aba ou dispositivo. Esta sessão foi pausada para evitar sobrescrever seu progresso.'));
  },fail);
  mount(initialState,false);
}
async function drain(){
  checkpoint();suspending=true;gate('Confirmando seu progresso na nuvem…');
  try{
    if(!connected&&dirty)throw new Error('Reconecte a internet para confirmar o envio antes de sair ou visitar.');
    while(dirty){if(stopped)throw new Error('A sessão foi pausada. Sua cópia local foi preservada.');await flush()}
  }catch(e){suspending=false;$('gate').hidden=true;throw e}
}
$('logout').onclick=async()=>{
  try{if(!visiting)await drain();ready=false;stopConnection?.();stopSession?.();await sdk.signOut(auth);location.reload()}
  catch(e){status(e.message)}
};
$('home').onclick=()=>{ready=false;mount(localRecord?.state || initialState,false)};
function row(uid,farm){
  if(uid===user.uid)return;
  const el=document.createElement('div');el.className='farm-row';
  const text=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');
  title.textContent=farm.name || 'Fazenda';sub.textContent=`Nível ${farm.level || 1}`;text.append(title,sub);
  const button=document.createElement('button');button.textContent='Visitar';button.onclick=async()=>{
    button.disabled=true;
    try{
      const data=(await sdk.get(sdk.ref(db,`publicFarms/${uid}`))).val();
      if(!data?.state)throw new Error('Esta fazenda ainda não está disponível.');
      await drain();ready=false;$('farms').close();mount(data.state,true);
    }catch(e){status(e.message)}finally{button.disabled=false}
  };el.append(text,button);$('farm-list').append(el);
}
async function listFarms(reset=false){
  if(reset){lastKey=null;$('farm-list').replaceChildren()}
  const options=[sdk.orderByKey(),sdk.limitToFirst(31)];if(lastKey)options.push(sdk.startAfter(lastKey));
  const snap=await sdk.get(sdk.query(sdk.ref(db,'directory'),...options));
  const entries=Object.entries(snap.val() || {});
  for(const [uid,farm] of entries.slice(0,30)){row(uid,farm);lastKey=uid}
  $('more').hidden=entries.length<=30;
  if(!entries.length&&!lastKey)$('farm-list').textContent='Ainda não há outras fazendas publicadas.';
}
$('neighbors').onclick=async()=>{try{$('farms').showModal();await listFarms(true)}catch(e){$('farm-list').textContent='Não foi possível carregar: '+e.message}};
$('more').onclick=()=>listFarms().catch(e=>status(e.message));
$('login').onclick=async()=>{
  $('login').disabled=true;
  try{await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider())}
  catch(e){gate('Não foi possível entrar: '+e.message)}finally{$('login').disabled=false}
};
setInterval(checkpoint,500);
for(const event of ['pagehide','blur'])window.addEventListener(event,()=>{checkpoint();flush().catch(fail)});
document.addEventListener('visibilitychange',()=>{if(document.hidden){checkpoint();flush().catch(fail)}});
window.addEventListener('beforeunload',e=>{checkpoint();if(dirty){e.preventDefault();e.returnValue='Há alterações aguardando envio.'}});
async function init(){
  if(!config || ['apiKey','authDomain','databaseURL','projectId','appId'].some(k=>!config[k])){
    gate('A integração está pronta para configuração. Falta preencher os dados públicos do Firebase e ativar o login Google.');return;
  }
  const version='12.5.0',base=`https://www.gstatic.com/firebasejs/${version}/`;
  const [app,authentication,database]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-database.js')]);
  sdk={...authentication,...database};const instance=app.initializeApp(config);
  auth=sdk.getAuth(instance);db=sdk.getDatabase(instance);
  await sdk.setPersistence(auth,sdk.browserLocalPersistence);
  $('login').disabled=false;
  sdk.onAuthStateChanged(auth,account=>{changing=true;boot(account).catch(fail).finally(()=>{changing=false})});
}
init().catch(fail);
