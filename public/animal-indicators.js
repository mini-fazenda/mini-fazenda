/* Uma única camada de marcadores, atualizada pelo loop de desenho do mapa. */
(()=>{
 const SRC='assets/ui/marcador-pronto.png',art=preload(SRC),markers=new Map(),tops=new Map(),phases=new WeakMap();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // O estado pronto depende do relógio, não da câmera. Reavaliá-lo a cada
 // quadro multiplica o trabalho por todos os canteiros quando se vê o mapa todo.
 let readyStates=new WeakMap(),lastReadinessAt=-Infinity;
 function readyState(t,now,clock){
  if(now-lastReadinessAt>=125||now<lastReadinessAt){
   readyStates=new WeakMap();lastReadinessAt=now;
  }
  if(readyStates.has(t))return readyStates.get(t);
  const value=MFReadyCore.readyFor(t,clock);
  readyStates.set(t,value);
  return value;
 }
 const assignChanged=(style,name,value)=>{if(style[name]!==value)style[name]=value};
 const layer=document.createElement('div');layer.id='mf-animal-indicators';document.body.append(layer);
 const style=document.createElement('style');style.textContent=`#mf-animal-indicators{position:fixed;inset:0;pointer-events:none;z-index:7;overflow:hidden}.mf-ready-marker{position:absolute;transform:translate(-50%,-100%);padding:0;border:0;background:none;cursor:pointer;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.mf-ready-marker:focus-visible{outline:2px solid white;border-radius:8px}.mf-ready-marker .gem{position:absolute;bottom:0;overflow:hidden;transform-origin:center bottom;pointer-events:none}.mf-ready-marker img{position:absolute;width:147.126437%;height:auto;left:-23.563218%;top:-32.317073%;pointer-events:none;user-select:none}`;document.head.append(style);
 function visibleTop(src,img){if(tops.has(src))return tops.get(src);if(!img?.complete||!img.naturalWidth)return 0;let top=0;try{const c=document.createElement('canvas');c.width=64;c.height=96;const g=c.getContext('2d');g.drawImage(img,0,0,64,96);const data=g.getImageData(0,0,64,96).data;outer:for(let y=0;y<96;y++)for(let x=0;x<64;x++)if(data[(y*64+x)*4+3]>40){top=y/96;break outer;}}catch(_){}tops.set(src,top);return top;}
 function activate(t,e){e.preventDefault();e.stopImmediatePropagation();if(!terrenos.includes(t)||window.MFHost?.isVisiting?.()||modoMover||modoColocar)return;const s=MFReadyCore.readyFor(t);if(!s)return;if(s.kind==='pigsty')window.MFPigsty?.open(t);else queueJob(t,s.kind);requestRedraw();}
 function update(now=performance.now()){
  const shown=new Set(),rect=canvas.getBoundingClientRect(),sx=rect.width/MFViewport.width,sy=rect.height/MFViewport.height,clock=Date.now();
  if(!art.complete||!art.naturalWidth){for(const m of markers.values())m.el.hidden=true;return;}
  for(const t of terrenos){if(modoMover&&estruturaMovendo===t)continue;const state=readyState(t,now,clock);if(!state)continue;
   const src=state.kind==='pigsty'?MFPigstyCore.art(t):window.MFBarn?.src(t)||window.MFNatureAssets?.srcFor(t)||window.MFSheepAnimation?.src(t)||t.imgSrc,img=preload(src);if(!img?.complete||!img.naturalWidth)continue;
   const a=gridToScreen(t.gx+((t.w||1)-1)/2,t.gy+((t.h||1)-1)/2),vs=window.MFAdapter?.scaleForStructure?.(t,Number(t.visualScale)||1)??(Number(t.visualScale)||1),w=TILE_W*(t.w||1)*vs,h=w*img.naturalHeight/img.naturalWidth;
   const box=state.kind==='pigsty'?MFPigstyCore.geometry(t,a,img.naturalWidth,img.naturalHeight):state.kind==='tree'&&window.MFTreeCatalog?MFTreeCatalog.geometry(t,img,a):{x:a.x-w/2,y:a.y+TILE_H*.9-h,w,h};
   const x=rect.left+(MFViewport.width/2+offsetX+(box.x+box.w/2)*zoom)*sx,top=box.y+box.h*visibleTop(src,img),y=rect.top+(MFViewport.height/3+offsetY+top*zoom)*sy-8,width=MFReadyCore.width(zoom,sx),height=width*164/174;
   if(x+width/2<rect.left||x-width/2>rect.right||y+6<rect.top||y-height-6>rect.bottom)continue;
   shown.add(t);let m=markers.get(t);if(!m){let phase=phases.get(t);if(phase===undefined){phase=Math.random()*Math.PI*2;phases.set(t,phase);}const el=document.createElement('button'),gem=document.createElement('span'),im=document.createElement('img');el.type='button';el.className='mf-ready-marker';el.setAttribute('aria-label',state.name+' — pronto para coletar');gem.className='gem';im.src=SRC;im.alt='';im.draggable=false;gem.append(im);el.append(gem);el.onclick=e=>activate(t,e);for(const type of ['pointerdown','mousedown','touchstart'])el.addEventListener(type,e=>e.stopPropagation(),{passive:true});layer.append(el);m={el,gem,born:now,phase};markers.set(t,m);}
   const anim=MFReadyCore.motion(now,m.born,m.phase,reduced.matches),hitW=Math.max(32,width),hitH=Math.max(32,height);
   const elStyle=m.el.style,gemStyle=m.gem.style;
   assignChanged(elStyle,'left',x+'px');assignChanged(elStyle,'top',y+anim.bob+'px');
   assignChanged(elStyle,'width',hitW+'px');assignChanged(elStyle,'height',hitH+'px');
   assignChanged(elStyle,'opacity',String(anim.opacity));if(m.el.hidden)m.el.hidden=false;
   assignChanged(gemStyle,'width',width+'px');assignChanged(gemStyle,'height',height+'px');
   assignChanged(gemStyle,'left',(hitW-width)/2+'px');
   assignChanged(gemStyle,'transform','scale('+anim.scale+')');
  }
  for(const [t,m]of markers)if(!shown.has(t)){m.el.remove();markers.delete(t);}
 }
 window.MFReadyMarkers={update,entries:()=>[...markers].map(([t,m])=>({t,element:m.el,phase:m.phase}))};window.MFAnimalIndicators={update};
})();
