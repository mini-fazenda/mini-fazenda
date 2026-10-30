import {conditionalSave,isMaxRetry} from './conditional-save.js?v=1';
import {normalizeSave,documentRevision,progressText} from './save-compat.js?v=legacy-1';
import {nextDocument,clearLegacySaves,recoverPendingState} from './persistence.js?v=legacy-1';
import {redeemTestCredit} from './test-credit.js?v=2';
import {startFriends,stopFriends,publishProfile,api as friendsApi} from './friends.js?v=block-12h';
// A versão do módulo publicado também identifica o HTML do jogo no cache.
const releaseVersion=new URL(import.meta.url).searchParams.get('v')||'artes-melancia-v3';
const $=id=>document.getElementById(id);
const config=window.MINI_FAZENDA_FIREBASE;
let sdk,auth,db,user,sessionId,revision=0,epoch=0;
let ready=false,connected=false,sessionActive=false,stopped=false,visiting=false,suspending=false,visitingUid=null;
let bridge=null,initialState=null,ownState=null,pending=null,saving=null,lastText='',lastKey=null;
let stopConnection,stopSession,stopVisit,resolveConnection,connectionReady,projectionTimer,retryTimer,reconnectTimer;
let visitSerial=0,visitedRevision=-1,visitedPublishedAt=0;
let projectionTarget=null,projectionWork=null,projectionDelay=1000,confirmedState=null;
let retryDelay=1000,loginAttempt=false;
let useRestSaves=false;
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
 const el=$('sync'),state=saveBlocked?'error':pending?'pending':/conect|restabelecendo|salvando/i.test(text)?'pending':'saved';
 el.textContent=state==='error'?'!':state==='saved'?'✓':'';
 el.hidden=false;el.dataset.state=state;el.title=text;
 el.setAttribute('aria-label',text);el.setAttribute('aria-busy',String(state==='pending'));
}
function gate(text){$('farms').close();$('gate').hidden=false;$('message').textContent=text}
function endVisit(){
  visitSerial++;stopVisit?.();stopVisit=null;
  visitingUid=null;visitedRevision=-1;visitedPublishedAt=0;
}
function freeze(){
  endVisit();ready=false;sessionActive=false;stopped=true;pending=null;projectionTarget=null;
  clearTimeout(retryTimer);clearTimeout(reconnectTimer);clearTimeout(projectionTimer);
  $('game-container').replaceChildren();bridge=null;$('toolbar').hidden=true;
}
function fail(error){
  if(stopped)return;
  console.error(error);freeze();gate(String(error?.message||'').startsWith('save/incompatible')?error.message:'Não foi possível conectar à fazenda. Recarregue a página para tentar novamente.');
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
function publicState(state){
  // Saves anteriores podem não conter farmName. O Firebase exige string em publicFarms.
  const farmName=typeof state.farmName==='string'&&state.farmName.trim()?state.farmName.slice(0,12):'Fazenda';
  return {...state,farmName,inventory:{},moedas:0,truckOrder:null,loot:[],player:{...state.player,path:[]},aradora:{...state.aradora,path:[],fila:[]}};
}
// Publica somente documentos já confirmados em farms/{uid}; falhas são repetidas.
function scheduleProjection(state,version,run,saveId=confirmedSaveId){
  if(!state||!Number.isSafeInteger(version)||version<1||run!==epoch||stopped)return;
  if(projectionTarget?.run===run&&projectionTarget.version>version)return;
  projectionTarget={state,version,run,saveId};
  clearTimeout(projectionTimer);
  projectionTimer=setTimeout(()=>void publishProjection(),150);
}
async function publishProjection(){
  if(projectionWork)return projectionWork;
  const target=projectionTarget;
  if(!target||target.run!==epoch||!sessionActive||!connected||stopped)return false;
  const uid=user.uid;
  const operation=(async()=>{
    const result=await sdk.runTransaction(sdk.ref(db,`publicFarms/${uid}`),current=>{
      if(target.run!==epoch||!sessionActive||stopped||Number(current?.revision)>target.version)return;
      return {state:publicState(target.state),revision:target.version,
        saveId:target.saveId||'',updatedAt:sdk.serverTimestamp()};
    },{applyLocally:false});
    if(target.run!==epoch||stopped)return;
    const projected=Number(result.snapshot.val()?.revision)||0;
    if(projected<target.version)throw new Error('projection/not-confirmed');
    // Outra sessão já publicou uma versão mais recente: não rebaixe o diretório.
    if(projected>target.version)return;
    await sdk.set(sdk.ref(db,`directory/${uid}`),{
      name:(target.state.farmName||'Minha fazenda').slice(0,12),
      level:target.state.playerLevel||1,updatedAt:sdk.serverTimestamp()
    });
    void publishProfile(target.state);
  })();
  projectionWork=operation;
  let failed=false;
  try{
    await operation;
    if(projectionTarget===target)projectionTarget=null;
    projectionDelay=1000;
  }catch(e){
    failed=true;console.warn('[projeção pública]',e);
  }finally{
    if(projectionWork===operation)projectionWork=null;
    if(projectionTarget?.run===epoch&&!stopped&&connected&&sessionActive){
      clearTimeout(projectionTimer);
      projectionTimer=setTimeout(()=>void publishProjection(),failed?projectionDelay:0);
      if(failed)projectionDelay=Math.min(projectionDelay*2,30000);
    }
  }
  return !failed;
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
      const rest=()=>conditionalSave({databaseURL:config.databaseURL,uid,getToken:refresh=>sdk.getIdToken(account,refresh),update,active:()=>run===epoch&&sessionActive&&!stopped});
      let result;
      if(useRestSaves)result=await rest();
      else try{result=await sdk.runTransaction(sdk.ref(db,`farms/${uid}`),update,{applyLocally:false});}
      catch(e){
        if(!isMaxRetry(e))throw e;
        // Não repita indefinidamente a mesma transação que atingiu o limite do SDK.
        useRestSaves=true;status('Restabelecendo salvamento…');result=await rest();
      }
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
      ownState=record.state;confirmedState=record.state;
      // Atualiza a base da pendência MAIS RECENTE após confirmar a anterior.
      if(pending)rememberPending();else forgetPending();
      $('farm-title').textContent=record.state.farmName||'Minha fazenda';
      retryDelay=1000;clearTimeout(retryTimer);
      if(!pending){saveBlocked=false;lastSaveError='';if(ready&&!suspending)$('gate').hidden=true;status('Salvo na nuvem');}else status('Salvando…');
      scheduleProjection(record.state,revision,run);
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
    bridge=api;ready=true;
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
  status(visit?'Somente visualização':'Online');
}
async function reconnect(run){
  try{
    const token=(await sdk.get(sdk.ref(db,`sessions/${user.uid}`))).val();
    if(run!==epoch||!connected||stopped)return;
    if(token!==sessionId){await disconnectPrevious();return}
    sessionActive=true;
    if(ready){await flush();if(!saveBlocked)$('gate').hidden=true;if(!visiting)checkpoint()}
    if(confirmedState)scheduleProjection(confirmedState,revision,run);
  }catch(e){if(run===epoch&&connected&&!stopped){console.warn('[reconnect]',e);status('Reconectando…');clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{if(run===epoch&&connected&&!stopped)void reconnect(run)},3000)}}
}
async function boot(account){
  const run=++epoch;
  stopConnection?.();stopSession?.();endVisit();clearTimeout(projectionTimer);clearTimeout(retryTimer);clearTimeout(reconnectTimer);projectionTarget=null;projectionWork=null;projectionDelay=1000;confirmedState=null;retryDelay=1000;useRestSaves=false;
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
  revision=documentRevision(remote);confirmedSaveId=remote?.saveId||null;ownState=normalizeSave(remote?.state);confirmedState=ownState;
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
      if(credit){revision=credit.revision;confirmedSaveId=credit.saveId;ownState={...ownState,moedas:ownState.moedas+credit.amount};confirmedState=ownState;lastText='';}
    }catch(e){console.warn('[crédito de teste]',e)}
  }
  if(run!==epoch||stopped)return;
  claimed=true;sessionActive=true;
  stopSession=sdk.onValue(sdk.ref(db,`sessions/${user.uid}`),snap=>{
    if(run===epoch&&!stopped&&snap.val()!==null&&snap.val()!==sessionId)void disconnectPrevious();
  },e=>{console.warn('[session listener]',e);status('Verificando sessão…')});
  mount(ownState,false,stateSavedAt);
  if(confirmedState)scheduleProjection(confirmedState,revision,run);
  void startFriends({sdk,db,uid:user.uid,visit:visitFarm,applyFertilize}).then(()=>{if(run===epoch&&ownState)void publishProfile(ownState)}).catch(e=>console.warn('[amigos]',e));
}
async function drain(){
  checkpoint();suspending=true;gate('Aguarde…');
  try{
    if(!connected||!sessionActive)throw new Error('Aguarde a conexão voltar.');
    await flush();
    // Não cancele a publicação pública ao trocar de fazenda imediatamente após salvar.
    if(projectionTarget)await publishProjection();
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
    gate('Abrindo sua fazenda…');
    const remote=(await sdk.get(sdk.ref(db,`farms/${user.uid}`))).val();
    if(stopped)return;
    if(remote&&!remote.state)throw new Error('save/incompatible: documento sem state — progresso preservado no Firebase');
  revision=documentRevision(remote);confirmedSaveId=remote?.saveId||null;ownState=normalizeSave(remote?.state);confirmedState=ownState;lastText='';endVisit();mount(ownState,false,remote?.updatedAt);
  }catch(e){fail(e)}
};
// Fertilizações dos amigos: só aplica com a própria fazenda aberta e o jogo pronto.
function applyFertilize(list){
  if(!ready||visiting||!bridge||stopped)return false;
  const game=$('game-container').querySelector('iframe')?.contentWindow;
  if(!game?.MFFertilize)return false;
  try{game.MFFertilize.apply(list);queueMicrotask(checkpoint);return true}catch(e){console.warn('[fertilizar]',e);return true}
}
// A revisão recebida pelo listener, e não o cache da primeira visita, é a fonte da renderização.
function applyVisitSnapshot(data,uid,serial){
  if(serial!==visitSerial||stopped||!visiting||visitingUid!==uid||!data?.state)return;
  const nextRevision=Number(data.revision)||0,nextUpdatedAt=Number(data.updatedAt)||0;
  if(nextRevision<visitedRevision||
    (nextRevision===visitedRevision&&nextUpdatedAt<=visitedPublishedAt))return;
  const state=normalizeSave(data.state);
  const loaded={...state,savedAt:state.savedAt||nextUpdatedAt};
  visitedRevision=nextRevision;visitedPublishedAt=nextUpdatedAt;
  initialState=loaded;
  $('farm-title').textContent=`Visitando: ${state.farmName||'Fazenda'}`;
  if(ready&&bridge?.applyVisitState){
    try{bridge.applyVisitState(loaded);status('Visita atualizada ao vivo')}
    catch(e){console.warn('[visita ao vivo]',e);status('Falha ao atualizar a visita')}
  }
}
// Toda nova visita consulta o Firebase; enquanto aberta recebe atualizações ao vivo.
async function visitFarm(uid){
  if(!user||uid===user.uid||!connected||!sessionActive||stopped)return false;
  try{
    if(!await drain())return false;
    const path=sdk.ref(db,`publicFarms/${uid}`);
    const data=(await sdk.get(path)).val();
    if(stopped)return false;
    if(!data?.state)throw new Error('Esta fazenda ainda não está disponível.');
    const state=normalizeSave(data.state);
    endVisit();
    visitingUid=uid;visitedRevision=Number(data.revision)||0;visitedPublishedAt=Number(data.updatedAt)||0;
    const serial=visitSerial;
    mount(state,true,data.updatedAt);
    stopVisit=sdk.onValue(path,snap=>{
      try{applyVisitSnapshot(snap.val(),uid,serial)}
      catch(e){console.warn('[visita ao vivo]',e);status('Falha ao atualizar a visita')}
    },e=>{if(serial===visitSerial){console.warn('[visita ao vivo]',e);status('Visita sem sincronização: '+String(e.code||e.message||e))}});
    return true;
  }catch(e){
    suspending=false;if(connected&&!stopped)$('gate').hidden=true;status(e.message);throw e;
  }
}
function row(uid,farm){
  if(uid===user.uid)return;
  const el=document.createElement('div');el.className='farm-row';
  const text=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');
  title.textContent=farm.name||'Fazenda';sub.textContent=`Nível ${farm.level||1}`;text.append(title,sub);
  const button=document.createElement('button');button.textContent='Visitar';button.onclick=async()=>{
    button.disabled=true;
    try{await visitFarm(uid)}
    catch(e){if(!stopped)status(e.message)}
    finally{button.disabled=false}
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
