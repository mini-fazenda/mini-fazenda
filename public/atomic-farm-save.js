import {publicState} from './public-state.js?v=1';
// update multipath é atômico no RTDB. As regras de farms exigem revisão +1 e sessão
// atual, rejeitando por inteiro (inclusive a projeção) uma gravação concorrente.
export async function atomicFarmSave({sdk,db,uid,update}){
 const ref=sdk.ref(db,`farms/${uid}`),current=(await sdk.get(ref)).val(),next=update(current);
 if(next===undefined)return {committed:false,snapshot:{val:()=>current}};
 try{
  await sdk.update(sdk.ref(db),{
   [`farms/${uid}`]:next,
   [`publicFarms/${uid}`]:{state:publicState(next.state),revision:next.revision,saveId:next.saveId,updatedAt:next.updatedAt}
  });
 }catch(e){
  if(['PERMISSION_DENIED','permission-denied'].includes(e?.code)){
   const latest=(await sdk.get(ref)).val();
   if(latest?.saveId===next.saveId||latest?.revision!==current?.revision)return {committed:false,snapshot:{val:()=>latest}};
  }
  throw e;
 }
 return {committed:true,snapshot:{val:()=>next}};
}
