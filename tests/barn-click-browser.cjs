const {chromium,webkit,devices}=require('playwright');
(async()=>{
 const ios=process.env.MF_BROWSER==='webkit';
 const browser=await (ios?webkit:chromium).launch({headless:true,...(!ios&&process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),...(!ios?{args:['--no-sandbox']}: {})});
 const page=await browser.newPage(ios?{...devices['iPhone 13'],viewport:{width:844,height:390}}:{}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
 await page.route(/gstatic\.com\/firebasejs/,r=>r.abort());await page.route('https://i.postimg.cc/**',r=>r.abort());
 await page.goto('http://localhost:8080');
 await page.evaluate(()=>{
  window.testState=null;window.attached=false;window.testPlaying=false;
  window.MFOnline={isVisiting:()=>false,playing:()=>testPlaying,bootState:()=>testState,changed(){},attach:api=>{window.testAPI=api;window.attached=true;},fail:e=>{throw e}};
  document.getElementById('gate').hidden=true;const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });
 await page.waitForFunction(()=>attached);let f=page.frames().find(f=>f.url().includes('game.html'));
 const defaults=await f.evaluate(()=>({speed:player.speed,scale:player.scale}));
 await f.evaluate(()=>{
  clearInventoryFromSave();moedas=1000;addToInventory('milho',6,'antigo.png');
  // Mesmo sem abrir o caminhão, o pedido legado ficou marcado como aberto.
  window.truckOrder={schema:2,pedidos:[{tipo:'milho',qtd:10,entregue:0}],aberto:true,recompensa:200};
  document.getElementById('overlay-caminhao').style.display='none';document.getElementById('overlay-bau').style.display='flex';
 });
 // O evento percorre os listeners de captura e os legados do slot.
 await f.locator('#bau-inventario .bau-slot[data-tipo="milho"]').dispatchEvent('click');
 await f.evaluate(()=>{
  if(__gameInventory.map.milho?.count!==6||truckOrder.pedidos[0].entregue!==0||moedas!==1000)throw Error('Clique no celeiro consumiu o produto');
  // Até uma chamada explícita não entrega com a janela fechada.
  tentarEntregarDoSlot(__gameInventory.slots[__gameInventory.map.milho.slotIndex],{explicit:true});
  if(__gameInventory.map.milho.count!==6)throw Error('Entregou com janela fechada');
 });
 console.log('PASS: clique no celeiro com pedido legado aberto não remove nem entrega produtos.');
 await page.evaluate(()=>{
  testState=testAPI.capture();testState.player.speed=999;testState.player.scale=9;testState.truckOrder.aberto=true;
  window.attached=false;document.querySelector('iframe').src='game.html?old-settings=1';
 });
 await page.waitForFunction(()=>attached);f=page.frames().find(f=>f.url().includes('game.html'));
 await f.evaluate(expected=>{
  if(player.speed!==expected.speed||player.scale!==expected.scale)throw Error('Save antigo restaurou configuração antiga');
  if(truckOrder.aberto||truckOrder.pedidos[0].entregue!==0||__gameInventory.map.milho.count!==6)throw Error('Migração alterou estoque/entregas');
  const saved=parent.testAPI.capture();if('speed' in saved.player||'scale' in saved.player||saved.truckOrder.aberto)throw Error('Configuração antiga voltou ao save');
  document.getElementById('overlay-bau').style.display='flex';
  // Efeito visual com defeito não pode consumir estoque antes de creditar a venda.
  window.MFValueSource={element(){throw Error('efeito indisponível')}};
 },defaults);
 await f.locator('#mf-sales-actions button').first().dispatchEvent('click');
 await f.locator('#bau-inventario .bau-slot[data-tipo="milho"]').dispatchEvent('click');
 await f.evaluate(()=>{if(__gameInventory.map.milho.count!==6)throw Error('Selecionar vendeu/entregou sem confirmação');});
 await f.locator('#mf-sales-actions button').first().dispatchEvent('click');
 await f.evaluate(()=>{
  if(moedas!==1000+6*MFFarmEconomy.crops.milho.saleCoins||__gameInventory.map.milho)throw Error('Venda não creditou 6 milhos pelo preço da tabela');
  if(truckOrder.pedidos[0].entregue!==0)throw Error('Venda também entregou ao caminhão');
  document.getElementById('mf-sale-summary').hidden=true;addToInventory('milho',6,'');
  document.getElementById('overlay-bau').style.display='none';abrirOverlayCaminhao();
  // Usa o mapa autoritativo, mesmo que o contador visual esteja incorreto.
  __gameInventory.slots[__gameInventory.map.milho.slotIndex].dataset.count='0';
  parent.testPlaying=true;document.getElementById('mf-truck-deliver').click();parent.testPlaying=false;
  if(truckOrder.pedidos[0].entregue!==6||__gameInventory.map.milho||moedas!==1000+6*MFFarmEconomy.crops.milho.saleCoins)throw Error('Entrega explícita incorreta');
 });
 console.log('PASS: configurações antigas são atualizadas; seleção preserva estoque; venda credita; entrega exige ação explícita.');
 if(errors.length)throw Error(errors.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
