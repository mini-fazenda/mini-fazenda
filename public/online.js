import {nextDocument,clearLegacySaves} from './persistence.js?v=account-v3';
import {redeemTestCredit} from './test-credit.js?v=1';
import {startFriends,stopFriends,publishProfile,api as friendsApi} from './friends.js?v=permissao-fert-1';
const $=id=>document.getElementById(id);
const config=window.MINI_FAZENDA_FIREBASE;
let sdk,auth,db,user,sessionId,revision=0,epoch=0;
let ready=false,connected=false,sessionActive=false,stopped=false,visiting=false,suspending=false,visitingUid=null;
let bridge=null,initialState=null,ownState=null,pending=null,saving=null,lastText='',lastKey=null;
let stopConnection,stopSession,resolveConnection,connectionReady,projectionTimer,retryTimer,reconnectTimer;
let retryDelay=1000,loginAttempt=false;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const transient=e=>['unavailable','database/network-error','network-request-failed','auth/network-request-failed','disconnected'].some(x=>String(e?.code||'').includes(x));
function retryPending(){if(stopped||!pending)return;clearTimeout(retryTimer);status('Sincronização pendente…');retryTimer=setTimeout(()=>{if(stopped)return;if(connected&&sessionActive)void flush().catch(e=>{console.warn('[sync retry]',e);retryPending()});else retryPending()},retryDelay);retryDelay=Math.min(retryDelay*2,30000)}
let clockOffset=0; // diferença entre o relógio do aparelho e o do servidor (anti-troca de data)
function status(text){$('sync').textContent=text}
function gate(text){$('farms').close();$('gate').hidden=false;$('message').textContent=text}
function freeze(){ready=false;sessionActive=false;stopped=true;pending=null;clearTimeout(retryTimer);clearTimeout(reconnectTimer);clearTimeout(projectionTimer);$('game-container').replaceChildren();bridge=null;$('toolbar').hidden=true}
function fail(error){
  if(stopped)return;
  console.error(error);freeze();gate('Não foi possível conectar à fazenda. Recarregue a página para tentar novamente.');
}
async function disconnectPrevious(){
  if(stopped)return;
  freeze();stopSession?.();
  await sdk.signOut(auth);
  gate('Sua conta entrou em outro dispositivo ou aba. Esta sessão foi desconectada.');
}
function playing(){return ready&&connected&&sessionActive&&!stopped&&!visiting&&!suspending}
function checkpoint(){
  if(!playing()||!bridge)return;
  try{
    const state=bridge.capture(),text=JSON.stringify(state);
    if(text===lastText)return;
    lastText=text;ownState=state;pending={id:crypto.randomUUID(),state};
    // Cópia de emergência somente desta aba para recargas durante falhas de rede.
    try{sessionStorage.setItem('mf-recovery-v2:'+user.uid,JSON.stringify({state,revision,at:Date.now()}))}catch(e){console.warn('[recovery storage]',e)}
    // Alterações são enviadas imediatamente. Não há gravação do progresso no navegador.
    void flush().catch(e=>{console.warn('[save]',e);retryPending()});
  }catch(e){fail(e)}
}
function publicState(state){
  // Saves anteriores podem não conter farmName. O Firebase exige string em publicFarms.
  const farmName=typeof state.farmName==='string'&&state.farmName.trim()?state.farmName.slice(0,12):'Fazenda';
  return {...state,farmName,inventory:{},moedas:0,truckOrder:null,loot:[],player:{...state.player,path:[]},aradora:{...state.aradora,path:[],fila:[]}};
}
function scheduleProjection(state,version,run){
  clearTimeout(projectionTimer);
  projectionTimer=setTimeout(async()=>{
    if(run!==epoch||!sessionActive||!connected||stopped)return;
    try{
      // As projeções também usam revisão: uma publicação atrasada não substitui uma nova.
      const uid=user.uid;
      await sdk.runTransaction(sdk.ref(db,`publicFarms/${uid}`),current=>{
        if(current?.revision>version)return;
        return {state:publicState(state),revision:version,updatedAt:sdk.serverTimestamp()};
      },{applyLocally:false});
      if(run!==epoch||!sessionActive||stopped)return;
      await sdk.update(sdk.ref(db),{
        [`directory/${uid}`]:{name:(state.farmName||'Minha fazenda').slice(0,12),level:state.playerLevel||1,updatedAt:sdk.serverTimestamp()}
      });
      void publishProfile(state);
    }catch(e){console.warn('Atualização de visita',e)}
  },500);
}
async function flush(){
  if(saving)return saving;
  if(!pending||!connected||!sessionActive||stopped||visiting||!ready)return;
  const run=epoch,uid=user.uid,token=sessionId;
  let failed=false;
  const operation=(async()=>{
    while(pending&&connected&&sessionActive&&!stopped&&run===epoch){
      const record=pending,base=revision;
      const result=await sdk.runTransaction(sdk.ref(db,`farms/${uid}`),current=>{
        if(run!==epoch||!sessionActive||stopped)return;
        return nextDocument(current,{sessionId:token,revision:base,id:record.id,state:record.state,timestamp:sdk.serverTimestamp()});
      },{applyLocally:false});
      if(run!==epoch||stopped||!sessionActive)return;
      if(!result.committed&&result.snapshot.val()?.saveId!==record.id){
        const currentToken=(await sdk.get(sdk.ref(db,`sessions/${uid}`))).val();
        if(currentToken!==token){await disconnectPrevious();return}
        // Outra gravação da mesma sessão foi confirmada: atualiza a revisão e tenta novamente.
        const remoteRevision=Number(result.snapshot.val()?.revision);
        if(Number.isSafeInteger(remoteRevision)&&remoteRevision>revision){revision=remoteRevision;continue}
        throw new Error('save/revision-conflict');
      }
      revision=result.snapshot.val().revision;
      if(pending?.id===record.id)pending=null;
      ownState=record.state;
      try{const k='mf-recovery-v2:'+uid,s=JSON.parse(sessionStorage.getItem(k)||'null');if(s&&JSON.stringify(s.state)===JSON.stringify(record.state))sessionStorage.removeItem(k)}catch{}
      $('farm-title').textContent=record.state.farmName||'Minha fazenda';
      retryDelay=1000;clearTimeout(retryTimer);status('Online');scheduleProjection(record.state,revision,run);
    }
  })();
  saving=operation;
  try{await operation}
  catch(e){
    failed=true;
    if(run!==epoch||stopped)return;
    if(e.code==='PERMISSION_DENIED'||e.code==='permission-denied'){
      const currentToken=await sdk.get(sdk.ref(db,`sessions/${uid}`)).then(s=>s.val()).catch(()=>null);
      if(currentToken&&currentToken!==token){await disconnectPrevious();return}
    }
    throw e;
  }finally{
    if(saving===operation)saving=null;
    if(!failed&&pending&&connected&&sessionActive&&!stopped&&run===epoch)queueMicrotask(()=>flush().catch(e=>{console.warn('[sync]',e);retryPending()}));
  }
}

