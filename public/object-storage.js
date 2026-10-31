(function(){
 let stored=[],placing=null,point=null;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const visiting=()=>!!window.MFHost?.isVisiting?.();
 const canStore=t=>!!t&&!t.cultura&&!t.animal&&!/terra-seca|terra-arada|arando-a-terra/.test(String(t.imgSrc))&&!!t.imgSrc;
 function snapshot(t){window.MFFruitTrees?.sync(t);window.MFAnimalProduction?.repair(t,window.MFAdapter?.project?.items);window.MFAnimalLayout?.normalize(t);const data=Object.fromEntries(Object.entries(t).filter(([k,v])=>!k.startsWith('_')&&!['gx','gy'].includes(k)&&['string','number','boolean'].includes(typeof v)));if(t.fruitTree)data.fruitTree=clone(t.fruitTree);if(t.animal)data.animal=clone(t.animal);if(t.pigsty)data.pigsty=clone(t.pigsty);if(t.coop){window.MFCoopCore?.sync(t);data.coop=clone(t.coop);}return data;}
 function changed(){window.MFHost?.changed?.('object-storage');requestRedraw();}
 function store(t){
  if(visiting()||!canStore(t)||!terrenos.includes(t))return false;
  stored.push(snapshot(t));terrenos.splice(terrenos.indexOf(t),1);
  if(estruturaMovendo===t){estruturaMovendo=null;preview.active=false;}
  changed();return true;
 }
 const style=document.createElement('style');style.textContent=`
 #mf-objects[hidden]{display:none!important}#mf-objects{position:fixed;inset:0;z-index:59000;background:#16291bb8;display:grid;place-items:center;padding:18px;box-sizing:border-box}
 #mf-objects section{position:relative;width:min(720px,94vw);max-height:86vh;overflow:auto;padding:24px;background:repeating-linear-gradient(0deg,#b8783e 0,#b8783e 80px,#9b5e31 82px,#c58549 84px);border:7px solid #7c4a27;border-radius:22px;box-shadow:inset 0 0 0 2px #ecbb6b,0 15px 60px #0008;text-align:center;font-family:Amfost,Arial;color:#fff1ba;box-sizing:border-box}
 #mf-objects h2{font-size:38px;margin:0 35px 10px;color:#ffe578;text-shadow:2px 2px #68401f}#mf-objects p{font:16px Arial;line-height:1.5}
 #mf-objects .object-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
 #mf-objects article{background:#fff4cc;border:2px solid #e0bd78;border-radius:14px;padding:12px;color:#68401f}#mf-objects article img{width:100%;height:90px;object-fit:contain}#mf-objects article strong{display:block;font-size:19px;margin:8px 0}
 #mf-objects button,#mf-store-selected,#mf-placement-cancel{cursor:pointer;border:2px solid #356f28;background:linear-gradient(#91dc50,#48962d);border-radius:10px;color:white;font:20px Amfost,Arial;padding:8px 15px}
 #mf-objects .close{position:absolute;right:10px;top:10px;background:#df5543;border-color:#9b332c}
 #mf-store-selected,#mf-placement-cancel{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:1500;box-shadow:0 4px 12px #0005}
 #mf-store-selected[hidden],#mf-placement-cancel[hidden]{display:none!important}
 `;document.head.append(style);
 const modal=document.createElement('div');modal.id='mf-objects';modal.hidden=true;modal.innerHTML='<section role="dialog" aria-modal="true" aria-label="MiniBaú de objetos"><button class="close" aria-label="Fechar">×</button><h2>MiniBaú</h2><p>Seus objetos, decorações e presentes especiais.</p><div class="object-grid"></div><p class="object-empty">Nenhum objeto guardado ainda.<br>No modo mover, pegue uma decoração e clique em “Guardar no MiniBaú”.</p></section>';document.body.append(modal);
 modal.querySelector('.close').onclick=()=>modal.hidden=true;
 function render(){
  const grid=modal.querySelector('.object-grid');grid.replaceChildren();modal.querySelector('.object-empty').hidden=stored.length>0||Object.values(window.MFFences?.stock()||{}).some(n=>n>0);
  stored.forEach((t,index)=>{window.MFFruitTrees?.sync(t);window.MFAnimalProduction?.repair(t,window.MFAdapter?.project?.items);window.MFAnimalLayout?.normalize(t);const card=document.createElement('article'),img=document.createElement('img'),label=document.createElement('strong'),button=document.createElement('button');
   img.src=t.imgSrc;img.alt=t.name||'Objeto guardado';label.textContent=t.name||'Decoração';button.textContent='Colocar';button.onclick=()=>{if(visiting())return;placing=stored[index];point=null;setFarmMoveMode(false);modal.hidden=true;cancel.hidden=false;};card.append(img,label,button);grid.append(card);
  });
  window.MFFences?.renderStored(grid);
 }
 const guardar=document.createElement('button');guardar.id='mf-store-selected';guardar.textContent='Guardar no MiniBaú';guardar.hidden=true;document.body.append(guardar);guardar.onclick=()=>store(estruturaMovendo);
 const cancel=document.createElement('button');cancel.id='mf-placement-cancel';cancel.textContent='Cancelar colocação';cancel.hidden=true;document.body.append(cancel);
 function stop(){placing=null;point=null;cancel.hidden=true;requestRedraw();}cancel.onclick=stop;
 function pointer(e){const r=canvas.getBoundingClientRect();return screenPointToTile((e.clientX-r.left-MFViewport.width/2-offsetX)/zoom,(e.clientY-r.top-MFViewport.height/3-offsetY)/zoom);}
 function fits(t,p){const w=t.w||1,h=t.h||1;return p&&p.gx>=0&&p.gy>=0&&p.gx+w<=COLS&&p.gy+h<=ROWS&&!terrenos.some(x=>p.gx<x.gx+(x.w||1)&&p.gx+w>x.gx&&p.gy<x.gy+(x.h||1)&&p.gy+h>x.gy);}
 canvas.addEventListener('mousemove',e=>{if(placing){point=pointer(e);canvas.style.cursor='crosshair';requestRedraw();}});
 for(const type of ['mousedown','mouseup','click'])canvas.addEventListener(type,e=>{
  if(!placing)return;e.preventDefault();e.stopImmediatePropagation();
  if(type!=='click'||e.button!==0||visiting())return;
  point=pointer(e);if(!fits(placing,point))return;
  const index=stored.indexOf(placing);if(index<0){stop();return;}
  terrenos.push({...clone(placing),gx:point.gx,gy:point.gy});stored.splice(index,1);stop();changed();
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){stop();modal.hidden=true;}});
 // MiniBaú guarda objetos; o celeiro reutiliza o inventário de produtos e as vendas.
 document.addEventListener('click',e=>{
  if(e.target.closest?.('#mf-btn-celeiro')){e.preventDefault();e.stopImmediatePropagation();stop();window.MFFences?.stop();window.MFInventorySales?.reset();document.getElementById('overlay-bau').style.display='flex';return;}
  if(e.target.closest?.('#btn-bau')){e.preventDefault();e.stopImmediatePropagation();stop();window.MFFences?.stop();render();modal.hidden=false;return;}
 },true);
 setInterval(()=>{guardar.hidden=visiting()||!modoMover||!canStore(estruturaMovendo);},150);
 window.MFObjects={store,canStore,placing:()=>!!placing,capture:()=>clone(stored),restore:s=>{stored=Array.isArray(s)?clone(s):[];stop();render();},add:t=>{if(!canStore(t)&&!t?.animal)return false;stored.push(snapshot(t));changed();return true;},draw:g=>{
  if(!placing||!point)return;const w=placing.w||1,h=placing.h||1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)drawTile(point.gx+x,point.gy+y,fits(placing,point)?'rgba(90,220,60,.3)':'rgba(230,70,45,.3)');
  const img=preload(placing.imgSrc);if(!img?.naturalWidth)return;const a=gridToScreen(point.gx+(w-1)/2,point.gy+(h-1)/2),width=TILE_W*w*(placing.visualScale||1),height=width*img.naturalHeight/img.naturalWidth;g.save();g.globalAlpha=.65;if(!window.MFBarn?.drawSprite(g,placing,a,img)&&!window.MFCropSprites?.drawSprite(g,placing,a,img))g.drawImage(img,a.x-width/2,a.y-height+TILE_H*.9,width,height);g.restore();
 }};
 // Abre a recompensa disponível ao entrar, após a escolha do personagem.
 let shown=false;
 const timer=setInterval(()=>{
  if(shown||visiting()||!window.MFHost||!window.MFDaily||document.querySelector('#mf-char.on'))return;
  if(!window.__mfCharacter)return;
  shown=true;clearInterval(timer);
  const state=window.MFDaily.capture(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()));
  if(state.claimed<6&&(!state.lastDay||today>state.lastDay))window.MFDaily.open();
 },600);
})();
