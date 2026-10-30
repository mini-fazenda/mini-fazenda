/* Avisos de produção pronta, ancorados no animal e independentes do mouse. */
(()=>{
 const layer=document.createElement('div');layer.id='mf-animal-indicators';document.body.append(layer);
 const style=document.createElement('style');style.textContent=`
 #mf-animal-indicators{position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden}
 .mf-animal-ready{position:absolute;width:44px;height:48px;transform:translate(-50%,-100%);pointer-events:none}
 .mf-animal-ready span{position:absolute;inset:0 0 6px;background:linear-gradient(#fffce7,#f5e5ad);border:3px solid #5a9c35;border-radius:13px;box-shadow:0 3px 6px #0005;box-sizing:border-box;animation:mf-animal-ready-bob 1.8s ease-in-out infinite}
 .mf-animal-ready span::after{content:'';position:absolute;left:14px;bottom:-8px;width:10px;height:10px;background:#f5e5ad;border-right:3px solid #5a9c35;border-bottom:3px solid #5a9c35;transform:rotate(45deg)}
 .mf-animal-ready img{position:relative;z-index:1;display:block;width:36px;height:36px;margin:0 auto;object-fit:contain}
 @keyframes mf-animal-ready-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
 @media(prefers-reduced-motion:reduce){.mf-animal-ready span{animation:none}}
 `;document.head.append(style);
 const icons={},markers=new Map(),tops=new Map();
 function icon(tool){if(icons[tool])return icons[tool];const c=document.createElement('canvas');c.width=96;c.height=96;const g=c.getContext('2d');g.scale(2,2);window.MFAnimalTools.draw(g,tool,23,23);return icons[tool]=c.toDataURL();}
 function visibleTop(src,img){
  if(tops.has(src))return tops.get(src);
  if(!img?.complete||!img.naturalWidth)return 0;
  let top=0;try{const c=document.createElement('canvas');c.width=64;c.height=96;const g=c.getContext('2d');g.drawImage(img,0,0,64,96);const pixels=g.getImageData(0,0,64,96).data;
   outer:for(let y=0;y<96;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]>40){top=y/96;break outer;}
  }catch(_){}tops.set(src,top);return top;
 }
 function update(){
  const shown=new Set(),rect=canvas.getBoundingClientRect();
  for(const t of terrenos){
   if(modoMover&&estruturaMovendo===t)continue;
   const state=window.MFAnimalProduction.sync(t.animal);if(!state?.ready)continue;
   const img=preload(t.imgSrc);if(!img?.naturalWidth)continue;
   const vs=window.MFAdapter?.scaleForStructure?.(t,Number(t.visualScale)||1)??(Number(t.visualScale)||1);
   const w=TILE_W*(t.w||1)*vs,h=w*img.naturalHeight/img.naturalWidth;
   const a=gridToScreen(t.gx+((t.w||1)-1)/2,t.gy+((t.h||1)-1)/2);
   const sx=rect.left+(canvas.width/2+offsetX+a.x*zoom)*rect.width/canvas.width;
   const sy=rect.top+(canvas.height/3+offsetY+(a.y+TILE_H*.9-h+h*visibleTop(t.imgSrc,img))*zoom)*rect.height/canvas.height-7;
   if(sx<rect.left-30||sx>rect.right+30||sy<rect.top||sy>rect.bottom+50)continue;
   shown.add(t);let el=markers.get(t);
   if(!el){el=document.createElement('div');el.className='mf-animal-ready';el.setAttribute('role','img');el.setAttribute('aria-label',state.name+' pronto para coletar');const bubble=document.createElement('span'),picture=document.createElement('img');picture.src=icon(state.tool);picture.alt='';bubble.append(picture);el.append(bubble);layer.append(el);markers.set(t,el);}
   el.style.left=sx+'px';el.style.top=sy+'px';
  }
  for(const [t,el]of markers)if(!shown.has(t)){el.remove();markers.delete(t);}
 }
 window.MFAnimalIndicators={update};
 let previous=0;function tick(now){if(now-previous>=32){previous=now;update();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
})();
