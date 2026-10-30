(function(root){
 const HOURS12=12*60*60*1000,key=t=>`block_${Math.floor(t.gx)}_${Math.floor(t.gy)}`;
 function bind(t){
  const c=t?.cultura;if(!c||c.tipo==='morta')return false;
  // Migra a aceleração por plantio da versão anterior sem perder o progresso.
  if(c.fertilizedDuration&&c.fertilizedAt){const at=Number(c.fertilizedAt),duration=Number(c.fertilizedDuration),p=(at-c.startTime)/duration;c.totalTime=duration/.65;c.startTime=at-p*c.totalTime;c.fertWindows=[{at,until:at+HOURS12}];if(!t.fertilizerAt){t.fertilizerAt=at;t.fertilizerUntil=at+HOURS12;}delete c.fertilizedDuration;}
  // Saves antigos guardavam somente a estrela. Reconstitui uma janela uma
  // única vez, preservando o percentual atual; depois ela segue no save.
  if(!t.fertilizerAt&&(c.fertilizada||c.fertWindows?.length)){
   const last=(c.fertWindows||[]).reduce((a,b)=>Number(b.at)>Number(a?.at||0)?b:a,null);
   t.fertilizerAt=Number(last?.at)||Number(c.fertilizedAt)||Date.now();
   t.fertilizerUntil=Number(last?.until)||t.fertilizerAt+HOURS12;
  }
  if(!t.fertilizerAt||Number(c.startTime)>=t.fertilizerUntil)return false;
  if(!Array.isArray(c.fertWindows))c.fertWindows=[];
  if(c.fertWindows.some(w=>w.at===t.fertilizerAt))return false;
  c.fertWindows.push({at:t.fertilizerAt,until:t.fertilizerUntil});c.fertilizada=true;return true;
 }
 function apply(t,event){
  if(!t)return false;const at=Number(event.at);if(!(at>0))return false;
  if(event.key?.startsWith('block_')&&event.key!==key(t))return false;
  if(t.fertilizerAt&&at!==t.fertilizerAt&&at<t.fertilizerUntil)return false;
  const changed=at>Number(t.fertilizerAt||0);
  if(changed){t.fertilizerAt=at;t.fertilizerUntil=at+HOURS12;}
  return bind(t)||changed;
 }
 function active(t,now=Date.now()){return Number(t?.fertilizerAt)<=now&&Number(t?.fertilizerUntil)>now;}
 function elapsed(c,now=Date.now()){
  const start=Number(c.startTime);let value=Math.max(0,now-start);
  for(const w of c.fertWindows||[])value+=Math.max(0,Math.min(now,w.until)-Math.max(start,w.at))*(1/.65-1);
  return value;
 }
 function delay(c,target,now=Date.now()){
  if(elapsed(c,now)>=target)return 0;let lo=now,hi=now+Math.max(0,target-elapsed(c,now));
  for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(elapsed(c,mid)>=target)hi=mid;else lo=mid;}return Math.ceil(hi-now);
 }
 root.MFFertilizerCore={key,apply,bind,active,elapsed,delay,HOURS12};
})(globalThis);
