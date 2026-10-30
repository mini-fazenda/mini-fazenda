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
  const size=await f.evaluate(()=>({dpr:devicePixelRatio,width:MFViewport.width,height:MFViewport.height,ratio:MFViewport.ratio,buffer:[canvas.width,canvas.height],cache:[MFAdapter.cache.canvas.width,MFAdapter.cache.canvas.height],css:[canvas.getBoundingClientRect().width,canvas.getBoundingClientRect().height],transform:ctx.getTransform().a}));
  assert.equal(size.dpr,3);assert.equal(size.ratio,2);assert.deepEqual(size.buffer,[1688,780]);assert.deepEqual(size.cache,size.buffer);assert.deepEqual(size.css,[844,390]);assert.equal(size.transform,2);
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
