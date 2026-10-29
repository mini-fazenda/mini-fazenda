const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],failed=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});page.on('requestfailed',r=>failed.push(r.url()));
 await page.goto('http://localhost:8080');await page.waitForTimeout(200);
 console.log('unconfigured',await page.locator('#message').innerText(),'iframes',await page.locator('iframe').count());
 await page.evaluate(()=>{
  window.testState=null;window.attached=false;window.testPlaying=true;
  window.MFOnline={isVisiting:()=>!window.testPlaying,playing:()=>window.testPlaying,bootState:()=>window.testState,changed:()=>{},attach:api=>{window.testAPI=api;window.attached=true},fail:e=>{throw e}};
  document.getElementById('gate').hidden=true;
  const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });
 await page.waitForFunction(()=>window.attached);await page.waitForTimeout(1500);
 let frame=page.frames().find(f=>f.url().endsWith('game.html'));
 console.log('initial',await page.evaluate(()=>{const s=testAPI.capture();return {moedas:s.moedas,level:s.playerLevel,terrenos:s.terrenos.length}}));
 await frame.evaluate(()=>{
  moedas=4321;playerXP=237;playerLevel=3;window.__farmName='Recanto';
  player.gx=7;player.gy=8;
  const adult={tipo:'vaca',etapa:2,startTime:Date.now()-60000,totalTime:20000,milk:{progress:76,ready:false}};
  terrenos.push({gx:3,gy:3,w:1,h:1,imgSrc:document.querySelector('#item-vaca')?.dataset.img || '',visualScale:1,animal:adult});
  window.addToInventory('milho',6,window.LOOT_SPRITES.milho);
  window.truckOrder={pedidos:[{tipo:'milho',qtd:10,entregue:4}],recompensa:200,completo:false};
 });
 const saved=await page.evaluate(()=>testAPI.capture());
 console.log('saved fields',JSON.stringify({milk:saved.terrenos.at(-1).animal.milk,inventory:saved.inventory,order:saved.truckOrder}));
 await page.evaluate(s=>{window.testState=s;window.attached=false;document.querySelector('iframe').src='game.html?restore=1'},saved);
 await page.waitForFunction(()=>window.attached);await page.waitForTimeout(200);
 frame=page.frames().find(f=>f.url().includes('game.html'));
 const restored=await page.evaluate(()=>testAPI.capture());
 console.log('restored',JSON.stringify({moedas:restored.moedas,xp:restored.playerXP,name:restored.farmName,player:restored.player,milk:restored.terrenos.at(-1).animal.milk,inventory:restored.inventory,order:restored.truckOrder}));
 for(const k of ['moedas','playerXP','farmName','truckOrder','inventory'])if(JSON.stringify(saved[k])!==JSON.stringify(restored[k]))throw Error('Round trip mismatch '+k);
 await page.evaluate(()=>{window.testPlaying=false;window.attached=false;document.querySelector('iframe').src='game.html?visit=1'});
 await page.waitForFunction(()=>window.attached);
 frame=page.frames().find(f=>f.url().includes('game.html'));
 console.log('visitor overlay',await frame.locator('body > div').last().getAttribute('style'));
 const before=await page.evaluate(()=>testAPI.capture().moedas);await page.mouse.click(400,400);const after=await page.evaluate(()=>testAPI.capture().moedas);if(before!==after)throw Error('Visitor mutated coins');
 console.log('errors',errors,'requests failed',failed);

 await browser.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
