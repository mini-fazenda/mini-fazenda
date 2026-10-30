const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
  await page.goto('http://localhost:8080');
  await page.evaluate(()=>{
   window.testState=null;window.testAttached=false;window.saleCheckpoints=[];
   window.MFOnline={isVisiting:()=>false,playing:()=>false,bootState:()=>window.testState,
    changed(reason){if(!window.testAPI)return;window.testState=window.testAPI.capture();if(reason==='inventory-sale')window.saleCheckpoints.push(window.testState);},
    attach(api){window.testAPI=api;window.testAttached=true;},fail(e){throw e;}};
   document.getElementById('gate').hidden=true;
   const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
  });
  await page.waitForFunction(()=>window.testAttached);
  const frame=()=>page.frames().find(f=>f.url().includes('game.html'));
  const setup=async()=>frame().evaluate(()=>{
   clearInventoryFromSave();moedas=1000;document.getElementById('valor-moedas').textContent=moedas;
   addToInventory('espinafre',4,'');addToInventory('cenoura',5,'');
   MFTutorial.restore({step:5,done:true},false);
   document.querySelectorAll('#mf-char,#mf-daily').forEach(el=>{el.classList.remove('on');el.hidden=true;el.style.display='none';});
   MFInventorySales.reset();document.getElementById('mf-sale-summary').hidden=true;document.getElementById('overlay-bau').style.display='flex';
  });
  const select=async(qty)=>{
   await frame().locator('#mf-sales-actions button').nth(0).tap();
   await frame().locator('.bau-slot[data-tipo=espinafre]').tap();
   if(qty!==undefined)await frame().locator('.mf-sale-qty').fill(String(qty));
  };
  const state=()=>frame().evaluate(()=>({coins:moedas,hud:document.getElementById('valor-moedas').textContent,spinach:__gameInventory.map.espinafre?.count||0,carrots:__gameInventory.map.cenoura?.count||0,msg:document.getElementById('mf-sales-msg').textContent,summary:document.getElementById('mf-sale-summary').textContent}));
  await setup();await select(2);await frame().locator('#mf-sales-actions button').nth(0).tap();
  let s=await state();assert.equal(s.coins,1280);assert.equal(s.hud,'1280');assert.equal(s.spinach,2);assert.equal(s.carrots,5);assert.match(s.summary,/280 moedas/);
  const checkpoint=await page.evaluate(()=>saleCheckpoints.at(-1));assert.equal(checkpoint.moedas,1280);assert.equal(checkpoint.inventory.espinafre.count,2);assert.equal(checkpoint.inventory.cenoura.count,5);
  await page.evaluate(()=>{window.testAttached=false;document.querySelector('iframe').src='game.html?selection-reload=1';});
  await page.waitForFunction(()=>window.testAttached);s=await state();assert.equal(s.coins,1280);assert.equal(s.spinach,2);assert.equal(s.carrots,5);
  console.log('PASS: toque, seleção parcial de espinafre, crédito 280, checkpoint conjunto e reload');

  await setup();await frame().evaluate(()=>{window.savedQuote=MFAdapter.salePreview;MFAdapter.salePreview=()=>({coins:0,xp:0});});
  await select();await frame().locator('#mf-sales-actions button').nth(0).tap();
  s=await state();assert.equal(s.coins,1000);assert.equal(s.spinach,4);assert.equal(s.carrots,5);assert.match(s.msg,/Preço inválido/);
  await frame().evaluate(()=>{MFAdapter.salePreview=window.savedQuote;});
  console.log('PASS: preço zero recusa a venda sem remover produtos ou saldo');

  await setup();await frame().evaluate(()=>{window.savedAudio=MFGameAudio.event;MFGameAudio.event=()=>{throw Error('Falha simulada no áudio');};});
  await select();await frame().locator('#mf-sales-actions button').nth(0).tap();
  s=await state();assert.equal(s.coins,1560);assert.equal(s.spinach,0);assert.equal(s.carrots,5);assert.match(s.summary,/560 moedas/);
  const saved=await page.evaluate(()=>saleCheckpoints.at(-1));assert.equal(saved.moedas,1560);assert.equal(saved.inventory.espinafre,undefined);assert.equal(saved.inventory.cenoura.count,5);
  await frame().evaluate(()=>{MFGameAudio.event=window.savedAudio;document.getElementById('mf-sale-summary').hidden=true;});
  await frame().locator('#mf-sales-actions button').nth(1).tap();s=await state();assert.equal(s.coins,1630);assert.equal(s.carrots,0);
  assert.deepEqual(errors,[]);
  console.log('PASS: falha no áudio não interrompe crédito/save/resumo; Vender tudo continua funcionando');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
