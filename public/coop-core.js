/* Galinheiro permanente: duas entregas de materiais e ovos acumulados por tempo real. */
(function(root){
 const CONFIG={price:10000,xp:600,size:6,chickenPrice:300,chickenPriceStep:100,chickenXP:5,cycle:30*60000,eggPrice:40,eggTypes:{normal:{name:"Tradicional",price:40,field:"eggs",icon:"assets/galinheiro/ovos/ovo-normal.webp"},gold:{name:"Ouro",price:400,field:"goldenEggs",icon:"assets/galinheiro/ovos/ovo-ouro.webp"},diamond:{name:"Diamante",price:1000,field:"diamondEggs",icon:"assets/galinheiro/ovos/ovo-diamante.webp"}},colors:["branca","marrom","preta","preta-branca","marrom-branca"],
  stages:[0,60,100],costs:[{madeira:4,telha:2,feno:1},{madeira:4,telha:2,feno:2}],
  levels:[{capacity:10,playerLevel:1,cost:0},{capacity:20,playerLevel:15,cost:30000},{capacity:35,playerLevel:25,cost:70000}]};
 const MAX_EGGS=Math.floor(Number.MAX_SAFE_INTEGER/(CONFIG.eggPrice*25*3)),is=t=>!!t&&(t.itemId==='item-galinheiro'||t.id==='item-galinheiro'||!!t.coop);
 function normalize(t){if(!is(t))return t;t.itemId='item-galinheiro';t.name='Galinheiro';t.w=t.h=CONFIG.size;t.coop||={};const s=t.coop;
  s.phase=Math.max(0,Math.min(2,Math.floor(Number(s.phase)||0)));s.level=Math.max(1,Math.min(3,Math.floor(Number(s.level)||1)));s.orientation=s.orientation?1:0;
  for(const {field} of Object.values(CONFIG.eggTypes))s[field]=Number.isSafeInteger(s[field])&&s[field]>=0?Math.min(MAX_EGGS,s[field]):0;
  s.producedGold=Number.isSafeInteger(s.producedGold)&&s.producedGold>=0?s.producedGold:s.goldenEggs;s.producedDiamond=Number.isSafeInteger(s.producedDiamond)&&s.producedDiamond>=0?s.producedDiamond:s.diamondEggs;
  const ids=new Set();s.hens=(Array.isArray(s.hens)?s.hens:Object.values(s.hens||{})).filter(h=>h&&typeof h.id==='string'&&Number.isSafeInteger(h.nextEggAt)&&h.nextEggAt>=0&&!ids.has(h.id)&&ids.add(h.id));for(const h of s.hens)if(!CONFIG.colors.includes(h.color))h.color=CONFIG.colors[hash(h.id)%CONFIG.colors.length];return t;
 }
 const info=t=>CONFIG.levels[normalize(t).coop.level-1];
 const art=t=>'assets/galinheiro/etapa-'+CONFIG.stages[t.coop?.phase||0]+'-'+(t.coop?.orientation?1:0)+'.webp';
 function start(gx,gy){const t={gx,gy,w:CONFIG.size,h:CONFIG.size,itemId:'item-galinheiro',name:'Galinheiro',visualScale:1,coop:{phase:0,level:1,orientation:0,hens:[],eggs:0}};t.imgSrc=art(t);return t;}
 // Sorteio determinístico por identidade e ciclo: recarregar não sorteia novamente.
 // Prefixos limitam a atualização offline a 10.000 cálculos por galinha, sem laços por anos ausentes.
 const PERIOD=10000,tables=new Map();
 function hash(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return (h^(h>>>16))>>>0;}
 function eggType(id,index){const roll=hash(id+':'+((index%PERIOD+PERIOD)%PERIOD))/4294967296;return roll<.01?'diamond':roll<.03?'gold':'normal';}
 function distribution(id,start,n){let p=tables.get(id);if(!p){p={gold:new Uint16Array(PERIOD+1),diamond:new Uint16Array(PERIOD+1)};for(let i=0;i<PERIOD;i++){const type=eggType(id,i);p.gold[i+1]=p.gold[i]+Number(type==='gold');p.diamond[i+1]=p.diamond[i]+Number(type==='diamond');}if(tables.size>=128)tables.delete(tables.keys().next().value);tables.set(id,p);}
  const from=((start%PERIOD)+PERIOD)%PERIOD,blocks=Math.floor(n/PERIOD),rest=n%PERIOD,to=from+rest,out={normal:0,gold:0,diamond:0};
  for(const k of ['gold','diamond'])out[k]=blocks*p[k][PERIOD]+(to<=PERIOD?p[k][to]-p[k][from]:p[k][PERIOD]-p[k][from]+p[k][to-PERIOD]);out.normal=n-out.gold-out.diamond;return out;
 }
 function sync(t,now=Date.now()){if(!is(t)||!Number.isFinite(now)||now<0||now>Number.MAX_SAFE_INTEGER)return 0;now=Math.floor(now);normalize(t);t.imgSrc=art(t);if(t.coop.phase!==2)return 0;const added={normal:0,gold:0,diamond:0},due=[];
  for(const h of t.coop.hens){if(now<h.nextEggAt)continue;const n=Math.floor((now-h.nextEggAt)/CONFIG.cycle)+1,advance=n*CONFIG.cycle;if(!Number.isSafeInteger(h.nextEggAt+advance))return 0;const batch=distribution(h.id,Math.floor(h.nextEggAt/CONFIG.cycle),n);due.push([h,advance]);for(const k of Object.keys(added))added[k]+=batch[k];}
  for(const [k,{field}] of Object.entries(CONFIG.eggTypes))if(t.coop[field]+added[k]>MAX_EGGS)return 0;
  if(!Number.isSafeInteger(t.coop.producedGold+added.gold)||!Number.isSafeInteger(t.coop.producedDiamond+added.diamond))return 0;t.coop.producedGold+=added.gold;t.coop.producedDiamond+=added.diamond;
  for(const [h,advance]of due)h.nextEggAt+=advance;for(const [k,{field}]of Object.entries(CONFIG.eggTypes))t.coop[field]+=added[k];return added.normal+added.gold+added.diamond;
 }
 function counts(t){normalize(t);return Object.fromEntries(Object.entries(CONFIG.eggTypes).map(([k,v])=>[k,t.coop[v.field]]));}
 function quote(t,selection){const values=counts(t),types={normal:0,gold:0,diamond:0};let count=0,coins=0;if(selection!==undefined&&(!selection||typeof selection!=='object'||Array.isArray(selection)))return null;
  if(selection&&Object.keys(selection).some(k=>!Object.hasOwn(CONFIG.eggTypes,k)))return null;
  for(const [k,c]of Object.entries(CONFIG.eggTypes)){const qty=selection===undefined?values[k]:selection[k]??0;if(!Number.isSafeInteger(qty)||qty<0||qty>values[k])return null;types[k]=qty;count+=qty;coins+=qty*c.price;}
  return count&&Number.isSafeInteger(coins)?{count,coins,types}:null;
 }
 function advance(t,materials,expectedPhase){normalize(t);const s=t.coop;if(s.phase!==expectedPhase)return {error:'stale'};const cost=CONFIG.costs[s.phase];if(!cost)return {error:'complete'};if(!materials.spend(cost))return {error:'materials'};s.phase++;t.imgSrc=art(t);return {phase:s.phase,percent:CONFIG.stages[s.phase]};}
 const chickenPrice=t=>CONFIG.chickenPrice+normalize(t).coop.hens.length*CONFIG.chickenPriceStep;
 function buy(t,balance,now=Date.now(),id){normalize(t);const s=t.coop;if(s.phase!==2)return {error:'building'};if(s.hens.length>=info(t).capacity)return {error:'full'};const price=chickenPrice(t);if(balance<price)return {error:'coins'};if(!Number.isFinite(now)||now<0||now>Number.MAX_SAFE_INTEGER-CONFIG.cycle)return {error:'clock'};now=Math.floor(now);
  id||='hen-'+now+'-'+Math.random().toString(36).slice(2);if(s.hens.some(h=>h.id===id))return {error:'duplicate'};sync(t,now);s.hens.push({id,color:CONFIG.colors[hash(id)%CONFIG.colors.length],nextEggAt:now+CONFIG.cycle});return {cost:price,xp:CONFIG.chickenXP};}
 function sell(t,now=Date.now(),selection){sync(t,now);const sale=quote(t,selection);if(!sale)return null;for(const [k,{field}]of Object.entries(CONFIG.eggTypes))t.coop[field]-=sale.types[k];return sale;}
 function upgrade(t,playerLevel,balance,expectedLevel){normalize(t);const s=t.coop;if(s.phase!==2)return {error:'building'};if(s.level!==expectedLevel)return {error:'stale'};const n=CONFIG.levels[s.level];if(!n)return {error:'max'};if(playerLevel<n.playerLevel)return {error:'level',required:n.playerLevel};if(balance<n.cost)return {error:'coins'};s.level++;return {cost:n.cost,capacity:n.capacity};}
 function fits(t,cols,rows,objects,ignore=t){return t.gx>=0&&t.gy>=0&&t.gx+t.w<=cols&&t.gy+t.h<=rows&&!objects.some(x=>x!==ignore&&t.gx<x.gx+(x.w||1)&&t.gx+t.w>x.gx&&t.gy<x.gy+(x.h||1)&&t.gy+t.h>x.gy);}
 function rotate(t){if(!is(t))return false;normalize(t);t.coop.orientation=t.coop.orientation?0:1;t.imgSrc=art(t);return true;}
 function geometry(t,a,width,height,tw=96){const span=tw*(t.w||CONFIG.size),w=span*.64,h=w*height/width,front={x:a.x,y:a.y+span*.2};return {x:a.x-w/2,y:front.y-h,w,h,front};}
 root.MFCoopCore={CONFIG,chickenPrice,counts,quote,eggType,distribution,is,normalize,info,art,start,sync,advance,buy,sell,upgrade,fits,rotate,geometry};
})(globalThis);
