/* Arte fixa, tópicos editáveis e recibo de leitura salvo por jogador. */
(()=>{
 const data=MFReleaseNotesData,state=new MFReleaseNotesState();let restored=false,previousFocus=null,opened=false;
 const overlay=document.createElement('div');overlay.id='mf-release-notes';overlay.hidden=true;
 overlay.innerHTML='<section class="mr-board" role="dialog" aria-modal="true" aria-labelledby="mr-title"><h1 id="mr-title" class="mr-sr">Novidades da Mini Fazenda</h1><img class="mr-art" alt=""><section aria-label="Novas funcionalidades"><ul class="mr-list mr-features"></ul></section><section aria-label="Bugs corrigidos"><ul class="mr-list mr-fixes"></ul></section><button class="mr-close" type="button" aria-label="Fechar novidades"><span class="mr-sr">Fechar</span></button><button class="mr-continue" type="button"><span class="mr-sr">Continuar</span></button></section>';
 const image=overlay.querySelector('.mr-art');image.src=new URL('./assets/ui/novidades.png',document.currentScript.src).href;
 for(const [key,selector]of [['features','.mr-features'],['fixes','.mr-fixes']])for(const text of data[key].slice(0,4)){const li=document.createElement('li');li.textContent=text;overlay.querySelector(selector).append(li);}
 const style=document.createElement('style');style.textContent=`
 #mf-release-notes[hidden]{display:none!important}#mf-release-notes{position:fixed;inset:0;z-index:100000;background:#0c211bd9;display:grid;place-items:center;padding:8px;box-sizing:border-box;overscroll-behavior:contain}
 #mf-release-notes .mr-board{position:relative;width:min(96vw,1380px,calc(94dvh * 1.5));aspect-ratio:3/2;container-type:inline-size;isolation:isolate}
 #mf-release-notes .mr-art{display:block;width:100%;height:100%;pointer-events:none}
 #mf-release-notes .mr-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
 #mf-release-notes .mr-list{position:absolute;left:43%;width:47.5%;height:20.2%;margin:0;padding:0;list-style:none;display:grid;grid-template-rows:repeat(4,1fr);color:#55351d;font:700 1.65cqw/1.1 Arial,sans-serif;text-align:left}
 #mf-release-notes .mr-features{top:33.1%}#mf-release-notes .mr-fixes{top:64.4%;height:19.6%}
 #mf-release-notes li{position:relative;display:flex;align-items:center;overflow-wrap:anywhere}
 #mf-release-notes li::before{content:'✓';position:absolute;left:-4.7cqw;width:3.5cqw;text-align:center;color:#497f2a;font-size:2.1cqw}#mf-release-notes .mr-fixes li::before{color:#237ca0}
 #mf-release-notes button{position:absolute;cursor:pointer;background:transparent;border:0;padding:0;border-radius:24px;touch-action:manipulation}
 #mf-release-notes button:focus-visible{outline:4px solid white;box-shadow:0 0 0 7px #215d1e}
 #mf-release-notes .mr-close{left:89.5%;top:5.5%;width:8.3%;height:12%}
 #mf-release-notes .mr-continue{left:36.6%;top:83.5%;width:29.4%;height:11.5%}
 #mf-latest-news{display:block;width:100%;margin-top:16px;padding:12px 14px;border:2px solid #5c932e;border-radius:9px;background:#83bc3e;color:#173916;font:700 15px Arial;cursor:pointer}
 `;document.head.append(style);document.body.append(overlay);
 const closeButton=overlay.querySelector('.mr-close'),continueButton=overlay.querySelector('.mr-continue');
 function close(){overlay.hidden=true;previousFocus?.focus?.();}
 function open(manual=false){
  if(!restored||window.MFHost?.isVisiting?.())return false;
  if(!image.complete||!image.naturalWidth){if(manual)image.onload=()=>open(true);return false;}
  if(!overlay.hidden)return true;previousFocus=document.activeElement;overlay.hidden=false;opened=true;
  if(state.seen(data.id))window.MFHost?.changed?.('release-notes-seen');continueButton.focus();return true;
 }
 closeButton.onclick=continueButton.onclick=close;
 overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}else if(event.key==='Tab'){event.preventDefault();(document.activeElement===continueButton?closeButton:continueButton).focus();}});
 const settingsButton=document.createElement('button');settingsButton.id='mf-latest-news';settingsButton.type='button';settingsButton.textContent='ÚLTIMAS NOVIDADES';settingsButton.onclick=()=>{const settings=document.getElementById('overlay-config');if(settings)settings.style.display='none';open(true);};
 (document.querySelector('#config-content h3')?.parentElement||document.getElementById('config-content')).append(settingsButton);
 function blocked(){return [...document.querySelectorAll('#mf-achievements,#mf-char,#mf-daily,#mf-level,#mf-objects,#mf-coop,#mf-pigsty,#overlay-config,#overlay-loja,#overlay-bau,#overlay-caminhao')].some(el=>!el.hidden&&getComputedStyle(el).display!=='none')||window.MFTutorial?.capture?.()?.done===false;}
 const timer=setInterval(()=>{
  if(opened||restored&&!state.pending(data.id)){clearInterval(timer);return;}
  if(!restored||document.hidden||!window.MFHost?.playing?.()||window.MFHost?.isVisiting?.()||!window.__mfCharacter||blocked())return;
  open();
 },750);
 image.onerror=()=>window.MFToast?.('Não foi possível carregar as novidades. Tente abrir pelas configurações.');
 window.MFReleaseNotes={open:()=>open(true),close,capture:()=>state.capture(),restore:s=>{state.restore(s);restored=true;},version:data.id};
})();
