const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.MF_CHROMIUM_PATH,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));await page.goto('http://localhost:8080');
 await page.evaluate(()=>{
  const saved={version:2,savedAt:Date.now(),moedas:123,playerXP:10,playerLevel:2,COLS:20,ROWS:20,terrenos:[{gx:5,gy:5,w:2,h:2,imgSrc:'assets/cultivos-novos/cenoura-inicio.png',cultura:{tipo:'cenoura',etapa:0,startTime:Date.now()-120000,totalTime:600000}}],inventory:{},tutorial:{done:true,step:5}};
  let claims=[],listener;window.MFOnline={isVisiting:()=>true,visitingUid:()=>'owner',playing:()=>false,changed:()=>{},bootState:()=>saved,attach:api=>{window.visitBridge=api;window.attached=true;},fail:e=>{throw e},clockOffset:()=>0,requestFullscreen:()=>{window.fullscreenClicked=true},friends:{watchFertilized:(_,cb)=>{listener=cb;cb(claims);return ()=>{};},fertilizeLeft:async()=>({left:5}),fertilize:async(_,plot)=>{claims.push({...plot,at:Date.now(),name:'Amigo'});listener(claims);return {left:4,at:claims[0].at};}}};
  document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });await page.waitForFunction(()=>window.attached);const f=page.frames().find(f=>f.url().includes('game.html'));
 await f.locator('#mf-visit-camera').waitFor();const initial=await f.evaluate(()=>zoom);
 await f.getByRole('button',{name:'Aproximar',exact:true}).click();assert.ok(await f.evaluate(z=>zoom>z,initial));
 await f.getByRole('button',{name:'Afastar',exact:true}).click();assert.ok(Math.abs(await f.evaluate(()=>zoom)-initial)<.001);
 await f.getByRole('button',{name:'Tela cheia',exact:true}).click();assert.equal(await page.evaluate(()=>window.fullscreenClicked),true);
 const before=await f.evaluate(()=>({n:terrenos.length,coins:moedas,x:offsetX}));
 await f.locator('#mf-visit-cover').dispatchEvent('pointerdown',{pointerId:1,clientX:200,clientY:100});
 await f.locator('#mf-visit-cover').dispatchEvent('pointermove',{pointerId:1,clientX:250,clientY:100});
 await f.locator('#mf-visit-cover').dispatchEvent('pointerup',{pointerId:1,clientX:250,clientY:100});
 assert.ok(await f.evaluate(x=>offsetX!==x,before.x));
 await f.evaluate(async()=>{const t=terrenos[0],p=gridToScreen(t.gx+.5,t.gy+.5),r=canvas.getBoundingClientRect();await MFVisit.tap(r.left+MFViewport.width/2+offsetX+p.x*zoom,r.top+MFViewport.height/3+offsetY+p.y*zoom);});
 await f.waitForFunction(()=>document.querySelectorAll('.mf-fertilized-stars').length===1);
 const state=await page.evaluate(()=>visitBridge.capture());assert.equal(state.terrenos[0].cultura.fertilizada,true);assert.equal(state.terrenos[0].cultura.fertilizedDuration,390000);
 await f.evaluate(()=>{const snap=getTerrenosSnapshot();restoreTerrenosFromSnapshot(snap);Object.assign(terrenos[0].cultura,snap[0].cultura);reapplyGrowthFromTime(terrenos[0]);});
 assert.equal(await f.evaluate(()=>terrenos[0].cultura.totalTime),390000);assert.equal(await f.evaluate(()=>moedas),before.coins);assert.equal(await f.evaluate(()=>terrenos.length),before.n);
 assert.deepEqual(errors,[]);console.log('PASS: visita permite zoom, câmera e tela cheia; estrelas e duração persistem sem alterar moedas/objetos');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
