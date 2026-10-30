/* Árvores permanentes: uma colheita por ciclo, com relógio persistente. */
(function(root){
 const types={limao:{name:'Limão',treeName:'Limoeiro',price:3000,minutes:30,stars:150},maca:{name:'Maçã',treeName:'Macieira',price:4000,minutes:40,stars:180},laranja:{name:'Laranja',treeName:'Laranjeira',price:5000,minutes:50,stars:215},acerola:{name:'Acerola',treeName:'Aceroleira',price:6000,minutes:60,stars:250}};
 for(const [type,c]of Object.entries(types)){Object.assign(c,{cycle:c.minutes*60000,saleCoins:c.price/10,icon:`assets/arvores/${type}-fruta.png`,stages:[0,1,2].map(n=>`assets/arvores/${type}-${n}.png`)});}
 function config(t){return types[t?.fruitTree?.tipo||String(t?.itemId||'').replace('item-arvore-','')];}
 function start(t,now=Date.now()){const type=String(t?.itemId||'').replace('item-arvore-',''),c=types[type];if(!c)return false;t.name=c.treeName;t.fruitTree={tipo:type,startTime:now-c.cycle};t.imgSrc=c.stages[2];return true;}
 function state(t,now=Date.now()){
  const c=config(t);if(!c||!t.fruitTree)return null;
  const elapsed=Math.max(0,now-Number(t.fruitTree.startTime)),ready=elapsed>=c.cycle;
  return {...c,ready,stage:ready?2:elapsed>=c.cycle/2?1:0,remaining:Math.max(0,c.cycle-elapsed)};
 }
 function sync(t,now=Date.now()){const s=state(t,now);if(s)t.imgSrc=s.stages[s.stage];return s;}
 function collect(t,now=Date.now()){const s=sync(t,now);if(!s?.ready)return null;t.fruitTree.startTime=now;t.imgSrc=s.stages[0];return {...s,type:t.fruitTree.tipo,amount:1};}
 root.MFFruitTrees={types,config,start,state,sync,collect};
})(globalThis);
