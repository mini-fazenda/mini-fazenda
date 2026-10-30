const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');const ios=process.env.MF_BROWSER==='webkit';
(async()=>{const browser=await (ios?webkit:chromium).launch({headless:true,...(!ios&&process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),...(!ios?{args:['--no-sandbox']}: {})});try{
 const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));await page.goto('http://localhost:8080');
 await page.evaluate(()=>{window.testPlaying=false;window.testState=null;window.testAttached=false;window.MFOnline={isVisiting:()=>false,playing:()=>testPlaying,bootState:()=>testState,changed(){},attach:a=>{window.testAPI=a;testAttached=true},fail:e=>{throw e}};document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);});
 await page.waitForFunction(()=>testAttached);let f=page.frames().find(f=>f.url().includes('game.html'));
 await f.waitForFunction(()=>window.MFCharacter);await f.evaluate(()=>{MFCharacter.choose('menino');MFTutorial.restore({done:true,step:5},false);MFDaily.restore({claimed:6});MFLevelRewards.restore(null,1);moedas=1000;playerLevel=1;playerXP=99;addXP(1);});
 const original=await f.evaluate(()=>({level:playerLevel,coins:moedas,rewards:MFLevelRewards.capture()}));assert.equal(original.level,2);assert.equal(original.coins,1000);assert.equal(original.rewards.pending[0].options.length,2);
 await page.evaluate(()=>{testState=testAPI.capture();testAttached=false;document.querySelector('iframe').src='game.html?level-reload=1';});await page.waitForFunction(()=>testAttached);f=page.frames().find(f=>f.url().includes('game.html'));assert.deepEqual(await f.evaluate(()=>MFLevelRewards.capture()),original.rewards);
 await page.evaluate(()=>testPlaying=true);await f.evaluate(()=>MFLevelRewards.open());await f.locator('#mf-level:not([hidden])').waitFor();assert.equal(await f.locator('#mf-level .ml-card').count(),2);assert.ok(!(await f.locator('#mf-level').textContent()).includes('%'));
 await f.waitForFunction(()=>[...document.querySelectorAll('#mf-level img')].every(i=>i.complete&&i.naturalWidth>0));
 const layout=await f.evaluate(()=>{const r=document.querySelector('#mf-level .ml-panel').getBoundingClientRect(),b=document.querySelector('.ml-claim').getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom,buttonBottom:b.bottom,width:innerWidth,height:innerHeight};});assert.ok(layout.left>=0&&layout.right<=layout.width&&layout.bottom<=layout.height&&layout.buttonBottom<=layout.height);
 await f.locator('.ml-card').first().tap();if(process.env.MF_LEVEL_SCREENSHOT)await page.screenshot({path:process.env.MF_LEVEL_SCREENSHOT});const choice=original.rewards.pending[0].options[0];await f.locator('.ml-claim').tap();assert.equal(await f.evaluate(()=>moedas),1100+(choice.kind==='coins'?choice.qty:0));assert.equal((await f.evaluate(()=>MFLevelRewards.capture())).pending.length,0);
 await page.evaluate(()=>{testState=testAPI.capture();testAttached=false;document.querySelector('iframe').src='game.html?level-reload=2';});await page.waitForFunction(()=>testAttached);f=page.frames().find(f=>f.url().includes('game.html'));assert.equal((await f.evaluate(()=>MFLevelRewards.capture())).pending.length,0);
 await f.evaluate(async()=>{
  for(const [i,r]of MFLevelRewardCore.pool.entries()){
   clearInventoryFromSave();MFObjects.restore([]);MFFences.restore({});const coins=moedas,other=MFLevelRewardCore.pool.find(x=>x.id!==r.id),level=10+i;
   MFLevelRewards.restore({highest:level,pending:[{level,bonus:100,options:[r,other]}]},level);MFLevelRewards.open();await Promise.all([...document.querySelectorAll('#mf-level img')].map(img=>img.decode().catch(()=>{throw Error('Imagem indisponível: '+img.src)})));document.querySelector('.ml-card').click();document.querySelector('.ml-claim').click();
   if(MFLevelRewards.capture().pending.length)throw Error('Entrega falhou: '+r.id+' '+document.querySelector('.ml-message').textContent);
   if(moedas!==coins+100+(r.kind==='coins'?r.qty:0))throw Error('Moedas erradas');
   if(r.kind==='product'&&__gameInventory.map[r.id]?.count!==r.qty)throw Error('Produto perdido');
   if(r.kind==='object'&&MFObjects.capture().length!==1)throw Error('Presente não chegou ao MiniBaú');
   if(r.kind==='fence'&&MFFences.stock()[r.id]!==r.qty)throw Error('Cercas perdidas');
  }
 });
 assert.deepEqual(errors,[]);console.log('PASS: nível abre duas opções sem chances visíveis, cabe no celular; sorteio e resgate persistem; 37 prêmios entregues com bônus sem duplicação');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