/* Fullscreen belongs to the parent page, never the game iframe: the online HUD
   (Friends, Home, Logout and dialog) must remain inside the fullscreen root. */
function isHostFullscreen(){
  const el=document.fullscreenElement || document.webkitFullscreenElement ||
    document.mozFullScreenElement || document.msFullscreenElement;
  return el===document.documentElement;
}
function requestHostFullscreen(){
  const root=document.documentElement;
  const fn=root.requestFullscreen || root.webkitRequestFullscreen ||
    root.mozRequestFullScreen || root.msRequestFullscreen;
  if(!fn)return Promise.resolve(false);
  try{return Promise.resolve(fn.call(root)).then(()=>true).catch(e=>{
    console.warn('Tela cheia não suportada neste navegador:',e);return false;
  })}catch(e){console.warn('Tela cheia:',e);return Promise.resolve(false)}
}
function exitHostFullscreen(){
  const fn=document.exitFullscreen || document.webkitExitFullscreen ||
    document.mozCancelFullScreen || document.msExitFullscreen;
  if(!fn || !isHostFullscreen())return Promise.resolve(false);
  try{return Promise.resolve(fn.call(document)).then(()=>true).catch(e=>{
    console.warn('Não foi possível sair da tela cheia:',e);return false;
  })}catch(e){console.warn('Sair da tela cheia:',e);return Promise.resolve(false)}
}

