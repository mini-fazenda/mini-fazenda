// Separado do Firebase para poder verificar recuperação e conflitos sem credenciais.
export function selectRecovery(remote, local) {
  if (!local?.pending) return {state:remote?.state || null,revision:remote?.revision || 0};
  if (local.id && remote?.saveId === local.id) return {state:local.state,revision:remote.revision};
  if ((remote?.revision || 0) === local.baseRevision)
    return {state:local.state,revision:local.baseRevision,pending:true};
  return {conflict:true};
}
export function nextDocument(current, {sessionId,revision,id,state,timestamp}) {
  if (current?.saveId === id) return undefined; // reenvio após confirmação perdida
  if (current && current.revision !== revision) return undefined;
  return {sessionId,revision:revision+1,saveId:id,state,updatedAt:timestamp};
}
export function openJournal(indexedDB) {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('mini-fazenda-online-v1',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('saves');
    req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result);
  });
}
export function journal(db,mode,key,value) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('saves',mode), store=tx.objectStore('saves');
    const req=mode==='readonly'?store.get(key):store.put(value,key);
    tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
