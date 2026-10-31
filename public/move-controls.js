/* Controles compactos no espaço entre Amigos e Loja. */
(()=>{
 const dock=document.createElement('div');dock.id='mf-move-dock';dock.hidden=true;dock.setAttribute('role','toolbar');dock.setAttribute('aria-label','Mover objetos');
 dock.innerHTML='<span>Toque no objeto ou cerca para selecionar.</span><button type="button" data-turn hidden>↻ Rotação</button><button type="button" data-store hidden>Guardar no MiniBaú</button><button type="button" data-done>Concluir</button>';document.body.append(dock);
 const hint=dock.querySelector('span'),turn=dock.querySelector('[data-turn]'),store=dock.querySelector('[data-store]');
 const style=document.createElement('style');style.textContent=`
 #mf-move-dock[hidden],#mf-move-dock [hidden]{display:none!important}
 #mf-move-dock{position:fixed;bottom:max(12px,env(safe-area-inset-bottom));z-index:1600;transform:translateX(-50%);box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:6px;padding:5px 7px;border:2px solid #8c582c;border-radius:12px;background:#fff0c6;box-shadow:0 3px 8px #0003;max-width:calc(100vw - 20px);color:#684424}
 #mf-move-dock span{font:12px Arial,sans-serif;text-align:center;line-height:1.25}
 #mf-move-dock button{flex:none;font:16px Amfost,Arial,sans-serif;border:2px solid #47762b;border-radius:8px;padding:6px 9px;background:linear-gradient(#9cdb63,#589b34);color:#fff;cursor:pointer;white-space:nowrap;min-height:34px}
 #mf-move-dock button:disabled{opacity:.45;cursor:default}
 #mf-move-tip,#mf-store-selected,body.mf-moving-compact #mf-fence-toolbar,body.mf-moving-compact #mf-barn-rotate{display:none!important}
 @media(max-width:900px),(max-height:500px){#mf-move-dock button{font-size:14px;padding:6px 7px}#mf-move-dock{gap:4px;padding:4px 5px}}
 `;document.head.append(style);
 const fence=()=>!!window.MFFences?.isMoveSelected?.();
 turn.onclick=()=>{if(fence())document.querySelector('#mf-fence-toolbar [data-rotate]')?.click();else if(window.MFCoop?.is(estruturaMovendo))window.MFCoop.rotate(estruturaMovendo);else if(window.MFPigsty?.is(estruturaMovendo))window.MFPigsty.rotate(estruturaMovendo);else if(estruturaMovendo?.animal){estruturaMovendo.animal.flipped=!estruturaMovendo.animal.flipped;requestRedraw();window.MFHost?.changed?.('animal-rotation');}else window.MFBarn?.rotate?.();update();};
 store.onclick=()=>{if(fence())document.querySelector('#mf-fence-toolbar [data-store]')?.click();else document.getElementById('mf-store-selected')?.click();update();};
 dock.querySelector('[data-done]').onclick=()=>{setFarmMoveMode(false);const old=document.getElementById('mf-barn-rotate');if(old)old.hidden=true;update();};
 function positionMenu(){const menu=document.getElementById('mf-fence-menu');if(!menu||menu.hidden)return;const a=document.getElementById('mf-amigos')?.getBoundingClientRect(),b=document.getElementById('mf-menu')?.getBoundingClientRect(),left=a?.right+8||12,right=b?.left-8||innerWidth-12,gap=right-left;menu.style.top='auto';menu.style.left=gap>=300?(left+right)/2+'px':'50%';menu.style.bottom=gap>=300?'max(12px,env(safe-area-inset-bottom))':Math.max(a?innerHeight-a.top:0,b?innerHeight-b.top:0)+10+'px';}
 function update(){
  positionMenu();
  const on=!!modoMover&&!window.MFHost?.isVisiting?.();document.body.classList.toggle('mf-moving-compact',on);dock.hidden=!on;if(!on)return;
  const selected=fence()||!!estruturaMovendo;hint.hidden=selected;turn.hidden=store.hidden=!selected;
  turn.disabled=!fence()&&!window.MFBarnCore?.is(estruturaMovendo)&&!estruturaMovendo?.animal&&!window.MFPigsty?.is(estruturaMovendo)&&!window.MFCoop?.is(estruturaMovendo);turn.title=turn.disabled?'Este objeto tem uma única orientação':'Alternar rotação';
  store.disabled=!fence()&&!window.MFObjects?.canStore(estruturaMovendo);
  const friends=document.getElementById('mf-amigos')?.getBoundingClientRect(),menu=document.getElementById('mf-menu')?.getBoundingClientRect();
  const left=friends&&friends.width?friends.right+8:12,right=menu&&menu.width?menu.left-8:innerWidth-12,gap=right-left;
  if(gap>=300){dock.style.left=(left+right)/2+'px';dock.style.width='max-content';dock.style.maxWidth=gap+'px';dock.style.bottom='max(12px,env(safe-area-inset-bottom))';}
  else{dock.style.left='50%';dock.style.width='max-content';dock.style.maxWidth='calc(100vw - 20px)';dock.style.bottom=(Math.max(friends?innerHeight-friends.top:0,menu?innerHeight-menu.top:0)+10)+'px';}
 }
 window.MFMoveDock={update};window.addEventListener('resize',update);setInterval(update,100);
})();
