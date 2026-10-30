const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit';
 const browser=await (ios?webkit:chromium).launch({headless:true,...(!ios&&process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),...(!ios?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
  await page.goto('http://localhost:8080');
  await page.evaluate(()=>{
   window.testAttached=false;window.MFOnline={isVisiting:()=>false,playing:()=>false,bootState:()=>null,changed(){},attach:a=>{window.testAPI=a;window.testAttached=true;},fail:e=>{throw e;}};
   document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
  });
  await page.waitForFunction(()=>window.testAttached);const f=page.frames().find(f=>f.url().includes('game.html'));
  await f.evaluate(()=>{
   MFTutorial.restore({step:5,done:true},false);document.querySelectorAll('#mf-char,#mf-daily').forEach(el=>{el.classList.remove('on');el.hidden=true;el.style.display='none';});
   terrenos=[];filaAcoes=[];player.path=[];player.acaoAtual=null;offsetX=0;offsetY=-35;zoom=.6;
   terrenos.push({gx:5,gy:5,w:2,h:2,imgSrc:TERRA_ARADA_SRC,cultura:{tipo:'cenoura',startTime:Date.now()-300000,totalTime:600000,etapa:0}});
   reapplyGrowthFromTime(terrenos[0]);draw();
  });
  await f.evaluate(()=>{
   const before=JSON.stringify(getTerrenosSnapshot()),original=MFPlotGround.drawJoins;
   try{delete MFPlotGround.drawJoins;draw();if(JSON.stringify(getTerrenosSnapshot())!==before)throw Error('Save alterado');}
   finally{MFPlotGround.drawJoins=original;}
  });
  console.log('PASS: módulo antigo em cache não interrompe desenho nem altera plantações');
  await f.evaluate(()=>preload(MFAdapter.project.items['item-espinafre'].stage0));
  await f.waitForFunction(()=>{const i=preload(MFAdapter.project.items['item-espinafre'].stage0);return i.complete&&i.naturalWidth>0;});
  await f.evaluate(()=>{
   const img=preload(MFAdapter.project.items['item-espinafre'].stage0),surface=document.createElement('canvas');surface.width=800;surface.height=500;const g=surface.getContext('2d');g.fillStyle='#00ff00';g.fillRect(0,0,800,500);g.translate(400,100);
   for(const gx of [0,3]){const t={gx,gy:0,w:2,h:2};if(!MFCropSprites.drawSprite(g,t,gridToScreen(gx+.5,.5),img))throw Error('Arte nova sem encaixe');}
   for(const gy of [0,.5,1]){const p=gridToScreen(2,gy),pixel=g.getImageData(Math.round(400+p.x),Math.round(100+p.y),1,1).data;if(pixel[0]>pixel[1]*1.18&&pixel[1]>pixel[2]*1.25)throw Error('Terra invadiu corredor');}
  });
  console.log('PASS: duas plantações renderizadas preservam o corredor de um quadrado');
  const size=await f.evaluate(()=>({dpr:devicePixelRatio,width:MFViewport.width,height:MFViewport.height,ratio:MFViewport.ratio,buffer:[canvas.width,canvas.height],cache:[MFAdapter.cache.canvas.width,MFAdapter.cache.canvas.height],css:[canvas.getBoundingClientRect().width,canvas.getBoundingClientRect().height],transform:ctx.getTransform().a}));
  assert.equal(size.dpr,3);assert.equal(size.ratio,2);assert.deepEqual(size.buffer,[1688,780]);assert.deepEqual(size.cache,size.buffer);assert.deepEqual(size.css,[844,390]);assert.equal(size.transform,2);
  // A posição do mouse está em pixels CSS, inclusive nas camadas desenhadas por último.
  await f.locator('#game').hover({position:{x:300,y:200}});
  await f.evaluate(()=>{
   const originalTool=MFAnimalTools.draw,originalImage=ctx.drawImage;
   const saved={...lastMouse},savedTractor=modoTrator;
   try{
    modoTrator=false;
    const seen=[];
    MFAnimalTools.draw=(g,kind,x,y)=>{const p=g.getTransform().transformPoint({x,y});seen.push({kind,x:p.x,y:p.y});};
    for(const kind of ['bucket','shears']){lastMouse.animalTool=kind;originalDrawCursorOverlay();}
    for(const p of seen)if(Math.abs(p.x-600)>.01||Math.abs(p.y-400)>.01)throw Error('Ferramenta afastada do mouse em DPR alto: '+JSON.stringify(p));
    if(seen.length!==2)throw Error('Cursor não foi desenhado');
    let particle;
    ctx.drawImage=function(img,x,y,w,h){const p=this.getTransform().transformPoint({x:x+w/2,y:y+h/2});particle=p;};
    lootParticles.push({screenX:350,screenY:210,time:0,duration:1000,img:{complete:true}});drawLoots();lootParticles.pop();
    if(!particle||particle.x!==700||particle.y!==420)throw Error('Drop fora da posição em DPR alto');
    if(ctx.getTransform().a!==MFViewport.ratio)throw Error('Camada não restaurou transformação');
   }finally{MFAnimalTools.draw=originalTool;ctx.drawImage=originalImage;Object.assign(lastMouse,saved);modoTrator=savedTractor;}
  });
  console.log('PASS: mouse real em 300×200 mantém balde/tesoura em 600×400 físicos; drops seguem escala 2x');
  await f.waitForFunction(()=>preload(terrenos[0].imgSrc)?.naturalWidth>0);
  const pos=await f.evaluate(()=>{const t=terrenos[0],p=gridToScreen(t.gx+.5,t.gy+.5);return {x:MFViewport.width/2+offsetX+p.x*zoom,y:MFViewport.height/3+offsetY+(p.y-25)*zoom};});
  await f.locator('#game').tap({position:pos});await f.waitForFunction(()=>!document.getElementById('mf-growth-info').hidden);
  await f.evaluate(()=>{
   const el=document.getElementById('mf-growth-info'),n=Number(el.querySelector('[role=progressbar]').getAttribute('aria-valuenow'));if(n<49||n>51)throw Error('Toque fora da plantação');
   MFAdapter.spritePlace('qa-hidpi','assets/produtos/cenoura.png',20,40,50,60);
   const img=[...document.querySelectorAll('#mf-animated-layer img')].find(i=>i.src.endsWith('produtos/cenoura.png'));
   if(Math.abs(parseFloat(img.style.left)-(MFViewport.width/2+offsetX+(20-25)*zoom))>.01)throw Error('Sprite DOM desalinhado');
  });
  await page.setViewportSize({width:390,height:844});
  await f.waitForFunction(()=>MFViewport.width===390&&canvas.width===780&&MFAdapter.cache.canvas.width===780);
  await f.evaluate(()=>{draw();if(canvas.height!==1688||MFAdapter.cache.canvas.height!==1688)throw Error('Rotação perdeu resolução');});
  await page.setViewportSize({width:844,height:390});
  await f.waitForFunction(()=>MFViewport.width===844&&canvas.width===1688);
  assert.deepEqual(errors,[]);console.log('PASS: DPR 3 usa buffers 2x; cache, toque em cultura, sprite DOM e rotação alinhados');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
