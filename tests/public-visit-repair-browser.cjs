const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const mock=require('./firebase-mock.cjs');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit';
 const browser=await (ios?webkit:chromium).launch({headless:true,...(!ios?{args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:ios,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   if(window!==window.top)return;
   if(sessionStorage.getItem('mf-public-repair-test-initialized'))return;
   sessionStorage.setItem('mf-public-repair-test-initialized','1');
   const old={version:2,moedas:1200,playerXP:35,playerLevel:2,COLS:24,ROWS:24,
    farmName:'Confirmada',savedAt:Date.now()-60000,
    terrenos:[],inventory:{},player:{gx:5,gy:5,path:[]},aradora:{gx:3,gy:3,path:[],fila:[]}};
   const pending={...old,farmName:'Pendente',terrenos:[{gx:4,gy:4,w:2,h:2,imgSrc:'assets/terra-arada.png'}]};
   localStorage.setItem('test-user','yes');
   localStorage.setItem('test-cloud',JSON.stringify({
    'farms/rodrigo':{state:old,revision:5,saveId:'confirmado-5',sessionId:'sessao-anterior',updatedAt:Date.now()-5000},
    'publicFarms/rodrigo':{state:{...old,farmName:'MuitoAntiga'},revision:5,updatedAt:Date.now()-60000}
   }));
   localStorage.setItem('mf-pending-v3:rodrigo',JSON.stringify({
    state:pending,revision:5,baseSaveId:'confirmado-5',sessionId:'sessao-anterior',
    pendingId:'recuperacao-local',at:Date.now()
   }));
   window.testHoldSaves=true;
  });
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};"}));
  await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));
  await page.route('https://i.postimg.cc/**',r=>r.abort());
  await page.goto('http://localhost:8080');
  await page.waitForFunction(()=>MFOnline?.playing()&&testSaveWaiters.length>0);
  const frame=page.frames().find(f=>f.url().includes('game.html'));
  assert.ok(frame,'Jogo não abriu conta antiga com recuperação local');
  assert.equal(await frame.evaluate(()=>window.__farmName),'Pendente','A recuperação deve permanecer disponível para o dono');
  await page.waitForFunction(()=>testCloud['publicFarms/rodrigo']?.saveId==='confirmado-5');
  const check=await page.evaluate(()=>({
   owner:testCloud['farms/rodrigo'],public:testCloud['publicFarms/rodrigo'],
   projected:testProjectionLog||[],held:testSaveWaiters.length
  }));
  assert.equal(check.owner.state.farmName,'Confirmada','Save privado não confirmado deve ficar intacto');
  assert.equal(check.public.state.farmName,'Confirmada','Visita deve refletir exclusivamente o save confirmado');
  assert.equal(check.public.state.terrenos.length,0,'Canteiros locais ainda não salvos NÃO devem aparecer em visitas');
  assert.equal(check.public.saveId,check.owner.saveId);
  assert.ok(check.projected.length>0,'Corrigiu projeção antiga com a mesma revisão');
  assert.ok(check.projected.every(p=>p.state.farmName==='Confirmada'),'Nunca publicar recuperação antes de confirmar Firebase');
  assert.ok(check.held>0);
  await page.evaluate(()=>{testHoldSaves=false;testReleaseSave()});
  await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.farmName==='Pendente'&&
    testCloud['publicFarms/rodrigo']?.state.farmName==='Pendente'&&
    testCloud['publicFarms/rodrigo']?.revision===testCloud['farms/rodrigo'].revision&&
    testCloud['publicFarms/rodrigo']?.saveId===testCloud['farms/rodrigo'].saveId);
  const saved=await page.evaluate(()=>testCloud['farms/rodrigo']);
  assert.equal(saved.state.terrenos.length,1,'Recuperação confirmada preservou plantação');
  // Simula cópia visitável de outra versão, mesmo revision: login seguinte deve reparar.
  await page.evaluate(()=>{
   const privateDoc=testCloud['farms/rodrigo'];
   testCloud['publicFarms/rodrigo']={
    ...testCloud['publicFarms/rodrigo'],revision:privateDoc.revision,
    saveId:'outro-save-antigo',state:{...testCloud['publicFarms/rodrigo'].state,farmName:'Defasada'},updatedAt:Date.now()-60000
   };
   localStorage.setItem('test-cloud',JSON.stringify(testCloud));
  });
  await page.reload();
  await page.waitForFunction(()=>MFOnline?.playing()&&testCloud['publicFarms/rodrigo']?.state.farmName==='Pendente'&&
    testCloud['publicFarms/rodrigo']?.saveId===testCloud['farms/rodrigo'].saveId);
  const repaired=await page.evaluate(()=>({
   privateDoc:testCloud['farms/rodrigo'],publicDoc:testCloud['publicFarms/rodrigo']
  }));
  assert.equal(repaired.publicDoc.state.terrenos.length,1);
  assert.equal(repaired.publicDoc.revision,repaired.privateDoc.revision);
  assert.deepEqual(errors,[]);
  console.log('PASS: conta antiga recuperada não publica progresso local não confirmado; visita antiga é corrigida por saveId; save e cena públicos sincronizam após confirmação e novo login.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
