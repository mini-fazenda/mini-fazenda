const {chromium,webkit,devices}=require('playwright');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit',engine=ios?webkit:chromium;
 const browser=await engine.launch({headless:true,...(!ios&&process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),...(!ios?{args:['--no-sandbox','--disable-dev-shm-usage']}:{} )});
 const page=await browser.newPage(ios?{...devices['iPhone 13'],viewport:{width:844,height:390}}:{viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
 await page.route(/gstatic\.com\/firebasejs/,r=>r.abort());
 // As plantações precisam continuar visíveis mesmo se o host externo falhar.
 await page.route('https://i.postimg.cc/**',r=>r.abort());
 await page.goto('http://localhost:8080');
 await page.evaluate(()=>{
  window.testState=null;window.testPlaying=false;window.testAttached=false;
  window.MFOnline={isVisiting:()=>false,playing:()=>window.testPlaying,bootState:()=>window.testState,changed(){},attach:api=>{window.testAPI=api;window.testAttached=true;},fail:e=>{throw e}};
  document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });
 const frame=()=>page.frames().find(f=>f.url().includes('game.html'));
 const reload=async()=>{await page.evaluate(()=>{window.testState=testAPI.capture();window.testAttached=false;document.querySelector('iframe').src='game.html?beta='+Date.now();});await page.waitForFunction(()=>window.testAttached);};
 await page.waitForFunction(()=>window.testAttached);let f=frame();
 await f.evaluate(()=>{
  terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];player.acaoAtual=null;player.path=[];filaAcoes=[];aradora.spawned=false;clearInventoryFromSave();lootParticles.length=0;moedas=1000;
  const plots=Array.from({length:4},(_,i)=>({gx:4+i*2,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC}));terrenos.push(...plots);
  for(let round=0;round<3;round++){
   for(const t of plots){t.imgSrc=TERRA_ARADA_SRC;placingItem={id:'item-cenoura',price:50,xp:1};plantCropAtTile(t);const paid=moedas;plantCropAtTile(t);if(moedas!==paid)throw Error('Cobrança duplicada');t.cultura.startTime-=600001;reapplyGrowthFromTime(t);if(!tryHarvestAtTile(t))throw Error('Cenoura madura não colheu');}
   if(window.__gameInventory.map.cenoura?.count!==20)throw Error('Colheita não entrou imediatamente no celeiro');
   document.querySelector('#mf-sales-actions button:nth-child(2)').click();
   if(moedas!==1000+(round+1)*80)throw Error('Saldo incorreto no ciclo '+round+': '+moedas);
  }
  if(moedas!==1240)throw Error('Três ciclos deveriam render 240 de lucro');
 });
 await reload();f=frame();await f.evaluate(()=>{updateLoots(3000);if(moedas!==1240||Object.keys(__gameInventory.map).length)throw Error('Animação duplicou produtos ou saldo após reload');});
 console.log('PASS: quatro cenouras x três ciclos = 240 de lucro; venda imediata e reload sem duplicar');
 await f.evaluate(()=>{
  moedas=200000;const awardXP=addXP;addXP=()=>{};
  for(const [type,economy]of Object.entries(MFFarmEconomy.crops)){
   const t={gx:2,gy:2,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos=[t];const before=moedas;
   placingItem={id:'item-'+type,price:economy.price,xp:economy.xp};plantCropAtTile(t);t.cultura.startTime-=t.cultura.totalTime+1;reapplyGrowthFromTime(t);if(!tryHarvestAtTile(t))throw Error('Colheita falhou: '+type);
   document.querySelector('#mf-sales-actions button:nth-child(2)').click();const profit=economy.saleCoins*economy.yieldCount-economy.price;
   if(profit<=0||moedas!==before+profit)throw Error('Economia divergente: '+type);
  }
  addXP=awardXP;terrenos=[];lootParticles.length=0;clearInventoryFromSave();
  for(const [i,type]of ['cenoura','trigo','arroz'].entries()){
   const e=MFFarmEconomy.crops[type],t={gx:4+i*2,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos.push(t);placingItem={id:'item-'+type,price:e.price,xp:e.xp};plantCropAtTile(t);
   t.cultura.startTime=Date.now()-(i===0?1000:i===1?t.cultura.totalTime+1000:t.cultura.totalTime*.6);(t._timers||[]).forEach(clearTimeout);
  }
 });
 await reload();f=frame();await f.evaluate(()=>{
  const expected=[0,2,1];terrenos.forEach((t,i)=>{if(t.cultura.etapa!==expected[i])throw Error('Estágio incorreto após voltar: '+t.cultura.tipo);if(t.imgSrc.startsWith('http'))throw Error('Arte externa no plantio salvo');});
 });
 for(let i=0;i<3;i++)await f.waitForFunction(index=>{const im=preload(terrenos[index].imgSrc);return im.complete&&im.naturalWidth>0;},i);
 console.log('PASS: todas as culturas lucram; cultivo salvo cresce ao sair e carrega imagens locais sem Postimg');
 await f.evaluate(()=>{
  terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=1000;
  for(const [i,type]of ['cenoura','trigo'].entries()){const t={gx:4+i*2,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos.push(t);MFJobs.queue(t,'plantar',{id:'item-'+type,price:MFFarmEconomy.crops[type].price});}
 });
 await reload();f=frame();await f.evaluate(()=>{
  if(player.acaoAtual?.job!=='plantar'||filaAcoes[0]?._job?.itemId!=='item-trigo')throw Error('Fila perdeu os tipos de semente ao sair');
  for(let i=0;i<2;i++){const a=player.acaoAtual;if(!a)throw Error('Ação perdida');player.gx=a.alvo.gx;player.gy=a.alvo.gy;player.path=[];a.state='ararando';a.startTime=performance.now()-a.duration-10;processArar();}
  if(terrenos.map(t=>t.cultura?.tipo).join(',')!=='cenoura,trigo'||moedas!==750)throw Error('Fila não retomou os dois plantios e cobranças corretas');
 });
 console.log('PASS: fila de plantio volta com semente e preço corretos');
 await f.evaluate(()=>{
  terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];player.acaoAtual=null;player.path=[];filaAcoes=[];moedas=1000;
  MFCharacter.choose('menino');MFTutorial.restore({step:5,done:true},false);MFDaily.restore({claimed:6,lastDay:'2026-10-30'});
  const xp=playerXP,path=JSON.stringify(player.path);MFBarn.select();MFBarn.rotate();
  if(placingItem.w!==6||placingItem.h!==4)throw Error('Giro da prévia incorreto');
  if(!MFBarn.place(6,6))throw Error('Não colocou o celeiro');
  const t=terrenos[0];if(moedas!==800||playerXP!==xp||player.acaoAtual||JSON.stringify(player.path)!==path)throw Error('Obra cobrou errado, prendeu o personagem ou premiou antes de concluir');
  if(t.barnReadyAt-t.barnStartedAt!==300000)throw Error('Prazo da obra incorreto');
 });
 await reload();f=frame();await f.evaluate(()=>{
  const t=terrenos[0];if(!MFBarn.is(t)||t.barnOrientation!==1||t.w!==6||t.h!==4)throw Error('Obra/giro não persistiu');
  const xp=playerXP;t.barnStartedAt-=300001;t.barnReadyAt-=300001;parent.testPlaying=true;MFBarn.tick();MFBarn.tick();parent.testPlaying=false;
  if(playerXP!==xp+5||!t.barnXPGranted)throw Error('Obra não deu exatamente 5 estrelas');
  document.querySelectorAll('#mf-char,#mf-daily').forEach(el=>{el.classList.remove('on');el.hidden=true;el.style.display='none';});
  MFTutorial.restore({step:5,done:true},false);offsetX=0;offsetY=-180;zoom=.5;requestRedraw();
 });
 await f.waitForFunction(()=>{const im=preload(terrenos[0].imgSrc);return im.complete&&im.naturalWidth>0;});
 const tap=await f.evaluate(()=>{const t=terrenos[0],p=gridToScreen(t.gx+(t.w-1)/2,t.gy+(t.h-1)/2);return {x:canvas.width/2+offsetX+p.x*zoom,y:canvas.height/3+offsetY+(p.y-80)*zoom};});
 await f.locator('#game').tap({position:tap});
 await f.waitForFunction(()=>document.getElementById('overlay-bau').style.display==='flex');
 await reload();f=frame();await f.evaluate(()=>{const xp=playerXP;parent.testPlaying=true;MFBarn.tick();parent.testPlaying=false;if(playerXP!==xp)throw Error('Estrelas da obra repetiram após reload');});
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS: celeiro 200 moedas, obra autônoma 5min, giro, save, 5 estrelas únicas e toque abre vendas ('+(ios?'WebKit/iOS':'Chromium/toque')+')');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
