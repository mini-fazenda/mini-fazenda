const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit',engine=ios?webkit:chromium;
 const browser=await engine.launch({headless:true,
  ...(!ios&&process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),
  ...(!ios?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:ios,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
  await page.route(/gstatic\.com\/firebasejs/,r=>r.abort());
  await page.goto('http://localhost:8080');
  await page.evaluate(()=>{
   window.testAttached=false;
   window.MFOnline={isVisiting:()=>false,playing:()=>false,bootState:()=>null,
    changed(){},attach:()=>{window.testAttached=true},fail:e=>{throw e}};
   document.getElementById('gate').hidden=true;
   const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
  });
  await page.waitForFunction(()=>window.testAttached);
  const f=page.frames().find(x=>x.url().includes('game.html'));
  assert.ok(f,'iframe do jogo não carregado');
  const camera=await f.evaluate(()=>{
   MFTutorial?.restore?.({done:true,step:5},false);
   terrenos=[];COLS=40;ROWS=40;offsetX=0;offsetY=0;zoom=.6;
   MFAdapter.project.camera.inertiaEnabled=false;
   const c=document.getElementById('game');
   const world=(x,y)=>({x:(x-MFViewport.width/2-offsetX)/zoom,
    y:(y-MFViewport.height/3-offsetY)/zoom});
   // Uma única fonte para mouse: 100 px arrastados devem mover 100 px no mapa.
   c.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0,clientX:300,clientY:180}));
   const samples=[];
   for(let x=310;x<=400;x+=10){
    window.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:x,clientY:180}));
    samples.push(offsetX);
   }
   window.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:400,clientY:180}));
   if(samples.some((v,i)=>i&&v<samples[i-1]-0.5))throw Error('Arrasto voltou para trás: '+samples);
   if(Math.abs(samples.at(-1)-100)>2)throw Error('Arrasto duplicado ou desalinhado: '+samples);
   // Zoom do mouse mantém o ponto do mundo sob o cursor.
   const beforeWheel=world(420,180),z0=zoom;
   c.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-170,clientX:420,clientY:180}));
   const afterWheel=world(420,180);
   if(zoom<=z0||Math.hypot(beforeWheel.x-afterWheel.x,beforeWheel.y-afterWheel.y)>0.1)
    throw Error('Zoom do mouse perdeu o foco no ponteiro');
   const point=(id,x,y)=>({identifier:id,target:c,clientX:x,clientY:y});
   const touch=(type,points)=>{
    const ev=new Event(type,{bubbles:true,cancelable:true});
    Object.defineProperty(ev,'touches',{value:points});
    Object.defineProperty(ev,'changedTouches',{value:points});
    c.dispatchEvent(ev);
   };
   const beforeTouch=world(420,180),z1=zoom;
   touch('touchstart',[point(1,370,180),point(2,470,180)]);
   touch('touchmove',[point(1,350,180),point(2,490,180)]);
   const afterTouch=world(420,180);
   touch('touchend',[]);
   if(zoom<=z1||Math.hypot(beforeTouch.x-afterTouch.x,beforeTouch.y-afterTouch.y)>0.1)
    throw Error('Pinça deslocou o ponto entre os dedos: '+JSON.stringify({beforeTouch,afterTouch,z1,zoom}));
   // A inércia é padrão para saves antigos sem a opção no JSON.
   delete MFAdapter.project.camera.inertiaEnabled;
   MFAdapter.cancelGlide();
   offsetX=0;offsetY=0;zoom=.6;
   c.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0,clientX:260,clientY:150}));
   window.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:300,clientY:150}));
   window.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:300,clientY:150}));
   const afterRelease=offsetX;
   MFAdapter.cancelGlide();
   // A opção explícita de desativar inércia continua respeitada.
   MFAdapter.project.camera.inertiaEnabled=false;
   MFAdapter.inertia(15,0);
   const noGlide=offsetX;
   if(afterRelease<39||noGlide!==afterRelease)throw Error('Arrasto de teste não atualizou câmera');
   MFAdapter.project.camera.inertiaEnabled=true;
   const first=MFAdapter.cache.groundGridPath();
   for(let i=0;i<8;i++){offsetX+=3;offsetY+=2;draw();
    if(MFAdapter.cache.groundGridPath()!==first)throw Error('Reconstruiu toda a malha do chão em cada movimento');}
   COLS=42;
   if(MFAdapter.cache.groundGridPath()===first)throw Error('Expandir a fazenda não invalidou a malha');
   // Arrastar vários quadros não deve redesenhar grama, montanhas, rio ou a borda.
   // A camada estática é reposicionada com uma margem de segurança.
   const cache=MFAdapter.cache;
   cache.sig='';draw();
   const staticBuilds=cache.rebuilds,blitsBefore=cache.blits;
   for(let i=0;i<12;i++){offsetX+=4;offsetY+=2;draw();}
   if(cache.rebuilds!==staticBuilds)
    throw Error('Cenário fixo foi rasterizado durante todo o arrasto: '+(cache.rebuilds-staticBuilds));
   if(cache.blits<blitsBefore+12)throw Error('Cache não foi reutilizado');
   const beforeZoomRebuild=cache.rebuilds;
   zoom*=1.04;draw();
   if(cache.rebuilds!==beforeZoomRebuild)
    throw Error('Zoom pequeno reconstruiu cenário estático indevidamente');
   cache.lastMovedAt-=1000;
   draw();
   if(cache.rebuilds!==beforeZoomRebuild+1)
    throw Error('Cenário não refinou depois que a câmera ficou parada');
   if(cache.canvas.width!==canvas.width||cache.canvas.height!==canvas.height)
    throw Error('Cache perdeu resolução High-DPI compatível com o canvas');
   cache.sig='';draw();
   if(cache.rebuilds!==beforeZoomRebuild+2)
    throw Error('Atualização do cenário não invalidou o cache estático');
   return {drag:samples.at(-1),mouseZoom:z0,afterZoom:z1,pinchZoom:zoom,
    gridCached:true,staticBuildsDuringPan:0,framesReused:cache.blits-blitsBefore};
  });
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: mouse e pinça têm foco estável, arrasto não duplica, malha do chão é reutilizada',camera);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
