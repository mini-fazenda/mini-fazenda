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
 await f.evaluate(()=>{
  terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=30000;clearInventoryFromSave();modoMover=false;modoColocar=false;spawnedTiles.clear();
  const initial=playerXP;let i=0;
  for(const [type,c]of Object.entries(MFFruitTrees.types)){
   const card=document.getElementById('item-arvore-'+type);if(card?.dataset.category!=='arvores')throw Error('Árvore fora da loja');
   card.click();if(!trySpawnProprioAt(4+i*3,4))throw Error('Não comprou árvore '+type);const t=terrenos.at(-1);i++;
   if(!t.fruitTree||playerXP!==initial)throw Error('Ciclo ausente ou estrelas cobradas ao comprar');
   t.fruitTree.startTime=Date.now()-c.cycle*.6;MFFruitTrees.sync(t);if(t.imgSrc!==c.stages[1])throw Error('Arte de 50% incorreta');
  }
  if(moedas!==12000)throw Error('Compra das árvores incorreta');window.MFCancelPlacing();
 });
 await reload();f=frame();await f.evaluate(()=>{
  const award=addXP;let awarded=0;addXP=n=>{awarded+=n;award(n);};let stars=0;
  for(const t of terrenos){const c=MFFruitTrees.config(t);if(!t.fruitTree||MFFruitTrees.state(t).stage!==1)throw Error('Árvore não persistiu');t.fruitTree.startTime-=c.cycle;MFFruitTrees.sync(t);if(farmPointerAction(t)!=='harvest')throw Error('Cursor não virou foice');if(!MFJobs.queue(t,'tree'))throw Error('Não enfileirou coleta');stars+=c.stars;}
  for(let i=0;i<4;i++){const a=player.acaoAtual;if(!a)throw Error('Fila perdida');player.gx=a.alvo.gx;player.gy=a.alvo.gy;player.path=[];a.state='ararando';a.startTime=performance.now()-a.duration-10;processArar();}
  addXP=award;if(awarded!==stars)throw Error('Estrelas de coleta incorretas: '+awarded+'/'+stars);
  for(const t of terrenos){const c=MFFruitTrees.config(t);if(t.imgSrc!==c.stages[0]||collectTreeFruit(t))throw Error('Árvore morreu ou coleta duplicou');if(__gameInventory.map[t.fruitTree.tipo]?.count!==1)throw Error('Fruta não entrou no celeiro');}
  const coins=moedas;document.querySelector('#mf-sales-actions button:nth-child(2)').click();if(moedas!==coins+1800)throw Error('Frutas devem vender por 300+400+500+600');
 });
 await reload();f=frame();await f.evaluate(()=>{if(terrenos.length!==4||terrenos.some(t=>!t.fruitTree||MFFruitTrees.state(t).stage!==0)||Object.keys(__gameInventory.map).length)throw Error('Ciclo ou venda não persistiu');});
 console.log('PASS: quatro árvores na loja, compra, 50%, save, foice, fila, estrelas, venda e reinício sem duplicação');
 await f.evaluate(()=>{
  window.MFCancelPlacing();setFarmMoveMode(false);document.querySelectorAll('#overlay-bau,#overlay-loja').forEach(el=>el.style.display='none');document.getElementById('mf-sale-summary').hidden=true;
  document.querySelectorAll('#mf-char,#mf-daily').forEach(el=>{el.classList.remove('on');el.hidden=true;el.style.display='none';});MFTutorial.restore({step:5,done:true},false);
  const t=terrenos[0];t.fruitTree.startTime-=MFFruitTrees.config(t).cycle;MFFruitTrees.sync(t);offsetX=0;offsetY=-75;zoom=.6;requestRedraw();
 });
 await f.waitForFunction(()=>{const im=preload(terrenos[0].imgSrc);return im.complete&&im.naturalWidth>0;});
 const treeTap=await f.evaluate(()=>{const t=terrenos[0],p=gridToScreen(t.gx+.5,t.gy+.5);return {x:canvas.width/2+offsetX+p.x*zoom,y:canvas.height/3+offsetY+(p.y-70)*zoom};});
 await f.locator('#game').tap({position:treeTap});
 await f.waitForFunction(()=>player.acaoAtual?.job==='tree'||filaAcoes.some(t=>t._job?.kind==='tree'));
 await f.evaluate(()=>{
  const t=terrenos[1],saved={...t.fruitTree};if(!MFObjects.store(t))throw Error('Não guardou árvore');
  const stored=MFObjects.capture().at(-1);if(stored.fruitTree.startTime!==saved.startTime||stored.fruitTree.tipo!==saved.tipo)throw Error('MiniBaú perdeu ciclo da árvore');
 });
 console.log('PASS: toque real na árvore madura inicia a coleta com foice');
 for(const kind of ['arar','colher','plantar']){
  await f.evaluate(kind=>{
   window.MFCancelPlacing();setFarmMoveMode(false);terrenos=[];filaAcoes=[];player.acaoAtual=null;player.path=[];moedas=1000;aradora.spawned=false;
   document.querySelectorAll('#overlay-bau,#overlay-loja').forEach(el=>el.style.display='none');document.getElementById('mf-sale-summary').hidden=true;
   offsetX=0;offsetY=-50;zoom=.5;
   for(let i=0;i<4;i++){
    const t={gx:3+i*2,gy:5,w:2,h:2,imgSrc:kind==='arar'?TERRA_SECA_SRC:TERRA_ARADA_SRC};terrenos.push(t);
    if(kind==='colher'){t.cultura={tipo:'cenoura',startTime:Date.now()-600001,totalTime:600000,etapa:2};reapplyGrowthFromTime(t);}
   }
   if(kind==='plantar')document.getElementById('item-cenoura').click();
  },kind);
  await f.waitForFunction(()=>terrenos.every(t=>preload(t.imgSrc)?.naturalWidth>0));
  for(let i=0;i<4;i++){
   const pos=await f.evaluate(i=>{const t=terrenos[i],p=gridToScreen(t.gx+.5,t.gy+.5);return {x:canvas.width/2+offsetX+p.x*zoom,y:canvas.height/3+offsetY+(p.y-10)*zoom};},i);
   await f.locator('#game').tap({position:pos});await page.waitForTimeout(80);
  }
  await f.evaluate(kind=>{const jobs=[player.acaoAtual?.alvo,...filaAcoes].filter(Boolean);if(jobs.length!==4||new Set(jobs).size!==4)throw Error('Toques perderam fila de '+kind+': '+jobs.length);},kind);
 }
 console.log('PASS: quatro toques consecutivos preservam filas de arar, colher e plantar sem esperar o personagem');
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS: celeiro 200 moedas, obra autônoma 5min, giro, save, 5 estrelas únicas e toque abre vendas ('+(ios?'WebKit/iOS':'Chromium/toque')+')');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
