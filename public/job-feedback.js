/* Ferramenta e progresso pertencem à tarefa, não ao hover do mouse. */
(()=>{
 const box=document.createElement('div');box.id='mf-job-feedback';box.hidden=true;box.innerHTML='<div class="mf-job-tool"><img alt=""></div><div class="mf-job-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span></span></div>';document.body.append(box);
 const image=box.querySelector('img'),bar=box.querySelector('[role=progressbar]'),fill=bar.firstElementChild;
 const style=document.createElement('style');style.textContent=`
 #mf-job-feedback[hidden]{display:none!important}#mf-job-feedback{position:fixed;z-index:7;pointer-events:none;transform:translate(-50%,-100%);width:84px;text-align:center;font:12px Arial;color:white;text-shadow:0 1px 2px #252e16}
 #mf-job-feedback .mf-job-tool{height:43px;display:flex;justify-content:center;align-items:center}#mf-job-feedback img{max-width:32px;max-height:40px;object-fit:contain;transform-origin:60% 85%;filter:drop-shadow(0 1px 1px #14220888)}
 #mf-job-feedback.working img{animation:mf-job-swing .55s ease-in-out infinite alternate}
 #mf-job-feedback .mf-job-progress{height:9px;background:#44351f;border:2px solid #fff3c4;border-radius:5px;overflow:hidden;box-shadow:0 1px 3px #0008}#mf-job-feedback .mf-job-progress span{display:block;height:100%;background:linear-gradient(#a4e85a,#60b330);width:0}
 @keyframes mf-job-swing{from{transform:rotate(-18deg) translateY(-2px)}to{transform:rotate(16deg) translateY(2px)}}
 @media(prefers-reduced-motion:reduce){#mf-job-feedback.working img{animation:none}}
 `;document.head.append(style);
 const names={arar:'Arando',colher:'Colhendo',tree:'Colhendo',plantar:'Plantando',animal:'Coletando'},icons={};
 function tool(a){if(a.job==='plantar'){const entry=window.MFAdapter?.project?.items?.[a.itemId];return entry?.lootIcon||entry?.icon||document.getElementById(a.itemId)?.querySelector('img')?.src||PA_SRC;}
  if(a.job==='animal'){const kind=window.MFAnimalProduction?.sync(a.alvo?.animal)?.tool;if(kind&&window.MFAnimalTools){if(!icons[kind]){const c=document.createElement('canvas');c.width=c.height=48;window.MFAnimalTools.draw(c.getContext('2d'),kind,24,24);icons[kind]=c.toDataURL();}return icons[kind];}}
  return a.job==='colher'||a.job==='tree'?FOICE_SRC:PA_SRC;
 }
 function update(){
  const a=player.acaoAtual,t=a?.alvo;if(!t||!terrenos.includes(t)||window.MFHost?.isVisiting?.()){box.hidden=true;return;}
  const r=canvas.getBoundingClientRect(),p=gridToScreen(t.gx+((t.w||1)-1)/2,t.gy+((t.h||1)-1)/2);
  const x=r.left+(MFViewport.width/2+offsetX+p.x*zoom)*r.width/MFViewport.width,y=r.top+(MFViewport.height/3+offsetY+p.y*zoom)*r.height/MFViewport.height-16;
  if(x<r.left||x>r.right||y<r.top+25||y>r.bottom){box.hidden=true;return;}
  box.hidden=false;box.style.left=x+'px';box.style.top=y+'px';const working=a.state==='ararando';box.classList.toggle('working',working);
  const src=tool(a);if(image.getAttribute('src')!==src)image.setAttribute('src',src);
  const progress=working?Math.min(1,Math.max(0,Number(a.progress)||0)):0,value=Math.round(progress*100);fill.style.width=value+'%';bar.setAttribute('aria-valuenow',String(value));bar.setAttribute('aria-label',names[a.job]||'Arando');
 }
 window.MFJobFeedback={update};let last=0;function tick(now){if(now-last>=32){last=now;update();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
})();
