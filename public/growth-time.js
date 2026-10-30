/* Normaliza relógios legados sem reiniciar o cultivo ao abrir a fazenda. */
(function(root){
 function normalize(crop,{savedAt,now=Date.now(),totalTime=crop?.totalTime,firstRatio=.35}={}){
  if(!crop)return;
  let start=Number(crop.startTime);
  // Saves antigos podem conter Unix em segundos em vez de milissegundos.
  if(Number.isFinite(start)&&start>=1e9&&start<1e11)start*=1000;
  const anchor=Number(savedAt),hasAnchor=Number.isFinite(anchor)&&anchor>=1e11&&anchor<=now+60000;
  if(!Number.isFinite(start)||start<1e11||start>now+60000||(hasAnchor&&start>anchor+60000)){
   // Sem o instante original, o último save é a referência conservadora.
   const progress=Number(crop.etapa)>=2?1:Number(crop.etapa)>=1?firstRatio:0;
   start=(hasAnchor?anchor:now)-Math.max(0,Number(totalTime)||0)*progress;
  }
  crop.startTime=start;return start;
 }
 root.MFGrowthTime={normalize};
})(globalThis);
