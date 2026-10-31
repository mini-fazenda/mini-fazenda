const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit';const browser=await(ios?webkit:chromium).launch({headless:true,...(!ios?{args:['--no-sandbox']}: {})});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
  await page.route('https://i.postimg.cc/**',r=>r.abort());
  await page.goto('http://localhost:8080');
  await page.evaluate(()=>{
   window.testState=null;window.attached=false;window.MFOnline={isVisiting:()=>false,playing:()=>false,bootState:()=>testState,changed(){},attach:a=>{window.testAPI=a;window.attached=true;},fail:e=>{throw e;}};
   document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
  });
  await page.waitForFunction(()=>attached);let f=page.frames().find(f=>f.url().includes('game.html'));
  await f.evaluate(()=>{
   terrenos.forEach(t=>(t._timers||[]).forEach(clearTimeout));terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=10000;playerXP=0;playerLevel=10;clearInventoryFromSave();lootParticles.length=0;
   const one={gx:4,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC},two={gx:6,gy:4,w:2,h:2,imgSrc:TERRA_ARADA_SRC};terrenos.push(one,two);
   const melon={id:'item-melancia',price:650,xp:14},carrot={id:'item-cenoura',price:50,xp:1};
   queueJob(one,'plantar',melon);queueJob(two,'plantar',carrot);melon.id='item-cenoura';melon.price=1;
   placingItem=carrot;finishJob(one,player.acaoAtual);player.acaoAtual=null;iniciarArar(filaAcoes.shift());placingItem={id:'item-melancia',price:9999};finishJob(two,player.acaoAtual);player.acaoAtual=null;
   if(one.cultura.tipo!=='melancia'||two.cultura.tipo!=='cenoura'||moedas!==9300)throw Error('Seleção seguinte mudou espécie/preço da fila');
   one.itemId='item-cenoura';MFAdapter.apply(MFAdapter.project,{skipGame:true});
   if(!one.imgSrc.includes('melancia')||one.cultura.tipo!=='melancia')throw Error('Catálogo usou identidade velha do canteiro');
   // Escolher personagem não pode alterar imagens compartilhadas de culturas/depósito.
   const barn=MFBarnCore.start(9,7,0,Date.now()-400000);terrenos.push(barn);window.testBarn=structuredClone(barn);
   window.testCachedMelon=preload(one.imgSrc);window.testCachedBarn=preload(barn.imgSrc);window.testSources=[testCachedMelon.src,testCachedBarn.src];
   MFCharacter.choose('menina');MFCharacter.choose('menino');MFCharacter.choose('menina');
   if(testCachedMelon.src!==testSources[0]||testCachedBarn.src!==testSources[1]||spriteFront===preload('assets/b86748633e6ac8337f3b-personagem-de-frente.png'))throw Error('Personagem contaminou cache');
   MFAdapter.apply(MFAdapter.project,{skipGame:true});if(!spriteFront.src.includes('/menina/'))throw Error('Catálogo trocou a escolha da conta');
  });
  await page.evaluate(()=>{testState=testAPI.capture();attached=false;document.querySelector('iframe').src='game.html?reload=identity';});
  await page.waitForFunction(()=>attached);f=page.frames().find(f=>f.url().includes('game.html'));
  await f.evaluate(()=>{
   if(terrenos[0].cultura.tipo!=='melancia'||terrenos[1].cultura.tipo!=='cenoura'||__mfCharacter!=='menina'||moedas!==9300)throw Error('Reload perdeu espécie/escolha/saldo');
   for(const t of terrenos.slice(0,2)){t.cultura.startTime=Date.now()-t.cultura.totalTime-1;reapplyGrowthFromTime(t);if(!tryHarvestAtTile(t))throw Error('Não colheu');}
   lootParticles.length=0;
   const inv=__gameInventory.map;
   if(inv.melancia?.count!==4||inv.cenoura?.count!==5)throw Error('Colheita mudou a espécie/rendimento: '+JSON.stringify(inv));
   const old=moedas;document.querySelector('#mf-sales-actions button:nth-child(2)').click();const price=k=>MFFarmEconomy.crops[k].saleCoins;if(moedas!==old+4*price('melancia')+5*price('cenoura'))throw Error('Colheita vendida com valor de outra espécie');
   draw();if(!terrenos.find(t=>t.itemId==='item-celeiro')?.imgSrc.includes('celeiro'))throw Error('Depósito virou outro objeto');
  });
  assert.deepEqual(errors,[]);console.log('PASS: fila mista preserva preço/espécie, catálogo não troca culturas, escolha do personagem não contamina cache, recarga/colheita/venda corretas.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
