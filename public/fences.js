/* Construção contínua, encaixe isométrico, mover e guardar no MiniBaú. */
(()=>{
 const core=window.MFFenceCore,board=core.create();let mode=null,hover=null,down=false,axis='auto',original=null,lastPaint=null;
 const visiting=()=>!!window.MFHost?.isVisiting?.();
 const point=p=>gridToScreen(p.gx-.5,p.gy-.5);
 const changed=()=>{window.MFHost?.changed?.('fences');requestRedraw();};
 function line(ctx,a,b,color,width){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
 function rail(ctx,e){const [a,b]=core.ends(e).map(point),white=e.type==='white';ctx.save();
  line(ctx,{x:a.x,y:a.y+2},{x:b.x,y:b.y+2},'#244b2828',5);
  for(const h of (e.type==='wire'?[14,25,36]:[17,35])){
   const p={x:a.x,y:a.y-h},q={x:b.x,y:b.y-h};line(ctx,p,q,e.type==='wire'?'#454333':white?'#9ba99b':'#55351f',e.type==='wire'?2:8);
   if(e.type!=='wire')line(ctx,{x:p.x,y:p.y-1},{x:q.x,y:q.y-1},white?'#fffbe6':'#bb8551',4);
   else for(const n of [.22,.5,.78]){const x=p.x+(q.x-p.x)*n,y=p.y+(q.y-p.y)*n;line(ctx,{x:x-2,y:y-3},{x:x+2,y:y+3},'#484636',1.4);}
  }ctx.restore();
 }
 function post(ctx,p){const a=point(p),white=p.type==='white';ctx.save();ctx.beginPath();ctx.moveTo(a.x-4,a.y);ctx.lineTo(a.x-4,a.y-46);ctx.lineTo(a.x+1,a.y-49);ctx.lineTo(a.x+5,a.y-46);ctx.lineTo(a.x+5,a.y);ctx.closePath();ctx.fillStyle=white?'#fffce8':'#ac7749';ctx.fill();ctx.strokeStyle=white?'#8ca18a':'#593b27';ctx.lineWidth=2;ctx.stroke();line(ctx,{x:a.x+2,y:a.y-43},{x:a.x+2,y:a.y-3},white?'#e0e6d8':'#ca9968',1.5);
  if(p.type==='flowers')for(const [dx,dy]of [[-6,-9],[5,-17]]){const x=a.x+dx,y=a.y+dy;line(ctx,{x,y:y+9},{x,y},'#4a862c',2);for(let n=0;n<5;n++){ctx.beginPath();ctx.arc(x+Math.cos(n*Math.PI*2/5)*3.3,y+Math.sin(n*Math.PI*2/5)*3.3,2.7,0,Math.PI*2);ctx.fillStyle='#ffe07c';ctx.fill();}ctx.beginPath();ctx.arc(x,y,2.3,0,Math.PI*2);ctx.fillStyle='#a56325';ctx.fill();}
  ctx.restore();
 }
 const spriteCache=new Map();
 function drawItem(ctx,item){
  const e=item.fence,isRail=item.kind==='fenceRail',cacheKey=(isRail?'rail:':'post:')+e.type+(isRail?':'+e.axis:'')+':'+TILE_W+':'+TILE_H;
  let sprite=spriteCache.get(cacheKey);
  if(!sprite){const base={type:e.type,gx:0,gy:0,axis:e.axis},pts=isRail?core.ends(base).map(point):[point(base)],x=Math.min(...pts.map(p=>p.x))-14,y=Math.min(...pts.map(p=>p.y))-55;
   const w=Math.ceil(Math.max(...pts.map(p=>p.x))-x+14),h=Math.ceil(Math.max(...pts.map(p=>p.y))-y+7),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.translate(-x,-y);if(isRail)rail(g,base);else post(g,base);sprite={src:c.toDataURL(),x,y,w,h};spriteCache.set(cacheKey,sprite);
  }
  const base=point({gx:0,gy:0}),at=point(e),x=sprite.x+at.x-base.x,y=sprite.y+at.y-base.y;
  const key='fence-'+(isRail?'rail-'+core.key(e):'post-'+e.gx+':'+e.gy);
  if(!window.MFAdapter?.spritePlace(key,sprite.src,x+sprite.w/2,y+sprite.h,sprite.w,sprite.h,1,item.footY)){if(isRail)rail(ctx,e);else post(ctx,e);}
 }
 function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,n=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-dx*n,p.y-a.y-dy*n);}
 function closest(p,type){const u=(p.x/(TILE_W/2)+p.y/(TILE_H/2))/2+.5,v=(p.y/(TILE_H/2)-p.x/(TILE_W/2))/2+.5;
  const candidates=[];if(axis!=='y')candidates.push({gx:Math.floor(u),gy:Math.round(v),axis:'x',type});if(axis!=='x')candidates.push({gx:Math.round(u),gy:Math.floor(v),axis:'y',type});
  return candidates.filter(e=>core.fits(e,COLS,ROWS)).sort((a,b)=>distance(p,...core.ends(a).map(point))-distance(p,...core.ends(b).map(point)))[0]||null;
 }
 function hit(p,tolerance=11){return board.list().map(e=>{const [a,b]=core.ends(e).map(point);return {e,d:Math.min(...[0,17,35].map(h=>distance(p,{x:a.x,y:a.y-h},{x:b.x,y:b.y-h})))};}).filter(o=>o.d<tolerance/zoom).sort((a,b)=>a.d-b.d)[0]?.e||null;}
 function mouse(e){const r=canvas.getBoundingClientRect();return {x:((e.clientX-r.left)*canvas.width/r.width-canvas.width/2-offsetX)/zoom,y:((e.clientY-r.top)*canvas.height/r.height-canvas.height/3-offsetY)/zoom};}
 const toolbar=document.createElement('div');toolbar.id='mf-fence-toolbar';toolbar.hidden=true;toolbar.innerHTML='<span></span><button type="button" data-rotate>Direção: automática ↔</button><button type="button" data-store hidden>Guardar no MiniBaú</button><button type="button" data-cancel>Concluir</button>';document.body.append(toolbar);
 const info=toolbar.querySelector('span'),rotate=toolbar.querySelector('[data-rotate]'),store=toolbar.querySelector('[data-store]');
 const style=document.createElement('style');style.textContent='#mf-fence-toolbar[hidden]{display:none!important}#mf-fence-toolbar{position:fixed;z-index:1400;bottom:110px;left:50%;transform:translateX(-50%);background:#fff0bd;border:3px solid #86552b;border-radius:14px;padding:10px;display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:90vw;width:max-content;box-shadow:0 4px 15px #0006;color:#63401f;font:17px Amfost,Arial}#mf-fence-toolbar button{font:17px Amfost,Arial;background:linear-gradient(#a4df64,#589a33);border:2px solid #46752b;border-radius:8px;padding:6px 10px;color:white;cursor:pointer}';document.head.append(style);
 function stop(){mode=null;hover=null;original=null;down=false;lastPaint=null;toolbar.hidden=true;if(modoColocar==='fence')modoColocar=false;canvas.style.cursor='default';requestRedraw();}
 function start(type,fromStock=false){if(visiting()||!core.catalog[type])return;stop();setFarmMoveMode(false);mode={type,fromStock};axis='auto';modoColocar='fence';placingItem=null;preview.active=false;toolbar.hidden=false;store.hidden=true;rotate.textContent='Direção: automática ↔';info.textContent=core.catalog[type].name+(fromStock?' — guardada':' — '+core.catalog[type].price+' moedas/trecho');canvas.style.cursor='crosshair';}
 function turn(){axis=axis==='auto'?'x':axis==='x'?'y':'auto';rotate.textContent=axis==='auto'?'Direção: automática ↔':axis==='x'?'Direção: ↘ (R)':'Direção: ↙ (R)';requestRedraw();}rotate.onclick=turn;toolbar.querySelector('[data-cancel]').onclick=stop;
 store.onclick=()=>{if(original&&board.store(original)){changed();stop();}};
 function commit(e){if(!e||visiting())return false;if(original){if(board.move(original,e,COLS,ROWS)){original={...e};changed();stop();return true;}info.textContent='Esse trecho já está ocupado.';return false;}
  const result=board.place(e,COLS,ROWS,moedas,mode.fromStock);if(!result.ok){info.textContent=result.reason;return false;}if(result.cost)window.MFValueSource?.tile({gx:e.gx+(e.axis==='x'?.5:0)-.5,gy:e.gy+(e.axis==='y'?.5:0)-.5,w:1,h:1},'compra');moedas-=result.cost;document.getElementById('valor-moedas').textContent=moedas;changed();return true;
 }
 function paint(e){if(!e)return;const previous=lastPaint;if(previous&&previous.axis===e.axis&&(e.axis==='x'?previous.gy===e.gy:previous.gx===e.gx)){const field=e.axis==='x'?'gx':'gy';for(let n=Math.min(previous[field],e[field]);n<=Math.max(previous[field],e[field]);n++){const step={...e,[field]:n};if(board.canPlace(step,COLS,ROWS)&&!commit(step))break;}}else commit(e);lastPaint=e;}
 // No modo Mover o clique da cerca deve ser capturado antes do clique genérico do terreno.
 // Também expomos as mesmas operações para os toques, sem sintetizar eventos de mouse.
 function selectMoveAt(x,y,touch=false){
  if(visiting()||!modoMover||estruturaMovendo||mode)return false;
  const target=hit(mouse({clientX:x,clientY:y}),touch?22:13);
  if(!target)return false;
  mode={type:target.type};original=target;hover=target;axis='auto';
  rotate.textContent='Direção: automática ↔';
  toolbar.hidden=false;store.hidden=false;
  info.textContent='Cerca selecionada — arraste ou toque no destino para mover.';
  canvas.style.cursor='grabbing';requestRedraw();
  return true;
 }
 function hoverMoveAt(x,y){
  if(!original||!modoMover)return false;
  hover=closest(mouse({clientX:x,clientY:y}),original.type);
  requestRedraw();
  return !!hover;
 }
 function commitMoveAt(x,y){
  if(!original||!modoMover)return false;
  hoverMoveAt(x,y);
  if(!hover){info.textContent='Fora do mapa. Escolha outra posição.';return false}
  return commit(hover);
 }
 document.addEventListener('click',e=>{
  if(e.target!==canvas||visiting()||!modoMover)return;
  const consumed=original?commitMoveAt(e.clientX,e.clientY):selectMoveAt(e.clientX,e.clientY);
  if(consumed||original){
   e.preventDefault();e.stopImmediatePropagation();
  }
 },true);
 document.addEventListener('click',e=>{
  const card=e.target.closest?.('#item-cerca-flores,#item-cerca-arame,#item-cerca-branca');if(card){e.preventDefault();e.stopImmediatePropagation();const type=Object.keys(core.catalog).find(t=>core.catalog[t].id===card.id);start(type);return;}
  if(mode&&e.target.closest?.('#btn-mover,#btn-enxada,#btn-trator,#btn-loja,#btn-bau,#mf-btn-celeiro,#mf-btn-presente'))stop();
 },true);
 for(const event of ['mousedown','mousemove','mouseup','click'])canvas.addEventListener(event,e=>{
  if(visiting())return;const p=mouse(e);
  if(!mode&&modoMover&&!estruturaMovendo){const target=hit(p);if(event==='click'&&target){e.preventDefault();e.stopImmediatePropagation();mode={type:target.type};original=target;axis='auto';rotate.textContent='Direção: automática ↔';hover=target;toolbar.hidden=false;store.hidden=false;info.textContent='Mover cerca — escolha outro trecho ou guarde no MiniBaú';requestRedraw();return;}if(target&&(event==='mousedown'||event==='mouseup')){e.preventDefault();e.stopImmediatePropagation();return;}}
  if(!mode&&modoTrator){const target=hit(p);if(target){e.preventDefault();e.stopImmediatePropagation();if(event==='click'&&board.store(target))changed();return;}}
  if(!mode)return;e.preventDefault();e.stopImmediatePropagation();hover=closest(p,mode.type);canvas.style.cursor='crosshair';
  if(event==='mousedown'&&e.button===0){down=true;if(!original)paint(hover);}
  if(event==='mousemove'&&down&&!original)paint(hover);
  if(event==='mouseup')down=false;
  if(event==='click'&&original)commit(hover);
  requestRedraw();
 },true);
 canvas.addEventListener('mouseleave',()=>{hover=null;down=false;requestRedraw();});window.addEventListener('mouseup',()=>down=false);window.addEventListener('blur',()=>down=false);
 document.addEventListener('keydown',e=>{if(!mode||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='Escape'){stop();e.preventDefault();}else if(e.key.toLowerCase()==='r'){turn();e.preventDefault();}});
 function previewDraw(ctx){if(!mode||!hover)return;const available=original?true:mode.fromStock?board.stock()[mode.type]>0:moedas>=core.catalog[mode.type].price;const fits=available&&board.canPlace(hover,COLS,ROWS,original?core.key(original):null);ctx.save();ctx.globalAlpha=.65;rail(ctx,hover);for(const p of core.ends(hover))post(ctx,{...p,type:hover.type});const [a,b]=core.ends(hover).map(point);line(ctx,a,b,fits?'#b5ed55':'#ef6551',5);ctx.restore();}
 window.MFFences={start,stop,isMoveSelected:()=>!!(original&&modoMover),selectMoveAt,hoverMoveAt,commitMoveAt,capture:()=>board.capture(),restore:s=>{stop();board.restore(s);requestRedraw();},stock:()=>board.stock(),renderStored(grid){for(const [type,count]of Object.entries(board.stock())){if(!count)continue;const card=document.createElement('article'),pic=document.createElement('img'),label=document.createElement('strong'),button=document.createElement('button');pic.src=core.catalog[type].icon;pic.alt=core.catalog[type].name;label.textContent=core.catalog[type].name+' ×'+count;button.textContent='Colocar';button.onclick=()=>{document.getElementById('mf-objects').hidden=true;start(type,true);};card.append(pic,label,button);grid.append(card);}},appendDrawables(list){if(mode&&((!original&&modoColocar!=='fence')||(original&&!modoMover)))stop();for(const e of board.list()){if(original&&core.key(e)===core.key(original))continue;const [a,b]=core.ends(e).map(point);list.push({kind:'fenceRail',fence:e,depth:(a.y+b.y)/2,footY:(a.y+b.y)/2});}for(const p of board.posts()){const a=point(p);list.push({kind:'fencePost',fence:p,depth:a.y+.1,footY:a.y});}},drawItem,drawPreview:previewDraw};
})();
