/* Marcadores usam os relógios existentes, sem timers de produção próprios. */
(function(root){
 function readyFor(t,now=Date.now(),s=root){
  if(!t||t.cultura)return null;
  if(s.MFPigstyCore?.is(t))return (Array.isArray(t.pigsty?.pigs)?t.pigsty.pigs:Object.values(t.pigsty?.pigs||{})).some(p=>s.MFPigstyCore.stats(p,now).weight>=120)?{kind:'pigsty',name:'Chiqueiro'}:null;
  if(t.fruitTree){const x=s.MFFruitTrees?.state(t,now);return x?.ready?{kind:'tree',name:x.treeName}:null;}
  const x=s.MFAnimalProduction?.sync(t.animal,now);return x?.ready?{kind:'animal',name:x.name}:null;
 }
 function motion(now,born,phase=0,reduced=false){const p=Math.max(0,Math.min(1,(now-born)/300));return {opacity:reduced?1:p,scale:reduced?1:p<.6?.8+.3*p/.6:1.1-.1*(p-.6)/.4,bob:reduced?0:Math.sin(now*Math.PI*2/1200+phase)*5};}
 const width=(zoom,screenScale=1)=>Math.max(18,28*zoom*screenScale);
 root.MFReadyCore={readyFor,motion,width};
})(globalThis);
