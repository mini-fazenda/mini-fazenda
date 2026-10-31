const {chromium}=require('playwright'),assert=require('node:assert/strict'),mock=require('./firebase-mock.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('test-user','yes')});
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};"}));
 await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 await page.goto('http://localhost:8080');await page.waitForFunction(()=>window.MFOnline?.playing());
 let f=page.frames().find(f=>/game.html/.test(f.url()));await f.evaluate(()=>window.MFCharacter.choose('menino'));
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state?.devTools);
 const before=await page.evaluate(()=>testCloud['farms/rodrigo'].state.moedas);
 await page.evaluate(async()=>{
  testHoldSaves=true;
  const sdk=await import('https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js');
  await sdk.set(sdk.ref(null,'adminInbox/rodrigo'),{gift:{type:'moedas',amount:123,from:'Recanto'}});
 });
 await f.waitForFunction(()=>MFDev.capture().receipts.gift===true);
 assert.equal(await page.evaluate(()=>!!testCloud['adminInbox/rodrigo'].gift),true,'preserva inbox enquanto save não confirmou');
 await page.evaluate(()=>{testHoldSaves=false;testReleaseSave()});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.devTools.receipts.gift===true&&!testCloud['adminInbox/rodrigo'].gift);
 assert.equal(await page.evaluate(()=>testCloud['farms/rodrigo'].state.moedas),before+123);
 assert.match(await f.locator('#mf-dev-notes').innerText(),/Recanto te deu 123 moedas/);
 // Recria uma entrega cujo save confirmou, mas cuja remoção se perdeu: não duplica.
 await page.evaluate(()=>{testCloud['adminInbox/rodrigo']={gift:{type:'moedas',amount:123,from:'Recanto'}};localStorage.setItem('test-cloud',JSON.stringify(testCloud))});
 await page.reload();await page.waitForFunction(()=>window.MFOnline?.playing()&&!testCloud['adminInbox/rodrigo'].gift);
 assert.equal(await page.evaluate(()=>testCloud['farms/rodrigo'].state.moedas),before+123);
 assert.equal(await page.locator('#mf-dev-btn').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: entrega pelo host confirma save antes de remover inbox, avisa com nome/quantidade e não duplica após reload; conta comum sem console.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
