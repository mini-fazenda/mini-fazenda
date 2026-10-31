/* A compra e o deslocamento acontecem juntos, antes de notificar o save. */
(()=>{
 const core=MFExpansionCore;let state=core.normalize(null,COLS,ROWS),pending=null,animationId=0;
 const visiting=()=>!!window.MFHost?.isVisiting?.();
 const shift=()=>({gx:state.shiftX,gy:state.shiftY,x:(state.shiftX-state.shiftY)*48,y:(state.shiftX+state.shiftY)*24});
 const capture=()=>JSON.parse(JSON.stringify(core.normalize(state,COLS,ROWS)));
 function restore(data){animationId++;state=core.normalize(data?.expansions,data?.COLS||COLS,data?.ROWS||ROWS);pending=null;dialog.hidden=true;window.MFAdapter.project.world.cols=COLS;window.MFAdapter.project.world.rows=ROWS;window.MFAmbient?.refreshSprites();window.MFAdapter?.flush();}
 const dialog=document.createElement('div');dialog.id='mf-expansion-confirm';dialog.hidden=true;
 dialog.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="mf-expansion-question"><p id="mf-expansion-question"></p><button type="button" data-buy>Comprar</button><button type="button" data-cancel>Cancelar</button></section>';
 const css=document.createElement('style');css.textContent='#mf-expansion-confirm[hidden]{display:none!important}#mf-expansion-confirm{position:fixed;inset:0;z-index:2147483647;background:#0009;display:grid;place-items:center}#mf-expansion-confirm section{background:#fff2cd;border:4px solid #845329;border-radius:20px;padding:24px;max-width:85vw;text-align:center;color:#503216;font:22px Amfost,Arial}#mf-expansion-confirm button{font:inherit;padding:10px 18px;margin:8px;border:2px solid #427125;border-radius:10px;background:#7cc94b;color:#fff}#mf-expansion-confirm [data-cancel]{background:#b77546;border-color:#754629}.mfs-upgrade-list{display:flex;gap:12px;padding:15px;align-items:stretch;flex:1}.mfs-upgrade-list article{flex:1;background:#fff5d8;border:3px solid #bb8b4d;border-radius:14px;padding:16px;color:#593619;text-align:center}.mfs-upgrade-list h3{font-size:25px;margin:0 0 14px}.mfs-upgrade-list p{font-size:18px}.mfs-upgrade-list button{font:19px Amfost,Arial;border:2px solid #426d28;border-radius:10px;background:#78bf40;color:white;padding:10px 8px;width:100%}.mfs-upgrade-list button:disabled{background:#b6ac90;border-color:#968a70;color:#514a39}.mfs-tab:disabled{opacity:.5}';document.head.append(css);document.body.append(dialog);
 dialog.querySelector('[data-cancel]').onclick=()=>{pending=null;dialog.hidden=true;};
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.querySelector('[data-cancel]').click();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)dialog.querySelector('[data-cancel]').click();});
 function ask(id){if(visiting())return false;const p=core.plan(state,COLS,ROWS,id,playerLevel,moedas);if(p.error)return false;pending=id;dialog.querySelector('p').textContent='Expandir a fazenda por '+p.e.price.toLocaleString('pt-BR')+' moedas?';dialog.hidden=false;dialog.querySelector('[data-cancel]').focus();return true;}
 function buy(id){
  if(visiting())return false;
  const p=core.plan(state,COLS,ROWS,id,playerLevel,moedas);if(p.error){window.MFToast?.(p.error);return false;}
  const {dx,dy}=p.e,wx=(dx-dy)*48,wy=(dx+dy)*24,seen=new WeakSet();
  function grid(o){if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(Number.isFinite(o.gx))o.gx+=dx;if(Number.isFinite(o.gy))o.gy+=dy;}
  function action(a){if(!a)return;grid(a.alvo);for(const k of ['targetGx','startGx','stopGx'])if(Number.isFinite(a[k]))a[k]+=dx;for(const k of ['targetGy','startGy','stopGy'])if(Number.isFinite(a[k]))a[k]+=dy;}
  for(const t of terrenos)grid(t);
  for(const actor of [player,aradora]){grid(actor);actor.x+=wx;actor.y+=wy;for(const step of actor.path||[]){step.x+=dx;step.y+=dy;}action(actor.acaoAtual);for(const t of actor.fila||[])grid(t);}
  for(const t of filaAcoes)grid(t);
  grid(caminhaoVendas);caminhaoVendas.x+=wx;caminhaoVendas.y+=wy;caminhaoVendas.stopGx+=dx;caminhaoVendas.stopGy+=dy;
  const fence=window.MFFences?.capture();if(fence){for(const f of fence.segments||[])grid(f);window.MFFences.restore(fence);}
  window.MFCancelPlacing?.();setFarmMoveMode(false);
  COLS=p.cols;ROWS=p.rows;moedas=p.coins;state=p.state;
  if(moedasSpan)moedasSpan.textContent=moedas;
  // Mesmo deslocamento de mundo para fundo, estrada e câmera: nada salta.
  const z=zoom;offsetX-=wx*z;offsetY-=wy*z;
  window.MFAdapter.project.world.cols=COLS;window.MFAdapter.project.world.rows=ROWS;
  window.MFAmbient?.refreshSprites();window.MFAdapter.cancelGlide();window.MFAdapter.flush();updateTruckDomPosition();
  dialog.hidden=true;pending=null;window.MFShop?.close();
  animate(z);window.MFHost?.changed?.('expansion');
  window.MFToast?.('Fazenda expandida! Agora você tem mais espaço para plantar.');return true;
 }
 function animate(startZoom){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  const id=++animationId;
  const target=Math.max(window.MFAdapter.project.camera.minZoom||.25,startZoom*.88),at=performance.now();
  // Zoom ao redor do centro visível, sem deslocar o ponto central do cenário.
  const base={x:offsetX,y:offsetY},cx=MFViewport.width/2,cy=MFViewport.height/2;
  function frame(now){if(id!==animationId)return;const t=Math.min(1,(now-at)/650),e=t*t*(3-2*t),next=startZoom+(target-startZoom)*e,r=next/startZoom;zoom=next;offsetX=(cx-MFViewport.width/2)*(1-r)+base.x*r;offsetY=(cy-MFViewport.height/3)*(1-r)+base.y*r;requestRedraw();if(t<1)requestAnimationFrame(frame);else window.MFHost?.changed?.('expansion-camera');}
  requestAnimationFrame(frame);
  canvas.animate([{opacity:.7},{opacity:1}],{duration:650});
 }
 dialog.querySelector('[data-buy]').onclick=()=>{if(pending!==null)buy(pending);};
 function render(body){
  const s=capture(),fmt=n=>n.toLocaleString('pt-BR');body.innerHTML='<div class="mfs-upgrade-list"></div>';const list=body.firstChild;
  let prospectiveCols=COLS,prospectiveRows=ROWS;
  for(const e of core.levels){const bought=s.applied.includes(e.id),prev=e.id===1||s.applied.includes(e.id-1),lock=playerLevel<e.level,short=moedas<e.price;
   const a=document.createElement('article');a.dataset.expansion=e.id;const label=bought?'Comprada ✓':visiting()?'Indisponível em visitas':lock?'🔒 Libera no nível '+e.level:!prev?'Compre a expansão anterior':short?'Moedas insuficientes':'Comprar';
   const from=bought?`${e.id===1?20:e.id===2?32:44} × ${e.id===1?20:e.id===2?32:44}`:`${prospectiveRows} × ${prospectiveCols}`,to=bought?`${e.rows} × ${e.cols}`:`${prospectiveRows+e.dr} × ${prospectiveCols+e.dc}`;
   if(!bought){prospectiveCols+=e.dc;prospectiveRows+=e.dr;}
   a.innerHTML=`<h3>Expansão ${e.id}</h3><div style="font-size:34px">🌱</div><p>${e.text}</p><p>${from} → ${to}</p><p>${e.level===1?'Sem exigência de nível':'Nível '+e.level}</p><p><b>${fmt(e.price)} moedas</b></p><button type="button" ${bought||lock||short||!prev||visiting()?'disabled':''}>${label}</button>`;
   a.querySelector('button').onclick=()=>ask(e.id);list.append(a);
  }
 }
 window.MFExpansion={capture,restore,shift,ask,buy,render,riverGap:()=>18.5-state.shiftX-3};
})();
