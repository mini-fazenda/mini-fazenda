// Crédito solicitado pelo dono da fazenda #986568 para testar as plantações.
export const TEST_CREDIT_ID='farm986568-test50000-v1';
export function creditDocument(current,{code,uid,ownerUid,sessionId,timestamp}){
 if(code!=='986568'||!uid||ownerUid!==uid||!current?.state||current.creditReceipts?.[TEST_CREDIT_ID])return;
 const coins=current.state.moedas;
 if(!Number.isSafeInteger(coins)||coins<0||!Number.isSafeInteger(coins+50000)||!Number.isSafeInteger(current.revision))return;
 return {...current,sessionId,revision:current.revision+1,saveId:TEST_CREDIT_ID,
  state:{...current.state,moedas:coins+50000},updatedAt:timestamp,
  creditReceipts:{...current.creditReceipts,[TEST_CREDIT_ID]:{amount:50000,at:timestamp}}};
}
export async function redeemTestCredit({sdk,db,uid,sessionId,revision,active}){
 const code=(await sdk.get(sdk.ref(db,`userCodes/${uid}`))).val();
 if(code!=='986568'||!active())return null;
 const ownerUid=(await sdk.get(sdk.ref(db,`codes/${code}`))).val();
 if(ownerUid!==uid||!active())return null;
 const result=await sdk.runTransaction(sdk.ref(db,`farms/${uid}`),current=>{
  if(!active()||current?.revision!==revision)return;
  return creditDocument(current,{code,uid,ownerUid,sessionId,timestamp:sdk.serverTimestamp()});
 },{applyLocally:false});
 return result.committed?{amount:50000,revision:result.snapshot.val().revision}:null;
}
