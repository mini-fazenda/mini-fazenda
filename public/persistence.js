// Documento autoritativo no Firebase: revisão e sessão impedem sobrescrita por outro dispositivo.
export function nextDocument(current,{sessionId,revision,id,state,timestamp}){
  if(current?.saveId===id)return undefined;
  if(current&&current.revision!==revision)return undefined;
  return {sessionId,revision:revision+1,saveId:id,state,updatedAt:timestamp};
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
