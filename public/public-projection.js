import {publicState} from './public-state.js?v=1';

// A visita é uma projeção de um save PRIVADO já confirmado no Firebase.
// A sessão/revisão impedem conflitos; saveId vincula a cena ao mesmo save.
export function publicProjection(state, revision, saveId, updatedAt) {
 const record={state:publicState(state),revision,updatedAt};
 if(saveId)record.saveId=saveId;
 return record;
}

export function reconcilePublicProjection(current, desired) {
 const currentRevision=Number(current?.revision)||0;
 if(currentRevision>desired.revision)return undefined;
 if(currentRevision===desired.revision){
  // Com o mesmo saveId, a cena já foi publicada pelo save atômico.
  if(desired.saveId&&current?.saveId===desired.saveId)return undefined;
  // Contas anteriores ao saveId: não escrever novamente se a cena já coincide.
  if(!desired.saveId&&!current?.saveId&&JSON.stringify(current?.state)===JSON.stringify(desired.state))return undefined;
 }
 // Mesmo número de revisão NÃO garante que a versão pública seja atual:
 // reconstruir quando o saveId falta ou corresponde a outro save.
 return desired;
}
