/* Galinheiro permanente: duas entregas de materiais e ovos acumulados por tempo real. */
(function(root){
 const CONFIG={price:10000,xp:600,size:6,chickenPrice:1000,chickenXP:5,cycle:30*60000,eggPrice:40,
  stages:[0,60,100],costs:[{madeira:4,telha:2,feno:1},{madeira:4,telha:2,feno:2}],
  levels:[{capacity:10,playerLevel:1,cost:0},{capacity:20,playerLevel:15,cost:30000},{capacity:35,playerLevel:25,cost:70000}]};
 const MAX_EGGS=Math.floor(Number.MAX_SAFE_INTEGER/CONFIG.eggPrice),is=t=>!!t&&(t.itemId==='item-galinheiro'||t.id==='item-galinheiro'||!!t.coop);
 function normalize(t){if(!is(t))return t;t.itemId='item-galinheiro';t.name='Galinheiro';t.w=t.h=CONFIG.size;t.coop||={};const s=t.coop;
  s.phase=Math.max(0,Math.min(2,Math.floor(Number(s.phase)||0)));s.level=Math.max(1,Math.min(3,Math.floor(Number(s.level)||1)));s.orientation=s.orientation?1:0;
  s.eggs=Number.isSafeInteger(s.eggs)&&s.eggs>=0?Math.min(MAX_EGGS,s.eggs):0;
  const ids=new Set();s.hens=(Array.isArray(s.hens)?s.hens:Object.values(s.hens||{})).filter(h=>h&&typeof h.id==='string'&&Number.isSafeInteger(h.nextEggAt)&&h.nextEggAt>=0&&!ids.has(h.id)&&ids.add(h.id));return t;
 }
 const info=t=>CONFIG.levels[normalize(t).coop.level-1];
 const art=t=>'assets/galinheiro/etapa-'+CONFIG.stages[t.coop?.phase||0]+'-'+(t.coop?.orientation?1:0)+'.webp';
 function start(gx,gy){const t={gx,gy,w:CONFIG.size,h:CONFIG.size,itemId:'item-galinheiro',name:'Galinheiro',visualScale:1,coop:{phase:0,level:1,orientation:0,hens:[],eggs:0}};t.imgSrc=art(t);return t;}
 function sync(t,now=Date.now()){if(!is(t)||!Number.isFinite(now)||now<0||now>Number.MAX_SAFE_INTEGER)return 0;now=Math.floor(now);normalize(t);t.imgSrc=art(t);if(t.coop.phase!==2)return 0;let added=0;
  for(const h of t.coop.hens){if(now<h.nextEggAt)continue;const n=Math.floor((now-h.nextEggAt)/CONFIG.cycle)+1;if(t.coop.eggs+added+n>MAX_EGGS)return 0;added+=n;}
  for(const h of t.coop.hens)if(now>=h.nextEggAt)h.nextEggAt+=(Math.floor((now-h.nextEggAt)/CONFIG.cycle)+1)*CONFIG.cycle;
  t.coop.eggs+=added;return added;
 }
 function advance(t,materials,expectedPhase){normalize(t);const s=t.coop;if(s.phase!==expectedPhase)return {error:'stale'};const cost=CONFIG.costs[s.phase];if(!cost)return {error:'complete'};if(!materials.spend(cost))return {error:'materials'};s.phase++;t.imgSrc=art(t);return {phase:s.phase,percent:CONFIG.stages[s.phase]};}
 function buy(t,balance,now=Date.now(),id){normalize(t);const s=t.coop;if(s.phase!==2)return {error:'building'};if(s.hens.length>=info(t).capacity)return {error:'full'};if(balance<CONFIG.chickenPrice)return {error:'coins'};if(!Number.isFinite(now)||now<0||now>Number.MAX_SAFE_INTEGER-CONFIG.cycle)return {error:'clock'};now=Math.floor(now);
  id||='hen-'+now+'-'+Math.random().toString(36).slice(2);if(s.hens.some(h=>h.id===id))return {error:'duplicate'};sync(t,now);s.hens.push({id,nextEggAt:now+CONFIG.cycle});return {cost:CONFIG.chickenPrice,xp:CONFIG.chickenXP};}
 function sell(t,now=Date.now()){sync(t,now);const count=t.coop.eggs;if(!count)return null;const coins=count*CONFIG.eggPrice;t.coop.eggs=0;return {count,coins};}
 function upgrade(t,playerLevel,balance,expectedLevel){normalize(t);const s=t.coop;if(s.phase!==2)return {error:'building'};if(s.level!==expectedLevel)return {error:'stale'};const n=CONFIG.levels[s.level];if(!n)return {error:'max'};if(playerLevel<n.playerLevel)return {error:'level',required:n.playerLevel};if(balance<n.cost)return {error:'coins'};s.level++;return {cost:n.cost,capacity:n.capacity};}
 function fits(t,cols,rows,objects,ignore=t){return t.gx>=0&&t.gy>=0&&t.gx+t.w<=cols&&t.gy+t.h<=rows&&!objects.some(x=>x!==ignore&&t.gx<x.gx+(x.w||1)&&t.gx+t.w>x.gx&&t.gy<x.gy+(x.h||1)&&t.gy+t.h>x.gy);}
 function rotate(t){if(!is(t))return false;normalize(t);t.coop.orientation=t.coop.orientation?0:1;t.imgSrc=art(t);return true;}
 function geometry(t,a,width,height,tw=96){const span=tw*(t.w||CONFIG.size),w=span*.64,h=w*height/width,front={x:a.x,y:a.y+span*.2};return {x:a.x-w/2,y:front.y-h,w,h,front};}
 root.MFCoopCore={CONFIG,is,normalize,info,art,start,sync,advance,buy,sell,upgrade,fits,rotate,geometry};
})(globalThis);
