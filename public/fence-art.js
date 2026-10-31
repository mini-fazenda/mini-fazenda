/* Trilhos e postes da folha enviada, separados para compartilhar cantos. */
(function(root){
 let atlas;const cells=new Map(),rows={flowers:0,wire:1,white:2};
 function cell(type,part){
  if(!atlas?.complete||!atlas.naturalWidth||rows[type]===undefined)return null;
  const key=type+':'+part;if(cells.has(key))return cells.get(key);
  const c=document.createElement('canvas');c.width=80;c.height=100;
  c.getContext('2d').drawImage(atlas,part*80,rows[type]*100,80,100,0,0,80,100);cells.set(key,c);return c;
 }
 function rail(g,e,at,end){const part=e.axis==='y'?0:1,c=cell(e.type,part);if(!c)return false;
  if(end){const dx=part===0?-48:48;g.save();g.translate(at.x,at.y);g.transform((end.x-at.x)/dx,((end.y-at.y)-24)/dx,0,1,0,0);g.drawImage(c,-(part===0?64:15),-55);g.restore();}
  else g.drawImage(c,at.x-(part===0?64:15),at.y-55);return true;}
 function post(g,p,at){const c=cell(p.type,2);if(!c)return false;g.drawImage(c,at.x-40,at.y-85);return true;}
 root.MFFenceArt={rail,post,ready:()=>!!(atlas?.complete&&atlas.naturalWidth)};
 if(typeof document==='undefined')return;
 atlas=new Image();atlas.onload=()=>{cells.clear();root.MFFences?.refreshArt?.();};
 atlas.src=new URL('./assets/cercas/atlas.png',document.currentScript.src).href;
})(typeof window==='undefined'?globalThis:window);
