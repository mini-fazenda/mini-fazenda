/* Configuração e regras do Chiqueiro; todo crescimento usa data absoluta. */
(function(root){
 const CONFIG={levels:[{level:1,capacity:3,cost:2000,size:6},{level:12,capacity:6,cost:5000,size:8},{level:25,capacity:10,cost:12000,size:10}],pigPrice:2000,growTime:90*60000,minWeight:20,maxWeight:120,maxSale:5000,saleXP:0};
 const imageLevel=t=>Number(String(t?.imgSrc||'').match(/(?:^|\/)chiqueiro\/nivel([123])(?:-solo-v\d+)?\.webp(?:[?#]|$)/i)?.[1])||0;
 const is=t=>t?.itemId==='item-chiqueiro'||t?.id==='item-chiqueiro'||t?.catalogId==='item-chiqueiro'||!!t?.pigsty||imageLevel(t)>0;
 const info=t=>CONFIG.levels[Math.max(0,Math.min(2,(t?.pigsty?.level||1)-1))];
 function normalize(t){if(!is(t))return t;t.pigsty||={level:imageLevel(t)||1};t.itemId='item-chiqueiro';t.name='Chiqueiro';const s=t.pigsty;s.level=Math.max(1,Math.min(3,Math.floor(Number(s.level)||1)));s.orientation=s.orientation?1:0;s.pigs=(Array.isArray(s.pigs)?s.pigs:Object.values(s.pigs||{})).filter(p=>p&&typeof p.id==='string'&&Number.isFinite(p.bornAt));s.notices||={};return t;}
 const art=t=>'assets/chiqueiro/nivel'+(t.pigsty?.level||1)+'-solo-v2.webp';
 function start(gx,gy){const t={gx,gy,w:6,h:6,itemId:'item-chiqueiro',name:'Chiqueiro',visualScale:1,pigsty:{level:1,orientation:0,pigs:[],notices:{}}};t.imgSrc=art(t);return t;}
 function stats(p,now=Date.now()){const ratio=Math.max(0,Math.min(1,(now-p.bornAt)/CONFIG.growTime)),weight=CONFIG.minWeight+(CONFIG.maxWeight-CONFIG.minWeight)*ratio,stage=weight>=120?120:weight>=100?100:weight>=70?70:weight>=40?40:20;return {ratio,weight,stage,remaining:CONFIG.growTime*(1-ratio),coins:Math.min(CONFIG.maxSale,Math.floor(weight*CONFIG.maxSale/CONFIG.maxWeight))};}
 function buy(t,balance,now=Date.now(),id){normalize(t);if(!is(t)||t.pigsty.pigs.length>=info(t).capacity)return {error:'full'};if(balance<CONFIG.pigPrice)return {error:'coins'};const p={id:id||('pig-'+now+'-'+Math.random().toString(36).slice(2)),bornAt:now};t.pigsty.pigs.push(p);return {pig:p,cost:CONFIG.pigPrice};}
 function sell(t,id,now=Date.now()){normalize(t);const i=t?.pigsty?.pigs?.findIndex(p=>p.id===id);if(i==null||i<0)return null;const p=t.pigsty.pigs[i],s=stats(p,now);t.pigsty.pigs.splice(i,1);return {...s,xp:CONFIG.saleXP};}
 function fits(t,cols,rows,objects,ignore=t){return t.gx>=0&&t.gy>=0&&t.gx+t.w<=cols&&t.gy+t.h<=rows&&!objects.some(x=>x!==ignore&&t.gx<x.gx+(x.w||1)&&t.gx+t.w>x.gx&&t.gy<x.gy+(x.h||1)&&t.gy+t.h>x.gy);}
 function upgrade(t,playerLevel,balance,cols,rows,objects){normalize(t);const n=CONFIG.levels[t.pigsty.level];if(!n)return {error:'max'};if(playerLevel<n.level)return {error:'level',required:n.level};if(balance<n.cost)return {error:'coins'};const next={...t,w:n.size,h:n.size};next.gx=Math.max(0,Math.min(cols-next.w,t.gx+(t.w-next.w)/2));next.gy=Math.max(0,Math.min(rows-next.h,t.gy+(t.h-next.h)/2));if(!fits(next,cols,rows,objects,t))return {error:'space'};Object.assign(t,{gx:next.gx,gy:next.gy,w:next.w,h:next.h});t.pigsty.level++;t.imgSrc=art(t);return {cost:n.cost};}
 function rotate(t){normalize(t);if(!is(t))return false;t.pigsty.orientation=t.pigsty.orientation?0:1;return true;}
 function geometry(t,anchor,width,height,tileW=96,tileH=48){const w=tileW*((t.w||6)+(t.h||6))/2,h=w*height/width,front={x:anchor.x+((t.w||6)-(t.h||6))*tileW/4,y:anchor.y+((t.w||6)+(t.h||6))*tileH/4};return {x:front.x-w/2,y:front.y-h,w,h,front};}
 root.MFPigstyCore={CONFIG,is,normalize,info,art,start,stats,buy,sell,fits,upgrade,rotate,geometry};
})(globalThis);
