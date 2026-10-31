/* Relógio persistente: um lote por ciclo, sem acumular produção ilimitada offline. */
(function(root){
 const types={vaca:{product:'leite',name:'Leite',cycle:15*60000,amount:1,saleCoins:60,stars:1,tool:'bucket',icon:'assets/7fc2de79ae289a20560f-icone-leite.png'},ovelha:{product:'la',name:'Lã',cycle:30*60000,amount:1,saleCoins:100,stars:2,tool:'shears',icon:'assets/animais/la.svg'}};
 const names={vaca:'Vaca',ovelha:'Ovelha'};
 function repair(t,items={},now=Date.now()){
  if(!t||t.cultura||t.fruitTree||t.pigsty)return false;
  let type=t.animal?.tipo||String(t.itemId||t.catalogId||t.id||'').replace(/^item-/,''),changed=false;
  if(!types[type]){
   const src=String(t.imgSrc||'').split(/[?#]/)[0];
   type=Object.keys(types).find(k=>{const c=items['item-'+k]||{};return ['imgSrc','adultImg','stage0','stage1','stage2'].some(key=>c[key]&&String(c[key]).split(/[?#]/)[0]===src)||
    (k==='vaca'?/(?:^|\/)(?:ef4967dfd1fd9f0b3cca-vaca-parada\.gif|5b8e90b3f4cf79f720c3-vaca-filhote\.png|vaca-(?:filhote|grande|parada)\.(?:png|gif))$/:/(?:^|\/)(?:ovelha-parada\.png|cf0c31de39c78d0add73-ovelha-filhote\.png|673fc36f27a6b61b5c3b-ovelha-grande\.png|ovelha-(?:filhote|grande)\.png)$/).test(src);});
  }
  if(!types[type])return false;const cfg=items['item-'+type]||{};
  if(!t.animal){t.animal={tipo:type,etapa:2,startTime:now,totalTime:0,production:{readyAt:now}};t.w=Number(cfg.w)||(type==='vaca'?2:1);t.h=Number(cfg.h)||(type==='vaca'?2:1);t.visualScale=Number(cfg.visualScale)||(type==='vaca'?.7:.9);if(cfg.adultImg)t.imgSrc=cfg.adultImg;changed=true;}
  if(t.name!==names[type]){t.name=names[type];changed=true;}
  if(t.itemId!=='item-'+type){t.itemId='item-'+type;changed=true;}
  return changed;
 }
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
 root.MFAnimalProduction={types,repair,start,sync,collect};
})(globalThis);
