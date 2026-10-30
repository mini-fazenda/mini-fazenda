import {documentRevision} from './save-compat.js?v=legacy-1';
// Documento autoritativo no Firebase: revisão e sessão impedem sobrescrita por outro dispositivo.
export function nextDocument(current,{sessionId,revision,id,state,timestamp}){
  if(current?.saveId===id)return undefined;
  if(current&&documentRevision(current)!==revision)return undefined;
  return {...current,
    ...(current?.state&&!current.compatVersion?{compatVersion:1,legacyStateBackup:current.state}:{}),
    sessionId,revision:revision+1,saveId:id,state:{...current?.state,...state},updatedAt:timestamp,
    ...(current?.creditReceipts?{creditReceipts:current.creditReceipts}:{})};
}
// Remove somente os saves antigos da Mini Fazenda. Credenciais Firebase e preferências não são progresso.
export function clearLegacySaves(projectId){
  try{
    const prefix=`mf-online:${projectId}:`;
    for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith(prefix)||key==='mini_fazenda_autosave_v1')localStorage.removeItem(key)}
  }catch{}
  try{
    const request=indexedDB.open('mini-fazenda-online-v1');
    request.onsuccess=()=>{
      const db=request.result;
      if(db.objectStoreNames.contains('saves')){
        const tx=db.transaction('saves','readwrite');tx.objectStore('saves').clear();
        const finish=()=>{db.close();indexedDB.deleteDatabase('mini-fazenda-online-v1')};
        tx.oncomplete=finish;tx.onerror=()=>db.close();
      }else{db.close();indexedDB.deleteDatabase('mini-fazenda-online-v1')}
    };
  }catch{}
}

// Recupera somente uma alteração baseada na mesma versão confirmada da nuvem.
// O save em trânsito pode ter sido confirmado enquanto a página era encerrada.
export function recoverPendingState(remote,recovery,now=Date.now()){
  if(!recovery?.state||!Number.isFinite(recovery.at)||recovery.at>now+60000||now-recovery.at>86400000)return null;
  const version=Number(remote?.revision)||0,base=Number(recovery.revision);
  if(!Number.isSafeInteger(base)||base<0)return null;
  const sameBase=version===base&&(recovery.baseSaveId??null)===(remote?.saveId??null);
  const flightConfirmed=version===base+1&&!!recovery.inFlightId&&remote?.saveId===recovery.inFlightId&&remote?.sessionId===recovery.sessionId;
  return sameBase||flightConfirmed?recovery.state:null;
}
