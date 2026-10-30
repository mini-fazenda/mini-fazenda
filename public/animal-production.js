/* Relógio persistente: um lote por ciclo, sem acumular produção ilimitada offline. */
(function(root){
 const types={vaca:{product:'leite',name:'Leite',cycle:15*60000,amount:1,saleCoins:60,stars:1,tool:'bucket',icon:'assets/7fc2de79ae289a20560f-icone-leite.png'},ovelha:{product:'la',name:'Lã',cycle:30*60000,amount:1,saleCoins:100,stars:2,tool:'shears',icon:'assets/animais/la.svg'}};
 function start(animal,now=Date.now()){
  if(!animal?.tipo)return false;
  animal.etapa=2;animal.startTime=now-Math.max(0,Number(animal.totalTime)||0);if(types[animal.tipo])animal.production={readyAt:now};return true;
 }
 function sync(animal,now=Date.now()){
  const cfg=types[animal?.tipo];if(!cfg)return null;
  const matureAt=Number(animal.startTime)+Number(animal.totalTime);
  if(animal.etapa!==2 && now<matureAt)return null;
  animal.etapa=2;
  if(!animal.production||!Number.isFinite(animal.production.readyAt)){
   animal.production={readyAt:(Number.isFinite(matureAt)?matureAt:now)+cfg.cycle};
  }
  return {...cfg,ready:now>=animal.production.readyAt,remaining:Math.max(0,animal.production.readyAt-now),progress:Math.max(0,Math.min(100,100*(1-(animal.production.readyAt-now)/cfg.cycle)))};
 }
 function collect(animal,now=Date.now()){
  const result=sync(animal,now);if(!result?.ready)return null;
  animal.production.readyAt=now+result.cycle;
  delete animal.milk;return result;
 }
 root.MFAnimalProduction={types,start,sync,collect};
})(globalThis);
