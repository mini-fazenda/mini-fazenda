const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
 await page.goto('http://localhost:8080');
 await page.evaluate(()=>{
  window.saved=null;window.visiting=false;
  window.MFOnline={isVisiting:()=>visiting,playing:()=>!visiting,bootState:()=>saved,changed:()=>{},attach:api=>window.testAPI=api,fail:e=>{throw e}};
  document.getElementById('gate').hidden=true;
  const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });
 await page.waitForFunction(()=>window.testAPI);let frame=page.frames().find(f=>/game.html/.test(f.url()));
 const result=await frame.evaluate(()=>{
  const before=parent.testAPI.capture();
  MFDev.apply({type:'moedas',amount:500,from:'Dev'},'gift');MFDev.apply({type:'moedas',amount:500,from:'Dev'},'gift');
  MFDev.apply({type:'xp',amount:500,from:'Dev'},'xp');MFDev.apply({type:'fertilizar_infinito',from:'Dev'},'inf');
  const after=parent.testAPI.capture();parent.saved=after;
  return {before:before.moedas,after:after.moedas,devTools:after.devTools,level:after.playerLevel};
 });
 assert.equal(result.after,result.before+500);assert.equal(result.devTools.receipts.gift,true);assert.equal(result.devTools.infinite,true);assert.ok(result.level>1);
 await page.evaluate(()=>{testAPI=null;document.querySelector('iframe').src='game.html?reload=1'});await page.waitForFunction(()=>window.testAPI);
 frame=page.frames().find(f=>/game.html/.test(f.url()));
 assert.equal(await frame.evaluate(()=>{const before=parent.testAPI.capture().moedas;MFDev.apply({type:'moedas',amount:500,from:'Dev'},'gift');return parent.testAPI.capture().moedas-before}),0);
 assert.equal(await frame.evaluate(()=>MFDev.infinite()),true);
 await page.evaluate(async()=>{const {startConsole}=await import('./dev-tools.js');startConsole({user:{email:'other@gmail.com',emailVerified:true}})});
 assert.equal(await page.locator('#mf-dev-btn').count(),0);
 await page.evaluate(async()=>{const {startConsole}=await import('./dev-tools.js');startConsole({user:{email:'bielz09.lulu@gmail.com',emailVerified:true}})});
 assert.equal(await page.locator('#mf-dev-btn').count(),1);
 await frame.locator('body').click({position:{x:5,y:5}});await page.keyboard.press('F2');assert.equal(await page.locator('#mf-dev').isVisible(),true);
 await page.locator('#mf-dev input').fill('/ajuda');await page.locator('#mf-dev input').press('Enter');assert.match(await page.locator('#mf-dev .out').innerText(),/moedas/);
 assert.deepEqual(errors,[]);console.log('PASS: engine captura/restaura recibos e infinito; moedas não duplicam; XP sobe níveis; console só para dev e abre pelo iframe.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
