const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');const mock=require('./firebase-mock.cjs');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit',browser=await(ios?webkit:chromium).launch({headless:true,...(!ios?{args:['--no-sandbox']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};"}));
  await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));await page.route('https://i.postimg.cc/**',r=>r.abort());
  await page.goto('http://localhost:8080');await page.locator('#login:not([disabled])').click();await page.waitForFunction(()=>MFOnline.playing()&&testCloud['farms/rodrigo']);
  await page.waitForFunction(()=>testCloud['publicFarms/rodrigo']?.revision===testCloud['farms/rodrigo'].revision);
  await page.evaluate(()=>{
   const state={...testCloud['publicFarms/rodrigo'].state,farmName:'Vizinha',character:'menino',savedAt:Date.now(),terrenos:[{gx:4,gy:4,w:2,h:2,imgSrc:'assets/cultivos-novos/cenoura-final.png',cultura:{tipo:'cenoura',etapa:2,startTime:Date.now(),totalTime:600000}}]};
   testCloud['publicFarms/neighbor']={state,revision:1,updatedAt:Date.now()};
   window.testPublishNeighbor=(state,revision)=>{testCloud['publicFarms/neighbor']={state,revision,updatedAt:Date.now()};for(const s of testSubs.filter(s=>s.p==='publicFarms/neighbor'))s.cb({val:()=>structuredClone(testCloud['publicFarms/neighbor'])});};
  });
  await page.evaluate(()=>MFOnline.friends.visit('neighbor'));await page.waitForFunction(()=>MFOnline.isVisiting()&&document.getElementById('gate').hidden);
  const frame=page.frames().find(f=>f.url().includes('game.html'));const own=await page.evaluate(()=>JSON.stringify(testCloud['farms/rodrigo']));
  await frame.evaluate(()=>{if(terrenos[0].cultura.etapa!==0)throw Error('Visitante mostrou pronta uma plantação recém-plantada');offsetX=123;offsetY=-77;zoom=.6;});
  const url=frame.url();
  await page.evaluate(()=>{
   const state=structuredClone(testCloud['publicFarms/neighbor'].state);state.character='menina';state.terrenos.push({gx:6,gy:4,w:2,h:2,imgSrc:'assets/9883700369e3dd55833c-melancia-inicio.png',cultura:{tipo:'melancia',etapa:0,startTime:Date.now(),totalTime:14400000}});testPublishNeighbor(state,2);
  });
  await frame.waitForFunction(()=>terrenos.length===2&&__mfCharacter==='menina');
  await frame.evaluate(()=>{if(offsetX!==123||offsetY!==-77||zoom!==.6)throw Error('Atualização ao vivo mudou a câmera');});assert.equal(frame.url(),url);
  await page.evaluate(()=>{
   const current=structuredClone(testCloud['publicFarms/neighbor'].state),stale={...current,terrenos:[]};testPublishNeighbor(stale,1);testPublishNeighbor(current,2);
   current.terrenos[0].cultura.startTime=Date.now()-599000;current.savedAt=Date.now();testPublishNeighbor(current,3);
  });
  await frame.waitForFunction(()=>terrenos[0].cultura.etapa===2,null,{timeout:7000});
  assert.equal(await frame.evaluate(()=>terrenos.length),2);assert.equal(await page.evaluate(()=>JSON.stringify(testCloud['farms/rodrigo'])),own);
  // Correção do mesmo revision: mesmo timestamp, mas saveId confirmado diferente.
  await page.evaluate(()=>{
   const doc=testCloud['publicFarms/neighbor'];
   const corrected={...doc,saveId:'vizinha-confirmado-3',state:{...doc.state,farmName:'Atualizada'}};
   testCloud['publicFarms/neighbor']=corrected;
   for(const sub of testSubs.filter(s=>s.p==='publicFarms/neighbor'))sub.cb({val:()=>structuredClone(corrected)});
  });
  await frame.waitForFunction(()=>window.__farmName==='Atualizada');
  await page.evaluate(()=>{
   const doc=testCloud['publicFarms/neighbor'];
   const obsolete={...doc,saveId:'save-antigo',updatedAt:doc.updatedAt-10000,state:{...doc.state,farmName:'Obsoleta'}};
   for(const sub of testSubs.filter(s=>s.p==='publicFarms/neighbor'))sub.cb({val:()=>structuredClone(obsolete)});
  });
  assert.equal(await frame.evaluate(()=>window.__farmName),'Atualizada','Evento da mesma revisão com timestamp mais antigo não pode regredir a visita');
  await page.locator('#home').click();await page.waitForFunction(()=>MFOnline.playing());
  assert.equal(await page.evaluate(()=>testSubs.filter(s=>s.p==='publicFarms/neighbor').length),0);assert.deepEqual(errors,[]);
  console.log('PASS: save/visita atômicos, listener ao vivo sem recarga, relógio correto, câmera preservada, revisão antiga ignorada e conta do visitante intacta.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