window.MFOnline={
  isFullscreen:isHostFullscreen,
  requestFullscreen:requestHostFullscreen,
  exitFullscreen:exitHostFullscreen,
  isVisiting:()=>visiting,playing,
  visitingUid:()=>visiting?visitingUid:null,
  bootState:()=>initialState,
  friends:friendsApi,
  myCode:()=>friendsApi.myCode(),
  changed:()=>queueMicrotask(checkpoint),
  // Relógio do servidor: mudar a data do celular não adianta o jogo.
  clockOffset:()=>clockOffset,
  async serverTime(){
    if(!sdk||!db||!user)return Date.now()+clockOffset;
    try{
      const r=sdk.ref(db,`clock/${user.uid}`);
      await sdk.set(r,sdk.serverTimestamp());
      const v=Number((await sdk.get(r)).val());
      if(Number.isFinite(v)&&v>0)return v;
    }catch(e){console.warn('[relógio]',e)}
    return Date.now()+clockOffset; // regras antigas: usa a diferença informada pelo Firebase
  },
  attach(api){
    if(stopped)return;
    bridge=api;ready=true;
    if(connected&&sessionActive){$('gate').hidden=true;if(!visiting)checkpoint()}
  },fail
};
function mount(state,visit){
  ready=false;bridge=null;initialState=state;visiting=visit;suspending=false;
  $('toolbar').hidden=false;$('home').hidden=!visit;$('neighbors').hidden=true; // Amigos agora fica só na barra de baixo do jogo
  $('farm-title').textContent=visit?`Visitando: ${state.farmName||'Fazenda'}`:state?.farmName||'Minha fazenda';
  gate(visit?'Abrindo visita…':'Carregando sua fazenda…');
  const frame=document.createElement('iframe');frame.title=visit?'Visita à fazenda (somente visualização)':'Minha fazenda';
  frame.src='game.html?v=fertilizar-permissoes-1';frame.allow='fullscreen';$('game-container').replaceChildren(frame);
  status(visit?'Somente visualização':'Online');
}
async function reconnect(run){
  try{
    const token=(await sdk.get(sdk.ref(db,`sessions/${user.uid}`))).val();
    if(run!==epoch||!connected||stopped)return;
    if(token!==sessionId){await disconnectPrevious();return}
    sessionActive=true;
    if(ready){$('gate').hidden=true;await flush();if(!visiting)checkpoint()}
  }catch(e){if(run===epoch&&connected&&!stopped){console.warn('[reconnect]',e);status('Reconectando…');clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{if(run===epoch&&connected&&!stopped)void reconnect(run)},3000)}}
}
async function boot(account){
  const run=++epoch;
  stopConnection?.();stopSession?.();clearTimeout(projectionTimer);clearTimeout(retryTimer);clearTimeout(reconnectTimer);retryDelay=1000;
  ready=false;sessionActive=false;connected=false;stopped=false;bridge=null;pending=null;saving=null;
  user=account;ownState=null;lastText='';$('game-container').replaceChildren();$('toolbar').hidden=true;
  if(!user){stopFriends();$('login').hidden=false;gate('Entre com sua conta Google para continuar.');return}
  $('login').hidden=true;gate('Conectando à sua fazenda…');
  connectionReady=new Promise(resolve=>{resolveConnection=resolve});
  let claimed=false;
  stopConnection=sdk.onValue(sdk.ref(db,'.info/connected'),snap=>{
    if(run!==epoch||stopped)return;
    const online=snap.val()===true;
    if(!online){
      // Capture uma última alteração em memória antes de bloquear a simulação.
      if(connected)checkpoint();
      connected=false;sessionActive=false;
      gate('Conexão interrompida. Reconectando…');status('Reconectando…');return;
    }
    connected=true;resolveConnection?.();
    if(claimed)void reconnect(run);
  },e=>{console.warn('[connection listener]',e);status('Conexão indisponível');});
  await connectionReady;
  if(run!==epoch)return;
  sessionId=crypto.randomUUID();
  // Primeiro invalide a sessão anterior, depois leia a última versão confirmada.
  await sdk.set(sdk.ref(db,`sessions/${user.uid}`),sessionId);
  if(run!==epoch||stopped)return;
  const token=(await sdk.get(sdk.ref(db,`sessions/${user.uid}`))).val();
  if(run!==epoch)return;
  if(token!==sessionId){await disconnectPrevious();return}
  const remote=(await sdk.get(sdk.ref(db,`farms/${user.uid}`))).val();
  if(run!==epoch||stopped)return;
  revision=remote?.revision||0;ownState=remote?.state||null;
  // Recuperação conservadora: nunca substitui um save remoto mais novo.
  try{
    const recovery=JSON.parse(sessionStorage.getItem('mf-recovery-v2:'+user.uid)||'null');
    if(recovery?.state&&Number(recovery.revision)===revision&&Date.now()-recovery.at<86400000){
      ownState=recovery.state;
      lastText='';
      console.warn('[recovery] progresso pendente desta aba restaurado');
    }else if(recovery)sessionStorage.removeItem('mf-recovery-v2:'+user.uid);
  }catch(e){console.warn('[recovery]',e)}
  // Resgate autenticado, atômico e único, antes de abrir o jogo ou permitir saves.
  if(ownState){
    try{
      const credit=await redeemTestCredit({sdk,db,uid:user.uid,sessionId,revision,active:()=>run===epoch&&!stopped});
      if(run!==epoch||stopped)return;
      if(credit){revision=credit.revision;ownState={...ownState,moedas:ownState.moedas+credit.amount};lastText='';}
    }catch(e){console.warn('[crédito de teste]',e)}
  }
  if(run!==epoch||stopped)return;
  claimed=true;sessionActive=true;
  stopSession=sdk.onValue(sdk.ref(db,`sessions/${user.uid}`),snap=>{
    if(run===epoch&&!stopped&&snap.val()!==null&&snap.val()!==sessionId)void disconnectPrevious();
  },e=>{console.warn('[session listener]',e);status('Verificando sessão…')});
  mount(ownState,false);
  void startFriends({sdk,db,uid:user.uid,visit:visitFarm,applyFertilize}).then(()=>{if(run===epoch&&ownState)void publishProfile(ownState)}).catch(e=>console.warn('[amigos]',e));
}
async function drain(){
  checkpoint();suspending=true;gate('Aguarde…');
  try{
    if(!connected||!sessionActive)throw new Error('Aguarde a conexão voltar.');
    await flush();
    if(stopped)return false;
    if(pending)throw new Error('Ainda há progresso sem confirmação do servidor. Aguarde a sincronização antes de visitar amigos.');
    return true;
  }catch(e){suspending=false;if(connected)$('gate').hidden=true;throw e}
}
$('logout').onclick=async()=>{
  try{
    if(!visiting&&!await drain())return;
    freeze();stopConnection?.();stopSession?.();await sdk.signOut(auth);
  }catch(e){status(e.message)}
};
$('home').onclick=async()=>{
  if(!connected||!sessionActive||stopped)return;
  try{
    gate('Abrindo sua fazenda…');
    const remote=(await sdk.get(sdk.ref(db,`farms/${user.uid}`))).val();
    if(stopped)return;
    revision=remote?.revision||0;ownState=remote?.state||null;lastText='';mount(ownState,false);
  }catch(e){fail(e)}
};
// Fertilizações dos amigos: só aplica com a própria fazenda aberta e o jogo pronto.
function applyFertilize(list){
  if(!ready||visiting||!bridge||stopped)return false;
  const game=$('game-container').querySelector('iframe')?.contentWindow;
  if(!game?.MFFertilize)return false;
  try{game.MFFertilize.apply(list);queueMicrotask(checkpoint);return true}catch(e){console.warn('[fertilizar]',e);return true}
}
// Abre a fazenda de outra pessoa em modo visita (somente olhar).
async function visitFarm(uid){
  if(!user||uid===user.uid||!connected||!sessionActive||stopped)return false;
  try{
    if(!await drain())return false;
    const data=(await sdk.get(sdk.ref(db,`publicFarms/${uid}`))).val();
    if(stopped)return false;
    if(!data?.state){suspending=false;$('gate').hidden=true;throw new Error('Esta fazenda ainda não está disponível.')}
    visitingUid=uid;mount(data.state,true);return true;
  }catch(e){suspending=false;if(connected&&!stopped)$('gate').hidden=true;status(e.message);throw e}
}
function row(uid,farm){
  if(uid===user.uid)return;
  const el=document.createElement('div');el.className='farm-row';
  const text=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');
  title.textContent=farm.name||'Fazenda';sub.textContent=`Nível ${farm.level||1}`;text.append(title,sub);
  const button=document.createElement('button');button.textContent='Visitar';button.onclick=async()=>{
    button.disabled=true;
    try{
      if(!await drain())return;
      const data=(await sdk.get(sdk.ref(db,`publicFarms/${uid}`))).val();
      if(stopped)return;
      if(!data?.state){suspending=false;$('gate').hidden=true;throw new Error('Esta fazenda ainda não está disponível.')}
      mount(data.state,true);
    }catch(e){suspending=false;if(connected&&!stopped)$('gate').hidden=true;status(e.message)}finally{button.disabled=false}
  };el.append(text,button);$('farm-list').append(el);
}
async function listFarms(reset=false){
  if(reset){lastKey=null;$('farm-list').replaceChildren()}
  const options=[sdk.orderByKey(),sdk.limitToFirst(31)];if(lastKey)options.push(sdk.startAfter(lastKey));
  const snap=await sdk.get(sdk.query(sdk.ref(db,'directory'),...options));
  const entries=Object.entries(snap.val()||{});
  for(const [uid,farm]of entries.slice(0,30)){row(uid,farm);lastKey=uid}
  $('more').hidden=entries.length<=30;
  if(!entries.length&&!lastKey)$('farm-list').textContent='Ainda não há outras fazendas publicadas.';
}
$('neighbors').onclick=async()=>{
  // A janela de amigos fica dentro do jogo; a lista antiga só aparece se o jogo não tiver carregado.
  const game=$('game-container').querySelector('iframe')?.contentWindow;
  if(game?.MFFriendsUI){game.MFFriendsUI.open();return}
  try{$('farms').showModal();await listFarms(true)}catch(e){$('farm-list').textContent='Não foi possível carregar as fazendas.'}
};
$('more').onclick=()=>listFarms().catch(e=>status(e.message));
$('login').onclick=async()=>{
  $('login').disabled=true;
  try{await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider())}
  catch(e){
    console.warn('[Google login]',e?.code,e);
    if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e?.code)){
      gate('O navegador bloqueou a janela Google. Redirecionando para entrar…');
      try{await sdk.signInWithRedirect(auth,new sdk.GoogleAuthProvider());return}catch(err){console.warn('[redirect]',err)}
    }
    const messages={'auth/unauthorized-domain':'Este domínio não está autorizado no Firebase.','auth/popup-closed-by-user':'Login cancelado. Tente novamente.','auth/network-request-failed':'Falha de rede ao abrir o Google. Confira sua conexão e tente novamente.','auth/cancelled-popup-request':'Já existe uma tentativa de login em andamento.'};
    gate(messages[e?.code]||`Não foi possível entrar com Google (${e?.code||'erro desconhecido'}).`);
  }finally{$('login').disabled=false}
};
setInterval(checkpoint,1000);
// Sem beforeunload/preventDefault: fechar ou recarregar nunca abre confirmação.
window.addEventListener('pagehide',()=>{checkpoint();void flush().catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(document.hidden){checkpoint();void flush().catch(()=>{})}});
async function init(){
  clearLegacySaves(config?.projectId);
  if(!config||['apiKey','authDomain','databaseURL','projectId','appId'].some(k=>!config[k])){
    gate('O jogo está aguardando configuração.');return;
  }
  const base='https://www.gstatic.com/firebasejs/12.5.0/';
  const [app,authentication,database]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-database.js')]);
  sdk={...authentication,...database};const instance=app.initializeApp(config);
  auth=sdk.getAuth(instance);db=sdk.getDatabase(instance);
  sdk.onValue(sdk.ref(db,'.info/serverTimeOffset'),s=>{clockOffset=Number(s.val())||0});
  // A autenticação pertence à aba, para que encerrar a sessão antiga não encerre a nova.
  try{await sdk.setPersistence(auth,sdk.browserSessionPersistence)}catch(e){console.warn('[auth persistence]',e)}
  try{await sdk.getRedirectResult(auth)}catch(e){console.warn('[Google redirect]',e?.code);gate(`Falha ao concluir login Google (${e?.code||'erro desconhecido'}).`)}
  $('login').disabled=false;
  sdk.onAuthStateChanged(auth,account=>{void boot(account).catch(e=>{
    console.warn('[Firebase initial connection]',e);
    if(stopped)return;
    if(transient(e)||!navigator.onLine){
      gate('A conexão com Firebase falhou. Tentando novamente…');
      clearTimeout(reconnectTimer);
      reconnectTimer=setTimeout(()=>{if(auth.currentUser?.uid===account?.uid)void boot(account).catch(fail)},5000);
    }else fail(e);
  })});
}
init().catch(fail);
