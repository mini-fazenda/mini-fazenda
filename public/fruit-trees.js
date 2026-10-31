/* Árvores permanentes. Migração de ciclos preserva a fração já produzida. */
(function(root){
 const types={
  limao:{name:'Limão',treeName:'Limoeiro',price:3000,minutes:35,saleCoins:150,plantXP:140,stars:20,level:1,previousMinutes:30},
  cereja:{name:'Cereja',treeName:'Cerejeira',price:3500,minutes:45,saleCoins:220,plantXP:180,stars:50,level:3,previousMinutes:45},
  maca:{name:'Maçã',treeName:'Macieira',price:4000,minutes:50,saleCoins:290,plantXP:180,stars:40,level:1,previousMinutes:40},
  banana:{name:'Banana',treeName:'Bananeira',price:4500,minutes:60,saleCoins:380,plantXP:220,stars:80,level:6,previousMinutes:60},
  laranja:{name:'Laranja',treeName:'Laranjeira',price:5000,minutes:75,saleCoins:520,plantXP:220,stars:80,level:1,previousMinutes:50},
  sakura:{name:'Flor de Sakura',treeName:'Sakura',price:5500,minutes:90,saleCoins:690,plantXP:280,stars:120,level:10,previousMinutes:90}
 };
 for(const [type,c]of Object.entries(types)){c.cycle=c.minutes*60000;c.directCoins=true;c.stages=[1,2,3].map(n=>`assets/arvores-chao/${type}-${n}.png`);c.icon=c.stages[2];}
 // Compatibilidade das Aceroleiras e frutas já existentes; sem excluir patrimônio.
 types.acerola={name:'Acerola',treeName:'Aceroleira',price:6000,minutes:60,cycle:3600000,stars:250,saleCoins:600,icon:'assets/arvores/acerola-fruta.png',stages:[1,2,3].map(n=>`assets/arvores-chao/acerola-${n}.png`)};
 function config(t){return types[t?.fruitTree?.tipo||String(t?.itemId||t?.id||'').replace('item-arvore-','')];}
 function migrate(t,now=Date.now()){
  const c=config(t),f=t?.fruitTree;if(!c?.directCoins||!f)return false;
  if(f.balanceVersion===2&&f.cycleMs===c.cycle)return false;
  const previous=Number(f.cycleMs)>0?Number(f.cycleMs):c.previousMinutes*60000;
  if(previous!==c.cycle&&Number.isFinite(Number(f.startTime))){const fraction=Math.max(0,Math.min(1,(now-Number(f.startTime))/previous));f.startTime=now-fraction*c.cycle;}
  f.cycleMs=c.cycle;f.balanceVersion=2;return true;
 }
 function start(t,now=Date.now()){const type=String(t?.itemId||'').replace('item-arvore-',''),c=types[type];if(!c)return false;t.name=c.treeName;t.fruitTree={tipo:type,startTime:c.directCoins?now:now-c.cycle,...(c.directCoins?{cycleMs:c.cycle,balanceVersion:2}:{})};t.imgSrc=c.stages[c.directCoins?0:2];return true;}
 function state(t,now=Date.now()){
  const c=config(t);if(!c||!t.fruitTree)return null;migrate(t,now);
  const elapsed=Math.max(0,now-(Number.isFinite(Number(t.fruitTree.startTime))?Number(t.fruitTree.startTime):now)),ready=elapsed>=c.cycle;
  return {...c,ready,stage:ready?2:elapsed>=c.cycle/2?1:0,remaining:Math.max(0,c.cycle-elapsed)};
 }
 function sync(t,now=Date.now()){const s=state(t,now);if(s)t.imgSrc=s.stages[s.stage];return s;}
 function collect(t,now=Date.now()){const s=sync(t,now);if(!s?.ready)return null;t.fruitTree.startTime=now;delete t.fruitTree.readyNotified;t.imgSrc=s.stages[0];return {...s,type:t.fruitTree.tipo,amount:1};}
 root.MFFruitTrees={types,config,migrate,start,state,sync,collect};
})(globalThis);
