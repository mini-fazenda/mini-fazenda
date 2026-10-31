import {atomicFarmSave} from './atomic-farm-save.js?v=1';
import {publicProjection,reconcilePublicProjection} from './public-projection.js?v=1';
import {conditionalSave,isMaxRetry} from './conditional-save.js?v=1';
import {normalizeSave,documentRevision,progressText} from './save-compat.js?v=legacy-1';
import {nextDocument,clearLegacySaves,recoverPendingState} from './persistence.js?v=legacy-1';
import {redeemTestCredit} from './test-credit.js?v=2';
import {startFriends,stopFriends,publishProfile,api as friendsApi} from './friends.js?v=block-12h';
import {startInbox,stopInbox,startConsole,stopConsole,isDevUser} from './dev-tools.js?v=1';
// A versão do módulo publicado também identifica o HTML do jogo no cache.
const releaseVersion=window.MF_BUILD_VERSION||new URL(import.meta.url).searchParams.get('v')||'artes-melancia-v3';
const $=id=>document.getElementById(id);
const config=window.MINI_FAZENDA_FIREBASE;
let sdk,auth,db,user,sessionId,revision=0,epoch=0;
let ready=false,connected=false,sessionActive=false,stopped=false,visiting=false,suspending=false,visitingUid=null;
let bridge=null,initialState=null,ownState=null,pending=null,saving=null,lastText='',lastKey=null;
let stopConnection,stopSession,resolveConnection,connectionReady,projectionTimer,retryTimer,reconnectTimer;
let retryDelay=1000,loginAttempt=false;
let projectionPending=null,projectionSaving=null,stopVisit=null,visitSequence=0,visitData=null,visitRevision=-1;
let confirmedSaveId=null,inFlightRecord=null,saveBlocked=false,lastSaveError='';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const transient=e=>['unavailable','database/network-error','network-request-failed','auth/network-request-failed','disconnected'].some(x=>String(e?.code||'').includes(x));
function recoveryKey(){return 'mf-pending-v3:'+user.uid}
function rememberPending(){
  if(!user||!pending)return;
  const value=JSON.stringify({state:pending.state,revision,baseSaveId:confirmedSaveId,sessionId,inFlightId:inFlightRecord?.id||null,pendingId:pending.id,at:Date.now()});
  let kept=false;
  for(const storage of [localStorage,sessionStorage])try{storage.setItem(recoveryKey(),value);kept=true}catch(e){console.warn('[pending storage]',e)}
  if(!kept)status('Salvando… mantenha esta página aberta.');
}
function forgetPending(){
  for(const storage of [localStorage,sessionStorage])try{const record=JSON.parse(storage.getItem(recoveryKey())||'null');if(!record||record.sessionId===sessionId)storage.removeItem(recoveryKey());storage.removeItem('mf-recovery-v2:'+user.uid)}catch{}
}
function saveError(error){
  lastSaveError=String(error?.code||error?.message||'sem confirmação').slice(0,120);
  saveBlocked=true;
  gate('Sua conta está conectada, mas o Firebase ainda não confirmou o salvamento ('+lastSaveError+').\nSua fazenda está pausada. Tentando novamente…');
  status('Falha ao salvar: '+lastSaveError+'. Toque para tentar.');
}
function retryPending(error){
  if(stopped||!pending)return;
  if(error)saveError(error);
  clearTimeout(retryTimer);
  retryTimer=setTimeout(()=>{if(stopped)return;if(connected&&sessionActive)void flush().catch(e=>{console.warn('[sync retry]',e);retryPending(e)});else retryPending()},retryDelay);
  retryDelay=Math.min(retryDelay*2,30000);
}
let clockOffset=0; // diferença entre o relógio do aparelho e o do servidor (anti-troca de data)
function status(text){
 const el=$('sync'),state=saveBlocked?'error':pending||projectionPending?'pending':/conect|restabelecendo|salvando|sincronizando/i.test(text)?'pending':'saved';
 el.textContent=state==='error'?'!':state==='saved'?'✓':'';
 el.hidden=false;el.dataset.state=state;el.title=text;
 el.setAttribute('aria-label',text);el.setAttribute('aria-busy',String(state==='pending'));
}
function gate(text){$('farms').close();$('gate').hidden=false;$('message').textContent=text}
function closeVisit(){stopVisit?.();stopVisit=null;visitSequence++;visitData=null;visitRevision=-1;visitingUid=null;}
function freeze(){stopInbox();stopConsole();closeVisit();projectionPending=null;ready=false;sessionActive=false;stopped=true;pending=null;clearTimeout(retryTimer);clearTimeout(reconnectTimer);clearTimeout(projectionTimer);projectionTimer=null;projectionPending=null;$('game-container').replaceChildren();bridge=null;$('toolbar').hidden=true}
function fail(error){
  if(stopped)return;
  console.error(error);freeze();if(error?.message==='release/mismatch'){gate('O navegador carregou arquivos de versões diferentes. Recarregue a página para atualizar sem alterar sua conta.');const button=document.createElement('button');button.textContent='Atualizar jogo';button.onclick=()=>location.reload();$('message').append(document.createElement('br'),button);return;}gate(String(error?.message||'').startsWith('save/incompatible')?error.message:'Não foi possível conectar à fazenda. Recarregue a página para tentar novamente.');
}
async function disconnectPrevious(){
  if(stopped)return;
  freeze();stopSession?.();
  await sdk.signOut(auth);
  gate('Sua conta entrou em outro dispositivo ou aba. Esta sessão foi desconectada.');
}
function playing(){return ready&&connected&&sessionActive&&!stopped&&!visiting&&!suspending&&!saveBlocked}
function checkpoint(){
  if(!playing()||!bridge)return;
  try{
    const state=normalizeSave(bridge.capture()),text=progressText(state);
    if(text===lastText)return;
    lastText=text;ownState=state;pending={id:crypto.randomUUID(),state};
    rememberPending();status('Salvando…');
    void flush().catch(e=>{console.warn('[save]',e);retryPending(e)});
  }catch(e){saveError(e)}
}
function scheduleProjection(state,version,run,saveId){
  if(run!==epoch||stopped||!state)return;
  // Nunca publicar uma recuperação local não confirmada como se fosse save do dono.
  // A publicação usa apenas a revisão e o saveId da leitura confirmada do Firebase.
  if(!projectionPending||version>=projectionPending.version){
    projectionPending={state,version,saveId,document:publicProjection(state,version,saveId,sdk.serverTimestamp()),run,uid:user.uid,account:user};
  }
  if(projectionPending)status('Sincronizando a versão visitável da fazenda…');
  void flushProjection();
}
async function flushProjection(){
  if(projectionSaving||!projectionPending||!connected||!sessionActive||stopped)return;
  const record=projectionPending;
  const operation=(async()=>{
    const active=()=>record.run===epoch&&sessionActive&&!stopped;
    const update=current=>{
      if(!active())return;
      return reconcilePublicProjection(current,record.document);
    };
    try{
      let result;
      try{result=await sdk.runTransaction(sdk.ref(db,`publicFarms/${record.uid}`),update,{applyLocally:false});}
      catch(e){if(!isMaxRetry(e))throw e;result=await conditionalSave({databaseURL:config.databaseURL,uid:record.uid,collection:'publicFarms',getToken:force=>sdk.getIdToken(record.account,force),update,active});}
      if(!active())return;
      const publishedRevision=Number(result.snapshot.val()?.revision)||0;
      if(!result.committed&&publishedRevision<record.version)throw new Error('visit/revision-conflict');
      if(!result.committed&&publishedRevision===record.version&&record.saveId&&result.snapshot.val()?.saveId!==record.saveId){
        throw new Error('visit/save-id-mismatch');
      }
      if(projectionPending===record)projectionPending=null;
      if(!pending&&!saveBlocked&&ready&&!visiting)status('Salvo na nuvem e disponível para visitas');
      if(publishedRevision>record.version)return; // Evita regredir diretório e perfil da revisão mais recente.
      // Falhas no diretório/perfil não devem descartar uma atualização visual ainda pendente.
      try{await sdk.set(sdk.ref(db,`directory/${record.uid}`),{name:record.state.farmName||'Fazenda',level:record.state.playerLevel||1,updatedAt:sdk.serverTimestamp()});void publishProfile(record.state);}catch(e){console.warn('[diretório]',e);}
    }catch(e){
      console.warn('[publicação da visita]',e);
      if(record.run===epoch&&!stopped&&!visiting)status('Save confirmado, mas a versão para visitas ainda está sincronizando. Nova tentativa automática.');
      clearTimeout(projectionTimer);projectionTimer=setTimeout(()=>{if(record.run===epoch)void flushProjection();},3000);
    }
  })();
  projectionSaving=operation;
  try{await operation;}finally{
    if(projectionSaving===operation)projectionSaving=null;
    if(projectionPending&&projectionPending!==record&&record.run===epoch)queueMicrotask(flushProjection);
  }
}
function watchVisit(uid,initial){
  stopVisit?.();const sequence=++visitSequence;visitRevision=Number(initial?.revision)||0;visitData=initial||null;
  stopVisit=sdk.onValue(sdk.ref(db,`publicFarms/${uid}`),snap=>{
    if(sequence!==visitSequence||!visiting||visitingUid!==uid||stopped)return;
    const data=snap.val();
    if(!data?.state){gate('Esta fazenda não está disponível no momento.');return;}
    const version=Number(data.revision)||0;
    if(version<visitRevision)return;
    if(version===visitRevision){
      const timestamp=Number(data.updatedAt)||0,previousAt=Number(visitData?.updatedAt)||0;
      if(timestamp<previousAt||timestamp===previousAt&&data.saveId===visitData?.saveId)return;
    }
    visitRevision=version;visitData=data;
    if(ready&&bridge?.applyVisit){
      try{bridge.applyVisit(data.state,data.updatedAt);$('farm-title').textContent='Visitando: '+(data.state.farmName||'Fazenda');if(connected)$('gate').hidden=true;status('Visita em tempo real');}catch(e){gate('Não foi possível atualizar a visita. Volte à sua fazenda e tente novamente.');console.warn('[visita]',e);}
    }
  },e=>{if(sequence===visitSequence){gate('A atualização da visita foi interrompida. Volte à sua fazenda e tente novamente.');console.warn('[visita online]',e);}});
}
async function flush(){
  if(saving)return saving;
  if(!pending||!connected||!sessionActive||stopped||visiting||!ready)return;
  const run=epoch,uid=user.uid,token=sessionId,account=user;
  let watchdog;
  const watch=()=>{clearTimeout(watchdog);watchdog=setTimeout(()=>{if(run===epoch&&!stopped&&pending&&connected&&sessionActive)saveError({code:'save/timeout'});},12000);};
  let failed=false,conflicts=0;
  const operation=(async()=>{
    while(pending&&connected&&sessionActive&&!stopped&&run===epoch){
      const record=pending,base=revision;inFlightRecord=record;rememberPending();watch();
      const update=current=>{
        if(run!==epoch||!sessionActive||stopped)return;
        return nextDocument(current,{sessionId:token,revision:base,id:record.id,state:record.state,timestamp:sdk.serverTimestamp()});
      };
      const result=await atomicFarmSave({sdk,db,uid,update});
      clearTimeout(watchdog);
      if(run!==epoch||stopped||!sessionActive)return;
      if(!result.committed&&result.snapshot.val()?.saveId!==record.id){
        const currentToken=(await sdk.get(sdk.ref(db,`sessions/${uid}`))).val();
        if(currentToken!==token){await disconnectPrevious();return}
        // Outra gravação da mesma sessão foi confirmada: atualiza a revisão e tenta novamente.
        const remoteRevision=Number(result.snapshot.val()?.revision);
        if(result.snapshot.val()?.sessionId===token&&Number.isSafeInteger(remoteRevision)&&remoteRevision>revision&&conflicts++<3){revision=remoteRevision;confirmedSaveId=result.snapshot.val().saveId||null;rememberPending();continue}
        throw new Error('save/revision-conflict');
      }
      revision=result.snapshot.val().revision;confirmedSaveId=result.snapshot.val().saveId;inFlightRecord=null;
      if(pending?.id===record.id)pending=null;
      ownState=record.state;
      // Atualiza a base da pendência MAIS RECENTE após confirmar a anterior.
      if(pending)rememberPending();else forgetPending();
      $('farm-title').textContent=record.state.farmName||'Minha fazenda';
      retryDelay=1000;clearTimeout(retryTimer);
      if(!pending){saveBlocked=false;lastSaveError='';if(ready&&!suspending)$('gate').hidden=true;status('Salvo na nuvem');}else status('Salvando…');
      void sdk.set(sdk.ref(db,`directory/${uid}`),{name:record.state.farmName||'Fazenda',level:record.state.playerLevel||1,updatedAt:sdk.serverTimestamp()}).catch(e=>console.warn('[diretório]',e));
      void publishProfile(record.state);
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
    clearTimeout(watchdog);
    if(saving===operation)saving=null;
    if(!failed&&pending&&connected&&sessionActive&&!stopped&&run===epoch)queueMicrotask(()=>flush().catch(e=>{console.warn('[sync]',e);retryPending(e)}));
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
  ownUid:()=>user?.uid,
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
    if(window.MF_BUILD_VERSION&&api.release!==window.MF_BUILD_VERSION){fail(new Error('release/mismatch'));return;}
    bridge=api;
    if(visiting&&visitData&&bridge.applyVisit)bridge.applyVisit(visitData.state,visitData.updatedAt);
    ready=true;
    if(connected&&sessionActive){$('gate').hidden=true;if(!visiting)checkpoint()}
  },fail
};
function mount(state,visit,savedAt){
  ready=false;bridge=null;initialState=state?{...normalizeSave(state),savedAt:state.savedAt||savedAt}:state;visiting=visit;suspending=false;
  $('toolbar').hidden=false;$('home').hidden=!visit;$('neighbors').hidden=true; // Amigos agora fica só na barra de baixo do jogo
  $('farm-title').textContent=visit?`Visitando: ${state.farmName||'Fazenda'}`:state?.farmName||'Minha fazenda';
  gate(visit?'Abrindo visita…':'Carregando sua fazenda…');
  const frame=document.createElement('iframe');frame.title=visit?'Visita à fazenda (somente visualização)':'Minha fazenda';
  frame.src='game.html?v='+encodeURIComponent(releaseVersion);frame.allow='fullscreen';$('game-container').replaceChildren(frame);
  status(visit?'Visita em tempo real':'Online');
}
async function reconnect(run){
  try{
    const token=(await sdk.get(sdk.ref(db,`sessions/${user.uid}`))).val();
    if(run!==epoch||!connected||stopped)return;
    if(token!==sessionId){await disconnectPrevious();return}
    sessionActive=true;void flushProjection();
    if(ready){await flush();if(!saveBlocked)$('gate').hidden=true;if(!visiting)checkpoint()}
  }catch(e){if(run===epoch&&connected&&!stopped){console.warn('[reconnect]',e);status('Reconectando…');clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{if(run===epoch&&connected&&!stopped)void reconnect(run)},3000)}}
}
async function boot(account){
  const run=++epoch;closeVisit();projectionPending=null;projectionSaving=null;
  stopConnection?.();stopSession?.();clearTimeout(projectionTimer);clearTimeout(retryTimer);clearTimeout(reconnectTimer);retryDelay=1000;stopInbox();stopConsole();
  ready=false;sessionActive=false;connected=false;stopped=false;bridge=null;pending=null;saving=null;
  user=account;ownState=null;lastText='';saveBlocked=false;lastSaveError='';confirmedSaveId=null;inFlightRecord=null;$('game-container').replaceChildren();$('toolbar').hidden=true;
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
  if(remote&&!remote.state)throw new Error('save/incompatible: documento sem state — progresso preservado no Firebase');
  revision=documentRevision(remote);confirmedSaveId=remote?.saveId||null;ownState=normalizeSave(remote?.state);
  let confirmedForProjection=ownState;
  let stateSavedAt=remote?.updatedAt;
  // A nuvem é a autoridade; só recupere uma pendência baseada nela.
  let restoredPending=false;
  for(const storage of [localStorage,sessionStorage])try{
    const recovery=JSON.parse(storage.getItem(recoveryKey())||'null');
    const recovered=recoverPendingState(remote,recovery);
    if(recovered){ownState=normalizeSave(recovered);stateSavedAt=recovered.savedAt||recovery.at+clockOffset;restoredPending=true;break;}
  }catch(e){console.warn('[pending recovery]',e)}
  if(!restoredPending)try{
    const legacy=JSON.parse(sessionStorage.getItem('mf-recovery-v2:'+user.uid)||'null');
    if(legacy?.state&&Number(legacy.revision)===revision&&Date.now()-legacy.at<86400000){ownState=normalizeSave(legacy.state);stateSavedAt=legacy.at+clockOffset;}
    else if(legacy)sessionStorage.removeItem('mf-recovery-v2:'+user.uid);
  }catch(e){console.warn('[legacy recovery]',e)}
  // Resgate autenticado, atômico e único, antes de abrir o jogo ou permitir saves.
  if(ownState){
    try{
      const credit=await redeemTestCredit({sdk,db,uid:user.uid,sessionId,revision,active:()=>run===epoch&&!stopped});
      if(run!==epoch||stopped)return;
      if(credit){revision=credit.revision;confirmedSaveId=credit.saveId;ownState={...ownState,moedas:ownState.moedas+credit.amount};confirmedForProjection=ownState;lastText='';}
    }catch(e){console.warn('[crédito de teste]',e)}
  }
  if(run!==epoch||stopped)return;
  claimed=true;sessionActive=true;
  stopSession=sdk.onValue(sdk.ref(db,`sessions/${user.uid}`),snap=>{
    if(run===epoch&&!stopped&&snap.val()!==null&&snap.val()!==sessionId)void disconnectPrevious();
  },e=>{console.warn('[session listener]',e);status('Verificando sessão…')});
  mount(ownState,false,stateSavedAt);
  // Publicação SOMENTE da versão confirmada no Firebase. Se uma recuperação
  // local está aguardando salvar, o save atômico publicará essa versão depois.
  if(confirmedForProjection)scheduleProjection({...confirmedForProjection,savedAt:confirmedForProjection.savedAt||remote?.updatedAt},revision,run,confirmedSaveId);
  // Fazendeiro Mod: todo jogador recebe presentes/comandos; só a conta de dev ganha o console.
  startInbox({sdk,db,uid:user.uid,gameReady:devGameReady,applyGrant:applyDevGrant});
  if(isDevUser(user))startConsole({sdk,db,uid:user.uid,user,farmName:()=>ownState?.farmName,visit:visitFarm});
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
  }catch(e){suspending=false;if(connected&&!saveBlocked)$('gate').hidden=true;throw e}
}
$('sync').onclick=()=>{if(stopped)return;if(!pending){if(ready&&saveBlocked){saveBlocked=false;checkpoint();}return;}clearTimeout(retryTimer);status('Tentando salvar…');void flush().catch(e=>retryPending(e));};
$('logout').onclick=async()=>{
  try{
    if(!visiting&&!await drain())return;
    freeze();stopConnection?.();stopSession?.();await sdk.signOut(auth);
  }catch(e){status(e.message)}
};
$('home').onclick=async()=>{
  if(!connected||!sessionActive||stopped)return;
  try{
    closeVisit();gate('Abrindo sua fazenda…');
    const remote=(await sdk.get(sdk.ref(db,`farms/${user.uid}`))).val();
    if(stopped)return;
    if(remote&&!remote.state)throw new Error('save/incompatible: documento sem state — progresso preservado no Firebase');
  revision=documentRevision(remote);confirmedSaveId=remote?.saveId||null;ownState=normalizeSave(remote?.state);lastText='';mount(ownState,false,remote?.updatedAt);
  }catch(e){fail(e)}
};
// Fertilizações dos amigos: só aplica com a própria fazenda aberta e o jogo pronto.
function applyFertilize(list){
  if(!ready||visiting||!bridge||stopped)return false;
  const game=$('game-container').querySelector('iframe')?.contentWindow;
  if(!game?.MFFertilize)return false;
  try{game.MFFertilize.apply(list);queueMicrotask(checkpoint);return true}catch(e){console.warn('[fertilizar]',e);return true}
}
// Fazendeiro Mod: entrega de comandos do dev (moedas, XP, fertilizante...) para o jogo aberto.
function devGame(){return $('game-container').querySelector('iframe')?.contentWindow||null}
function devGameReady(){return playing()&&!!bridge&&!!devGame()?.MFDev}
async function applyDevGrant(grant,id){
  if(!devGameReady())return false;
  const run=epoch,game=devGame();
  if(!game.MFDev.apply(grant,id))return false;
  checkpoint();await flush();
  if(run!==epoch||stopped||!sessionActive||game!==devGame()||pending)return false;
  // Leitura autoritativa: uma tentativa com resultado incerto jamais apaga a entrega.
  const receipt=(await sdk.get(sdk.ref(db,`farms/${user.uid}/state/devTools/receipts/${id}`))).val();
  if(receipt!==true)return false;
  game.MFDev.notifyGrant(grant,id);
  return true;
}
// Abre a fazenda de outra pessoa em modo visita (somente olhar).
async function visitFarm(uid){
  if(!user||uid===user.uid||!connected||!sessionActive||stopped)return false;
  try{
    if(!await drain())return false;
    const data=(await sdk.get(sdk.ref(db,`publicFarms/${uid}`))).val();
    if(stopped)return false;
    if(!data?.state){suspending=false;$('gate').hidden=true;throw new Error('Esta fazenda ainda não está disponível.')}
    closeVisit();visitingUid=uid;mount(data.state,true,data.updatedAt);watchVisit(uid,data);return true;
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
      await visitFarm(uid);
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
