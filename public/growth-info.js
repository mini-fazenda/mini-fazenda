/* Informações de crescimento acessíveis por toque e mouse. */
(function(root){
 function describe(t,now=Date.now(),items=root.MFAdapter?.project?.items||{}){
  if(!t)return null;
  let name,start,total,remaining;
  if(t.fruitTree){const cfg=root.MFFruitTrees?.config(t);if(!cfg)return null;name=cfg.treeName;start=t.fruitTree.startTime;total=cfg.cycle;}
  else if(t.cultura&&t.cultura.tipo!=='morta'){const c=t.cultura,entry=items['item-'+c.tipo]||{};name=entry.name||c.tipo;start=c.startTime;total=entry.growTime||c.totalTime;}
  else if(t.animal){const a=t.animal,cfg=root.MFAnimalProduction?.types[a.tipo],entry=items['item-'+a.tipo]||{},matureAt=Number(a.startTime)+Number(a.totalTime);
   if(now<matureAt){name=(entry.name||({vaca:'Vaca',ovelha:'Ovelha'}[a.tipo])||a.tipo)+' · crescimento';start=a.startTime;total=a.totalTime;}
   else if(cfg){name=cfg.name;total=cfg.cycle;const readyAt=Number(a.production?.readyAt);remaining=Math.max(0,(Number.isFinite(readyAt)?readyAt:matureAt+total)-now);}
   else return null;
  }else return null;
  total=Math.max(1,Number(total)||1);if(remaining===undefined)remaining=Math.max(0,total-Math.max(0,now-Number(start)));
  const ready=remaining<=0,percent=ready?100:Math.min(99,Math.max(0,Math.floor(100*(1-remaining/total))));return {name,percent,remaining,ready};
 }
 function format(ms){const seconds=Math.max(0,Math.ceil(ms/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60),s=seconds%60;return hours?hours+'h '+minutes+'min':minutes?minutes+'min '+s+'s':s+'s';}
 root.MFGrowthInfo={describe,format};if(typeof document==='undefined')return;
 const box=document.createElement('div');box.id='mf-growth-info';box.hidden=true;box.setAttribute('role','status');box.innerHTML='<strong></strong><div role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div><span></span>';document.body.append(box);
 const style=document.createElement('style');style.textContent=`#mf-growth-info[hidden]{display:none!important}#mf-growth-info{position:fixed;z-index:8;pointer-events:none;box-sizing:border-box;width:176px;padding:7px 10px;border:2px solid #a0cb62;border-radius:10px;background:#243b20ed;color:#fff8d5;text-align:center;font:12px Arial;box-shadow:0 2px 6px #0006}#mf-growth-info strong{display:block;font-size:13px;margin-bottom:5px}#mf-growth-info [role=progressbar]{height:6px;overflow:hidden;border-radius:5px;background:#14230f;margin-bottom:4px}#mf-growth-info i{display:block;height:100%;background:#a2df57}#mf-growth-info span{display:block}`;document.head.append(style);
 let selected=null,touch=false;
 function select(x,y){const r=canvas.getBoundingClientRect(),mx=((x-r.left)*MFViewport.width/r.width-MFViewport.width/2-offsetX)/zoom,my=((y-r.top)*MFViewport.height/r.height-MFViewport.height/3-offsetY)/zoom;selected=terrainAtPointer(mx,my);update();}
 canvas.addEventListener('touchend',e=>{if(e.changedTouches.length===1){touch=true;const t=e.changedTouches[0];select(t.clientX,t.clientY);}},true);
 canvas.addEventListener('mousemove',e=>{if(e.isTrusted&&window.__mfPointerType!=='touch')touch=false;select(e.clientX,e.clientY);},{passive:true});
 canvas.addEventListener('mouseleave',()=>{if(!touch){selected=null;box.hidden=true;}});
 function update(){const t=selected,info=terrenos.includes(t)?describe(t):null;if(!info||modoMover||window.MFAdapter?.project?.display?.cropInfo===false){box.hidden=true;return;}
  box.hidden=false;box.querySelector('strong').textContent=info.name+' · '+info.percent+'%';const bar=box.querySelector('[role=progressbar]');bar.setAttribute('aria-valuenow',String(info.percent));bar.setAttribute('aria-label',info.name);bar.firstElementChild.style.width=info.percent+'%';box.querySelector('span').textContent=info.ready?'Pronto para coletar!':'Pronto em '+format(info.remaining);
  const r=canvas.getBoundingClientRect(),a=gridToScreen(t.gx+((t.w||1)-1)/2,t.gy+((t.h||1)-1)/2),img=preload(t.imgSrc),vs=root.MFAdapter?.scaleForStructure?.(t,Number(t.visualScale)||1)??(Number(t.visualScale)||1),height=img?.naturalWidth?TILE_W*(t.w||1)*vs*img.naturalHeight/img.naturalWidth:96;
  const x=r.left+(MFViewport.width/2+offsetX+a.x*zoom)*r.width/MFViewport.width,y=r.top+(MFViewport.height/3+offsetY+(a.y+TILE_H*.9-height)*zoom)*r.height/MFViewport.height;
  const top=Math.max(r.top+8,y-box.offsetHeight-10);box.style.left=Math.max(r.left+8,Math.min(r.right-184,x-88))+'px';box.style.top=Math.min(r.bottom-box.offsetHeight-8,top)+'px';
 }
 Object.assign(root.MFGrowthInfo,{update,select});setInterval(update,200);
})(globalThis);
