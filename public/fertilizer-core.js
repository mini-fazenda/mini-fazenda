(function(root){
 const key=t=>t?.cultura?.fertKey||`${Math.floor(t.gx)}_${Math.floor(t.gy)}_${String(t.cultura.tipo).replace(/[^a-z0-9-]/gi,'')}_${Math.floor(t.cultura.startTime)}`;
 function apply(t,event){
  const c=t?.cultura;if(!c||c.fertilizada||c.tipo==='morta'||(event.key&&event.key!==key(t)))return false;
  const at=Number(event.at)||Date.now(),total=Number(c.totalTime),start=Number(c.startTime);
  if(!(total>0)||at>=start+total)return false;
  const progress=Math.max(0,Math.min(1,(at-start)/total));
  c.fertKey=key(t);c.fertilizada=true;c.fertilizedAt=at;c.fertilizedDuration=total*.65;
  c.totalTime=c.fertilizedDuration;c.startTime=at-progress*c.totalTime;return true;
 }
 root.MFFertilizerCore={key,apply};
})(globalThis);
