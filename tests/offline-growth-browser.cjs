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
  window.testOffset=0;window.testState=null;window.testPlaying=false;window.testAttached=false;
  window.MFOnline={clockOffset:()=>window.testOffset,isVisiting:()=>false,playing:()=>window.testPlaying,bootState:()=>window.testState,changed(){},attach:api=>{window.testAPI=api;window.testAttached=true;},fail:e=>{throw e}};
  document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });
 const frame=()=>page.frames().find(f=>f.url().includes('game.html'));
 const reload=async hours=>{await page.evaluate(hours=>{window.testState={...testAPI.capture(),savedAt:Date.now()+testOffset};testOffset+=hours*3600000;window.testAttached=false;document.querySelector('iframe').src='game.html?offline='+Date.now();},hours);await page.waitForFunction(()=>window.testAttached);};
 await page.waitForFunction(()=>window.testAttached);let f=frame();
 await f.evaluate(()=>{MFCharacter.choose('menino');MFDaily.restore({claimed:6});MFTutorial.restore({done:true,step:5},false);terrenos=[];filaAcoes=[];player.path=[];moedas=10000;player.gx=2;player.gy=2;Object.assign(player,gridToScreen(2,2));const t={gx:8,gy:8,w:2,h:2,imgSrc:TERRA_ARADA_SRC,_job:{kind:'plantar',itemId:'item-cana',price:1200}};terrenos=[t];player.acaoAtual={remoto:true,tipo:'arar',job:'plantar',itemId:'item-cana',price:1200,alvo:t,state:'ararando',duration:3000,startTime:performance.now()};});
 const enclosed=await f.evaluate(()=>({gx:player.gx,gy:player.gy,x:player.x,y:player.y}));await reload(12);f=frame();await f.evaluate(expected=>{for(const k of ['gx','gy','x','y'])if(player[k]!==expected[k])throw Error('Tarefa remota teleportou personagem: '+k);if(terrenos[0].cultura?.tipo!=='cana')throw Error('Plantio remoto não concluiu');},enclosed);await reload(0);f=frame();await f.evaluate(expected=>{for(const k of ['gx','gy','x','y'])if(player[k]!==expected[k])throw Error('Posição mudou no segundo login: '+k);},enclosed);console.log('PASS: tarefa remota offline e dois logins preservam posição do personagem cercado');
 await f.evaluate(()=>{terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=10000;const t={gx:4,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos=[t];placingItem={id:'item-cana',price:1200,xp:20};plantCropAtTile(t);window.MFCancelPlacing();window.testPlantedAt=t.cultura.startTime;});
 const plantedAt=await f.evaluate(()=>terrenos[0].cultura.startTime);await reload(12);f=frame();await f.evaluate(start=>{const t=terrenos[0],info=MFGrowthInfo.describe(t);if(t.cultura.startTime!==start||t.cultura.etapa!==2||info.percent!==100||!info.ready)throw Error('Cana plantada não cresceu nas 12h fora do jogo');},plantedAt);
 console.log('PASS: cana já plantada amadurece em 12 horas offline sem reiniciar o horário');
 await page.evaluate(()=>testOffset=0);await f.evaluate(()=>{terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=10000;for(let i=0;i<3;i++){const t={gx:4+i*2,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos.push(t);MFJobs.queue(t,'plantar',{id:'item-cana',price:1200});}});
 await reload(12);f=frame();await f.evaluate(()=>{if(terrenos.length!==3||terrenos.some(t=>t.cultura?.tipo!=='cana'||MFGrowthInfo.describe(t).percent!==100))throw Error('Fila da noite só começa o plantio ao entrar de manhã');if(moedas!==6400||player.acaoAtual||filaAcoes.length)throw Error('Fila offline cobrou errado ou ficou pendente');});
 await reload(0);f=frame();await f.evaluate(()=>{if(moedas!==6400||terrenos.some(t=>t.cultura.etapa!==2))throw Error('Fila offline repetiu a compra');});
 console.log('PASS: três plantios enfileirados concluem em sequência offline, crescem pelo horário previsto e não cobram duas vezes');

 await page.evaluate(()=>{testState={...testAPI.capture(),savedAt:Date.now()-12*3600000,player:{gx:4,gy:4,path:[],action:null},actionQueue:[],terrenos:[{gx:4,gy:4,w:2,h:2,imgSrc:'assets/plantas/cana-inicio.png',cultura:{tipo:'cana',etapa:0,startTime:12345,totalTime:28800000}}]};testOffset=0;testAttached=false;document.querySelector('iframe').src='game.html?legacy='+Date.now();});await page.waitForFunction(()=>testAttached);f=frame();
 await f.evaluate(()=>{const t=terrenos[0];if(t.cultura.etapa!==2||MFGrowthInfo.describe(t).percent!==100)throw Error('Relógio legado foi reiniciado no login');});
 const legacyStart=await f.evaluate(()=>terrenos[0].cultura.startTime);await reload(0);f=frame();await f.evaluate(start=>{if(terrenos[0].cultura.startTime!==start||terrenos[0].cultura.etapa!==2)throw Error('Relógio legado reiniciou novamente');},legacyStart);
 console.log('PASS: cana de save legado usa data do último save e não reinicia na próxima entrada');
 await page.evaluate(()=>testOffset=0);
 await f.evaluate(()=>{
  terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=10000;playerXP=0;playerLevel=1;
  for(let i=0;i<3;i++){const t={gx:4+i*2,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos.push(t);MFJobs.queue(t,'plantar',{id:'item-cana',price:1200});}
  window.testHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.testHidden});document.dispatchEvent(new Event('visibilitychange'));
 });
 const paused=await page.evaluate(()=>testAPI.capture());await page.evaluate(()=>testOffset+=12*3600000);
 const later=await page.evaluate(()=>testAPI.capture());
 if(later.savedAt!==paused.savedAt||later.player.action.elapsed!==paused.player.action.elapsed)throw Error('Save em segundo plano apagou tempo da fila');
 await page.evaluate(()=>testPlaying=true);
 await f.evaluate(()=>{window.testHidden=false;document.dispatchEvent(new Event('visibilitychange'));parent.testPlaying=false;
  if(moedas!==6400||filaAcoes.length||player.acaoAtual||terrenos.some(t=>t.cultura?.etapa!==2))throw Error('Voltar à mesma aba não concluiu fila suspensa: '+JSON.stringify({moedas,queue:filaAcoes.length,action:player.acaoAtual?.state,crops:terrenos.map(t=>t.cultura)}));
  document.dispatchEvent(new Event('visibilitychange'));if(moedas!==6400)throw Error('Retorno duplicou cobrança');
  delete document.hidden;
 });
 console.log('PASS: ocultar e reabrir mesma aba conclui fila pelo tempo decorrido; saves ocultos preservam referência e não duplicam compra');
 if(errors.length)throw Error(errors.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
