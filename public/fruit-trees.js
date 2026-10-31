/* Árvores permanentes. Migração preserva o prazo do ciclo atual até a próxima coleta. */
(function(root){
 const types={
  limao:{name:'Limão',treeName:'Limoeiro',price:3000,minutes:35,saleCoins:150,plantXP:30,stars:4,level:2,previousMinutes:30},
  cereja:{name:'Cereja',treeName:'Cerejeira',price:3500,minutes:45,saleCoins:220,plantXP:35,stars:5,level:3,previousMinutes:45},
  maca:{name:'Maçã',treeName:'Macieira',price:4000,minutes:50,saleCoins:290,plantXP:40,stars:5,level:5,previousMinutes:40},
  banana:{name:'Banana',treeName:'Bananeira',price:4500,minutes:60,saleCoins:380,plantXP:45,stars:6,level:6,previousMinutes:60},
  laranja:{name:'Laranja',treeName:'Laranjeira',price:5000,minutes:75,saleCoins:520,plantXP:50,stars:8,level:8,previousMinutes:50},
  sakura:{name:'Flor de Sakura',treeName:'Sakura',price:5500,minutes:90,saleCoins:690,plantXP:55,stars:9,level:10,previousMinutes:90}
 };
 for(const [type,c]of Object.entries(types)){c.cycle=c.minutes*60000;c.directCoins=true;c.stages=[1,2,3].map(n=>`assets/arvores-chao/${type}-${n}.png`);c.icon=c.stages[2];}
 // Compatibilidade das Aceroleiras e frutas já existentes; sem excluir patrimônio.
 types.acerola={name:'Acerola',treeName:'Aceroleira',price:6000,minutes:120,cycle:7200000,stars:12,saleCoins:1000,plantXP:60,level:12,previousMinutes:60,directCoins:true,icon:'assets/arvores/acerola-fruta.png',stages:[1,2,3].map(n=>`assets/arvores-chao/acerola-${n}.png`)};
 function identity(t){
  if(!t||t.animal||t.cultura||t.pigsty)return null;
  const type=t.fruitTree?.tipo||String(t.itemId||t.catalogId||t.id||'').replace(/^item-arvore-/,'');
  if(types[type])return {type};
  const src=String(t.imgSrc||'').split(/[?#]/)[0];
  const match=src.match(/(?:^|\/)assets\/(arvores-chao|arvores-permanentes|arvores)\/(?:arvore_)?([a-z]+)[-_]([0-3])\.png$/);
  if(!match||!types[match[2]])return null;
  return {type:match[2],stage:Math.max(0,Math.min(2,Number(match[3])-(match[1]==='arvores'?0:1)))};
 }
 function config(t){return types[identity(t)?.type];}
 // Recupera compras antigas que o clique legado salvou apenas como imagem.
 // A reparação não cobra, não concede XP e não reinicia árvores válidas.
 function repair(t,now=Date.now()){
  const found=identity(t);if(!found)return false;const c=types[found.type];let changed=false;
  if(!t.fruitTree){t.fruitTree={tipo:found.type,startTime:now-c.cycle*(found.stage??0)/2,cycleMs:c.cycle,balanceVersion:3};t.w=t.h=2;t.visualScale=1;changed=true;}
  if(t.itemId!=='item-arvore-'+found.type){t.itemId='item-arvore-'+found.type;changed=true;}
  if(t.name!==c.treeName){t.name=c.treeName;changed=true;}
  return changed;
 }
 function migrate(t,now=Date.now()){
  const c=config(t),f=t?.fruitTree;if(!c?.directCoins||!f)return false;
  if(f.balanceVersion===3&&Number(f.cycleMs)>0)return false;
  // Mantém o prazo do ciclo atual. O novo tempo só começa após coletar.
  const previous=Number(f.cycleMs)>0?Number(f.cycleMs):Number(c.previousMinutes)*60000;
  f.cycleMs=previous>0?previous:c.cycle;f.balanceVersion=3;return true;
 }
 function start(t,now=Date.now()){const type=String(t?.itemId||'').replace('item-arvore-',''),c=types[type];if(!c)return false;t.name=c.treeName;t.fruitTree={tipo:type,startTime:c.directCoins?now:now-c.cycle,...(c.directCoins?{cycleMs:c.cycle,balanceVersion:3}:{})};t.imgSrc=c.stages[c.directCoins?0:2];return true;}
 function state(t,now=Date.now()){
  repair(t,now);
  const c=config(t);if(!c||!t.fruitTree)return null;migrate(t,now);
  const elapsed=Math.max(0,now-(Number.isFinite(Number(t.fruitTree.startTime))?Number(t.fruitTree.startTime):now)),cycle=t.fruitTree.cycleMs||c.cycle,ready=elapsed>=cycle;
  return {...c,cycle,ready,stage:ready?2:elapsed>=cycle/2?1:0,remaining:Math.max(0,cycle-elapsed)};
 }
 function sync(t,now=Date.now()){const s=state(t,now);if(s)t.imgSrc=s.stages[s.stage];return s;}
 function collect(t,now=Date.now()){const s=sync(t,now);if(!s?.ready)return null;t.fruitTree.startTime=now;t.fruitTree.cycleMs=config(t).cycle;t.fruitTree.balanceVersion=3;delete t.fruitTree.readyNotified;t.imgSrc=s.stages[0];return {...s,type:t.fruitTree.tipo,amount:1};}
 root.MFFruitTrees={types,identity,config,repair,migrate,start,state,sync,collect};
})(globalThis);
