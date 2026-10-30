/* Celeiro colocado no mapa: obra autônoma, giro e acesso às vendas. */
(()=>{
 const core=window.MFBarnCore;let orientation=0,drag=null;
 const visiting=()=>!!window.MFHost?.isVisiting?.();
 const changed=()=>{window.MFHost?.changed?.('barn');requestRedraw();};
 const normalize=t=>{if(core.is(t)){Object.assign(t,core.layout(t.barnOrientation));t.imgSrc=core.art(t);}};
 const turn=document.createElement('button');turn.id='mf-barn-rotate';turn.type='button';turn.textContent='↻ Girar celeiro (R)';turn.hidden=true;
 Object.assign(turn.style,{position:'fixed',bottom:'115px',left:'50%',transform:'translateX(-50%)',zIndex:'1600',background:'#72b83d',border:'3px solid #4c702c',borderRadius:'12px',padding:'9px 15px',color:'white',font:'18px Amfost,Arial',cursor:'pointer'});document.body.append(turn);
 const active=()=>placingItem?.id===core.ID;
 function updatePreview(){const l=core.layout(orientation),src=`assets/construcoes/celeiro-${orientation}.png`;Object.assign(placingItem,l,{imgSrc:src});if(selectedItem?.id===core.ID)Object.assign(selectedItem,l,{imgSrc:src});preview.img=preload(src);requestRedraw();}
 function rotate(){if(visiting())return;if(active()){orientation=orientation?0:1;updatePreview();return;}if(modoMover&&core.is(estruturaMovendo)){if(!core.rotate(estruturaMovendo,COLS,ROWS,terrenos)){window.MFToast?.('Falta espaço para girar o celeiro.');return;}preview.gridX=estruturaMovendo.gx;preview.gridY=estruturaMovendo.gy;preview.img=preload(estruturaMovendo.imgSrc);changed();}}
 turn.onclick=rotate;
 function select(){if(visiting()||moedas<200)return;window.MFFences?.stop();window.MFHoe?.stop();setFarmMoveMode(false);orientation=0;placingItem={id:core.ID,tipo:'proprio',price:200,xp:5,...core.layout(0),imgSrc:'assets/construcoes/celeiro-0.png'};selectedItem={...placingItem};continuousSelection=false;modoColocar='placing';preview.active=true;updatePreview();turn.hidden=false;}
 function place(gx,gy){if(visiting()||moedas<200)return false;const t=core.start(gx,gy,orientation);if(!core.fits(t,COLS,ROWS,terrenos))return false;terrenos.push(t);moedas-=200;if(moedasSpan)moedasSpan.textContent=moedas;window.MFGameAudio?.event('place',core.ID);window.MFCancelPlacing?.();turn.hidden=true;changed();return true;}
 function point(e){const r=canvas.getBoundingClientRect();return {x:((e.clientX-r.left)*canvas.width/r.width-canvas.width/2-offsetX)/zoom,y:((e.clientY-r.top)*canvas.height/r.height-canvas.height/3-offsetY)/zoom};}
 document.addEventListener('click',e=>{if(e.target.closest?.('#item-celeiro')){e.preventDefault();e.stopImmediatePropagation();select();}},true);
 for(const type of ['mousedown','mouseup','click'])window.addEventListener(type,e=>{
  if(e.target!==canvas||visiting())return;
  if(type==='mousedown')drag={x:e.clientX,y:e.clientY,moved:false};
  if(active()){e.preventDefault();e.stopImmediatePropagation();if(type==='click'){const p=point(e),g=screenPointToTile(p.x,p.y);place(g.gx,g.gy);}return;}
  if(type!=='click'||modoMover||modoTrator||modoColocar||drag?.moved)return;
  const p=point(e),t=terrainAtPointer(p.x,p.y);if(!core.is(t))return;e.preventDefault();e.stopImmediatePropagation();
  if(Date.now()<t.barnReadyAt){window.MFToast?.('Celeiro em construção: '+format(t.barnReadyAt-Date.now()));return;}
  window.MFInventorySales?.reset();document.getElementById('overlay-bau').style.display='flex';
 },true);
 window.addEventListener('mousemove',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8)drag.moved=true;});
 document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&(active()||modoMover&&core.is(estruturaMovendo))){e.preventDefault();rotate();}});
 function format(ms){const n=Math.max(0,Math.ceil(ms/1000));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
 function tick(){let dirty=false;const award=!visiting()&&(!window.MFHost||window.MFHost.playing());for(const t of terrenos){if(!core.is(t))continue;const result=core.sync(t,Date.now(),award);if(result.stars)addXP(result.stars);dirty ||= result.changed;}turn.hidden=visiting()||!(active()||modoMover&&core.is(estruturaMovendo));if(dirty)changed();}
 setInterval(tick,500);
 window.MFBarn={select,place,rotate,tick,normalize,is:core.is,src:t=>core.is(t)?core.art(t):null,draw(g){
  for(const t of terrenos){if(!core.is(t)||Date.now()>=t.barnReadyAt||modoMover&&estruturaMovendo===t)continue;
   const a=gridToScreen(t.gx+(t.w-1)/2,t.gy+(t.h-1)/2),progress=Math.min(1,Math.max(0,(Date.now()-t.barnStartedAt)/core.TIME)),x=a.x-72,y=a.y-278;
   g.save();g.fillStyle='#513824';g.fillRect(x,y,144,34);g.fillStyle='#78c63f';g.fillRect(x+3,y+3,138*progress,9);g.font='15px Arial';g.textAlign='center';g.fillStyle='#fff4cc';g.fillText('Construindo '+format(t.barnReadyAt-Date.now()),a.x,y+28);g.restore();
  }
 }};
})();
