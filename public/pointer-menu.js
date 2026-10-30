(function(){
 const button=document.getElementById('btn-mover');if(!button)return;
 const arrow='<path d="M19 12L20 45L28 36L36 50L43 46L35 33L48 31Z" fill="white" stroke="#50772a" stroke-width="2.5" stroke-linejoin="round"/>';
 const move='<path d="M32 10v44M10 32h44M24 18l8-8 8 8M24 46l8 8 8-8M18 24l-8 8 8 8M46 24l8 8-8 8" fill="none" stroke="white" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>';
 const menu=document.createElement('div');menu.id='mf-pointer-menu';menu.hidden=true;
 const option=document.createElement('button');option.type='button';option.textContent='✥ Mover objetos';menu.append(option);document.body.append(menu);
 const style=document.createElement('style');style.textContent=`
 #btn-mover{position:relative!important;overflow:visible!important}#btn-mover .mf-pointer-chevron{position:absolute;right:-2px;top:-7px;z-index:10;width:25px;height:23px;border:2px solid #386c24;border-radius:7px;background:linear-gradient(#b4ef88,#69bb3d);display:grid;place-items:center;font:bold 17px Arial;color:white;text-shadow:0 1px #406a25;cursor:pointer}
 #mf-pointer-menu[hidden]{display:none!important}#mf-pointer-menu{position:fixed;z-index:65000;padding:6px;background:#f8edc8;border:3px solid #835528;border-radius:12px;box-shadow:0 5px 15px #0006}
 #mf-pointer-menu button{font:20px Amfost,Arial;background:linear-gradient(#a9e778,#63ad36);color:#fff;border:2px solid #487b2b;border-radius:8px;padding:9px 17px;cursor:pointer;text-shadow:1px 1px #456b25}
 `;document.head.append(style);
 let renderedMode;
 function sync(){renderedMode=modoMover;button.innerHTML=window.MFMenuTile(modoMover?move:arrow);const chevron=document.createElement('span');chevron.className='mf-pointer-chevron';chevron.dataset.mfMoveMenu='1';chevron.setAttribute('role','button');chevron.setAttribute('tabindex','0');chevron.setAttribute('aria-label','Abrir opções da seta');chevron.textContent='▴';chevron.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};button.append(chevron);button.title=modoMover?'Mover objetos ativo. Clique na seta para voltar ao automático.':'Seta automática. Abra a setinha para escolher mover.';button.setAttribute('aria-pressed',String(modoMover));}
 function toggle(){const r=button.getBoundingClientRect();menu.hidden=!menu.hidden;menu.style.left=Math.max(8,Math.min(innerWidth-200,r.left-90))+'px';menu.style.top=Math.max(8,r.top-65)+'px';if(!menu.hidden)option.focus();}
 option.onclick=e=>{e.stopPropagation();setFarmMoveMode(true);menu.hidden=true;sync();};
 document.addEventListener('click',e=>{if(!e.target.closest?.('#btn-mover,#mf-pointer-menu'))menu.hidden=true;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true;});
 window.MFPointerMenu={toggle,sync,close:()=>menu.hidden=true};sync();
 setInterval(()=>{if(renderedMode!==modoMover)sync();},200);
})();
