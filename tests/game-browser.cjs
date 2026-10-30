const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],failed=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});page.on('requestfailed',r=>failed.push(r.url()));
 // Sem Firebase de verdade: o host fica parado em "aguardando configuração" e não troca o iframe do teste.
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.MINI_FAZENDA_FIREBASE=null;'}));
 await page.route(/gstatic\.com\/firebasejs/,r=>r.abort());
 await page.goto('http://localhost:8080');await page.waitForTimeout(200);
 console.log('unconfigured',await page.locator('#message').innerText(),'iframes',await page.locator('iframe').count());
 await page.evaluate(()=>{
  window.testState=null;window.attached=false;window.testPlaying=true;
  window.MFOnline={isVisiting:()=>!window.testPlaying,playing:()=>window.testPlaying,bootState:()=>window.testState,changed:()=>{},attach:api=>{window.testAPI=api;window.attached=true},fail:e=>{throw e}};
  document.getElementById('gate').hidden=true;
  const f=document.createElement('iframe');f.src='game.html';document.getElementById('game-container').append(f);
 });
 await page.waitForFunction(()=>window.attached);await page.waitForTimeout(1500);
 let frame=page.frames().find(f=>/game\.html/.test(f.url()));
 console.log('initial',await page.evaluate(()=>{const s=testAPI.capture();return {moedas:s.moedas,level:s.playerLevel,terrenos:s.terrenos.length}}));
 // O botão e o gesto de pinça usam o mesmo limite de 25%, inclusive no celular.
 await frame.evaluate(()=>{
  const original={zoom,offsetX,offsetY};zoom=.6;
  const button=document.getElementById('mf-zoom-out');if(!button)throw Error('Botão de afastar não carregou');
  for(let i=0;i<15;i++)button.click();
  if(Math.abs(zoom-.25)>.0001)throw Error('Botão não afastou até 25%: '+zoom);
  zoom=.6;
  const pinch=(type,positions)=>{
   const touches=positions.map((p,i)=>new Touch({identifier:i+1,target:canvas,clientX:p[0],clientY:p[1]}));
   canvas.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:touches}));
  };
  pinch('touchstart',[[200,200],[600,200]]);pinch('touchmove',[[360,200],[440,200]]);pinch('touchend',[]);
  if(Math.abs(zoom-.25)>.0001)throw Error('Pinça não afastou até 25%: '+zoom);
  ({zoom,offsetX,offsetY}=original);requestRedraw();
 });
 console.log('PASS: botão e pinça permitem afastar até 25%');
 // Movimento em celular: toque seleciona, segundo toque posiciona e a câmera permanece imóvel.
 await frame.evaluate(()=>{
   if(!window.MFMoveControls||!window.MFFences?.selectMoveAt)throw Error('Controles de mover não carregaram');
   const o={gx:10,gy:5,w:1,h:1,imgSrc:'',visualScale:1};
   terrenos.push(o);setFarmMoveMode(true);
   const screen=(gx,gy)=>{
     const p=gridToScreen(gx,gy),r=canvas.getBoundingClientRect();
     return {x:r.left+(p.x*zoom+canvas.width/2+offsetX)*r.width/canvas.width,
             y:r.top+(p.y*zoom+canvas.height/3+offsetY)*r.height/canvas.height};
   };
   const a=screen(10,5),b=screen(12,5),ox=offsetX,oy=offsetY;
   window.MFMoveControls.touchStart(a.x,a.y);window.MFMoveControls.touchEnd(a.x,a.y);
   if(estruturaMovendo!==o)throw Error('Primeiro toque não selecionou objeto');
   window.MFMoveControls.touchStart(b.x,b.y);window.MFMoveControls.touchEnd(b.x,b.y);
   if(o.gx!==12||o.gy!==5)throw Error('Segundo toque não reposicionou objeto');
   if(offsetX!==ox||offsetY!==oy)throw Error('Câmera moveu durante seleção');
   const d=screen(13,5);
   const touch=(type,x,y)=>{
     const t=new Touch({identifier:1,target:canvas,clientX:x,clientY:y});
     const ended=type==='touchend';
     canvas.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,
       touches:ended?[]:[t],targetTouches:ended?[]:[t],changedTouches:[t]}));
   };
   touch('touchstart',b.x,b.y);touch('touchmove',d.x,d.y);touch('touchend',d.x,d.y);
   if(o.gx!==13||o.gy!==5)throw Error('Arrastar objeto por gesto real falhou');
   if(offsetX!==ox||offsetY!==oy)throw Error('Gesto de arrastar moveu a câmera');
   // Área inválida/ocupada: não perde objeto e não conclui seleção.
   terrenos.push({gx:14,gy:5,w:1,h:1,imgSrc:''});
   window.MFMoveControls.touchStart(d.x,d.y);window.MFMoveControls.touchEnd(d.x,d.y);
   const occupied=screen(14,5);
   window.MFMoveControls.touchStart(occupied.x,occupied.y);window.MFMoveControls.touchEnd(occupied.x,occupied.y);
   if(o.gx!==13||estruturaMovendo!==o)throw Error('Destino ocupado deveria manter seleção');
   setFarmMoveMode(false);terrenos.splice(terrenos.indexOf(o),1);
   terrenos.splice(terrenos.findIndex(x=>x.gx===14&&x.gy===5&&x.imgSrc===''),1);
   const old=window.MFFences.capture(),coins=moedas;moedas=99999;
   window.MFFences.start('flowers');
   const start=screen(10,4.5);
   canvas.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0,clientX:start.x,clientY:start.y}));
   const added=window.MFFences.capture().segments.find(e=>!old.segments.some(a=>MFFenceCore.key(a)===MFFenceCore.key(e)));
   if(!added)throw Error('Cerca de teste não foi criada');
   window.MFFences.stop();setFarmMoveMode(true);
   const midpoint=e=>{const ends=MFFenceCore.ends(e),a=gridToScreen(ends[0].gx-.5,ends[0].gy-.5),b=gridToScreen(ends[1].gx-.5,ends[1].gy-.5);
     const r=canvas.getBoundingClientRect();
     return {x:r.left+((a.x+b.x)/2*zoom+canvas.width/2+offsetX)*r.width/canvas.width,
             y:r.top+(((a.y+b.y)/2-17)*zoom+canvas.height/3+offsetY)*r.height/canvas.height};};
   const p=midpoint(added);
   canvas.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0,clientX:p.x,clientY:p.y}));
   if(!window.MFFences.isMoveSelected())throw Error('Clique em mover não selecionou a cerca');
   const moved={...added,gx:added.gx+2,gy:added.gy+2};
   const q=midpoint(moved);
   canvas.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0,clientX:q.x,clientY:q.y}));
   if(window.MFFences.isMoveSelected()||!window.MFFences.capture().segments.some(e=>MFFenceCore.key(e)===MFFenceCore.key(moved)))
     throw Error('Segundo clique não moveu a cerca: '+JSON.stringify({selected:window.MFFences.isMoveSelected(),added,moved,segments:window.MFFences.capture().segments}));
   // Uma cerca também pode ser selecionada e deslocada somente com o dedo.
   const movedPoint=midpoint(moved);
   window.MFMoveControls.touchStart(movedPoint.x,movedPoint.y);
   window.MFMoveControls.touchEnd(movedPoint.x,movedPoint.y);
   if(!window.MFFences.isMoveSelected())throw Error('Toque não selecionou cerca');
   const next={...moved,gx:moved.gx+1,gy:moved.gy+1},nextPoint=midpoint(next);
   window.MFMoveControls.touchStart(movedPoint.x,movedPoint.y);
   window.MFMoveControls.touchMove(nextPoint.x,nextPoint.y);
   window.MFMoveControls.touchEnd(nextPoint.x,nextPoint.y);
   if(!window.MFFences.capture().segments.some(e=>MFFenceCore.key(e)===MFFenceCore.key(next)))
     throw Error('Arraste no celular não reposicionou cerca');
   window.MFFences.restore(old);moedas=coins;setFarmMoveMode(false);
 });
 console.log('PASS: toque/arraste de objetos sem pan; cerca selecionável e movível');
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
