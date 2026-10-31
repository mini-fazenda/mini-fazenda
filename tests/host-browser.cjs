const {chromium}=require('playwright');
const mock=require('./firebase-mock.cjs');

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>{dialogs.push(d.type());d.dismiss()});
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};`}));
 await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 await page.goto('http://localhost:8080');await page.locator('#login:not([disabled])').waitFor();
 if(await page.locator('iframe').count())throw Error('Jogo abriu antes do login');
 await page.locator('#login').click();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 let f=page.frames().find(f=>f.url().includes('game.html'));
 const hostVersion=await page.locator('script[src*="online.js?v="]').getAttribute('src');
 if(new URL(f.url()).searchParams.get('v')!==new URL(hostVersion,'http://localhost:8080').searchParams.get('v'))throw Error('Jogo reutilizou versão antiga no cache');
 console.log('PASS: iframe usa a versão publicada do host, sem URL fixa de cache');
 // Conta nova: escolhe o personagem antes de jogar.
 await f.waitForFunction(()=>window.MFCharacter);await f.evaluate(()=>window.MFCharacter.choose('menino'));
 // O clique de tela cheia dentro do iframe deve acionar o documento pai.
 await page.evaluate(()=>{
   window.__testFullscreenRequests=0;
   document.documentElement.requestFullscreen=()=>{window.__testFullscreenRequests++;return Promise.resolve()};
 });
 await f.evaluate(()=>{
   const button=document.getElementById('btn-fullscreen');
   if(!button)throw Error('Botão de tela cheia não encontrado');
   button.click();
 });
 await page.waitForFunction(()=>window.__testFullscreenRequests===1);
 await page.setViewportSize({width:600,height:320});
 const controls=await page.evaluate(()=>['logout'].map(id=>{
   const el=document.getElementById(id),r=el.getBoundingClientRect();
   return {id,width:r.width,height:r.height,left:r.left,right:r.right,visibility:getComputedStyle(el).visibility};
 }));
 for(const c of controls){
   if(c.width<=0||c.height<=0||c.left<0||c.right>600||c.visibility!=='visible')
     throw Error('Controle inacessível em tela menor: '+JSON.stringify(c));
 }
 await page.setViewportSize({width:360,height:640});
 const portrait=await page.evaluate(()=>{
   const warning=document.getElementById('mf-rotate-warning');
   const friends=document.getElementById('logout');
   const exit=document.getElementById('logout');
   return {warning:getComputedStyle(warning).display,passThrough:getComputedStyle(warning).pointerEvents,buttonZ:Number(getComputedStyle(document.getElementById('toolbar')).zIndex),warningZ:Number(getComputedStyle(warning).zIndex),friends:getComputedStyle(friends).visibility,logout:getComputedStyle(exit).visibility};
 });
 if(portrait.warning!=='flex'||portrait.passThrough!=='none'||portrait.buttonZ<=portrait.warningZ||portrait.friends!=='visible'||portrait.logout!=='visible')
   throw Error('Controles inacessíveis em retrato: '+JSON.stringify(portrait));
 await page.setViewportSize({width:1280,height:720});
 console.log('PASS: tela cheia solicitada pelo host; Sair dentro do viewport mobile');
 await f.evaluate(()=>{moedas=9876;window.__farmName='Conta';saveGameState('test')});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.moedas===9876);
 console.log('PASS: salvamento automático por conta');
 // O save privado e a projeção pública são gravados atomicamente na mesma revisão.
 await f.evaluate(()=>{window.__farmName='Yellowstone';saveGameState('atomic-projection')});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.farmName==='Yellowstone'&&testCloud['publicFarms/rodrigo']?.state?.farmName==='Yellowstone'&&testCloud['publicFarms/rodrigo'].revision===testCloud['farms/rodrigo'].revision);
 // Reparar cópia antiga ao entrar, mesmo que o progresso privado não mude.
 await page.evaluate(()=>{testCloud['publicFarms/rodrigo'].state.farmName='Antiga';localStorage.setItem('test-cloud',JSON.stringify(testCloud));});await page.reload();await page.waitForFunction(()=>document.querySelector('#gate').hidden);f=page.frames().find(f=>f.url().includes('game.html'));await page.waitForFunction(()=>testCloud['publicFarms/rodrigo']?.state?.farmName==='Yellowstone');console.log('PASS: visita atualiza após falha e corrige cópia antiga no login');
 // Conta com revisão remota mais alta na mesma sessão: deve recuperar sem perder a alteração.
 await page.evaluate(()=>{testCloud['farms/rodrigo'].revision+=1;});
 await f.evaluate(()=>{moedas=9877;saveGameState('revision-retry')});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.moedas===9877);
 console.log('PASS: conflito de revisão da mesma conta foi recuperado');
 // Após confirmar no Firebase, a cópia pendente precisa ser apagada.
 await page.evaluate(()=>{window.testFailMaxretry=100});
 await f.evaluate(()=>{moedas=9878;saveGameState('maxretry')});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.moedas===9878,{timeout:15000});
 if(await page.evaluate(()=>[...Object.keys(sessionStorage),...Object.keys(localStorage)].some(k=>k.startsWith('mf-recovery-v2:')||k.startsWith('mf-pending-v3:'))))throw Error('Save gravado em sessionStorage');
 if(!await page.evaluate(()=>testAtomicSaves>0&&testRestWrites===0&&testFailMaxretry>0))throw Error('Save não usou gravação atômica sem transações maxretry');
 console.log('PASS: save atômico não depende de retries de transação e limpa pendência após confirmação');
 // Save legado sem farmName: a cópia pública precisa ter nome para visitas.
 await f.evaluate(()=>{window.__farmName='';saveGameState('legacy-no-name')});
 await page.waitForFunction(()=>testCloud['publicFarms/rodrigo']?.state?.farmName==='Fazenda');
 await f.evaluate(()=>{window.__farmName='Conta';saveGameState('restore-name')});
 console.log('PASS: projeção pública de save antigo sem nome');

 if(await page.locator('#backup,#recover,#use-cloud').count())throw Error('Interface de backup permaneceu');
 await page.evaluate(()=>localStorage.setItem('mf-online:demo:rodrigo',JSON.stringify({pending:true,baseRevision:999,state:{moedas:1}})));
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 f=page.frames().find(f=>f.url().includes('game.html'));
 if(await f.evaluate(()=>moedas)!==9878)throw Error('Save local prevaleceu sobre a conta');
 if(await page.evaluate(()=>localStorage.getItem('mf-online:demo:rodrigo'))!==null)throw Error('Save antigo não foi removido');
 if(dialogs.length)throw Error('Confirmação ao recarregar');
 console.log('PASS: reload sem confirmação, ignora e limpa save local antigo');
 await page.evaluate(()=>testDisconnect());
 await page.waitForFunction(()=>!document.querySelector('#gate').hidden);
 if(await f.evaluate(()=>parent.MFOnline.playing()))throw Error('Jogo continuou offline');
 await page.evaluate(()=>testReconnect());await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 console.log('PASS: pausa offline e retoma após conferir a sessão');
 await page.waitForFunction(()=>testCloud['publicFarms/rodrigo']?.state);
 await page.evaluate(()=>{
   testCloud['directory']={neighbor:{name:'Vizinha',level:5}};
   testCloud['publicFarms/neighbor']={state:{...testCloud['publicFarms/rodrigo'].state,farmName:'Vizinha',moedas:0}};
   // A visita agora acontece pela barra de amigos.
   testCloud['profiles/neighbor']={name:'Vizinha',level:5,xp:0,code:'222222'};
   testCloud['friends/rodrigo']={neighbor:1};
   testSubs.filter(s=>s.p==='friends/rodrigo').forEach(s=>s.cb({val:()=>({neighbor:1})}));
 });
 f=page.frames().find(f=>f.url().includes('game.html'));
 await f.evaluate(()=>{const d=document.getElementById('mf-daily');if(d){d.classList.remove('on');d.hidden=true;d.style.display='none'}});
 await f.locator('#mf-amigos .mfa-visit').first().click();
 await page.waitForFunction(()=>document.querySelector('#gate').hidden&&document.querySelector('#farm-title').textContent.includes('Vizinha'));
 const ownCoins=await page.evaluate(()=>testCloud['farms/rodrigo'].state.moedas);
 await page.locator('#home').click();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 f=page.frames().find(f=>f.url().includes('game.html'));
 if(await f.evaluate(()=>moedas)!==ownCoins)throw Error('Visita alterou a própria fazenda');
 console.log('PASS: visita e retorno carregam a fazenda da conta');
 // Crédito de teste é exclusivo do ID e sobrevive aos saves sem repetir.
 await page.evaluate(()=>{
   testCloud['userCodes/rodrigo']='986568';testCloud['codes/986568']='rodrigo';
   localStorage.setItem('test-cloud',JSON.stringify(testCloud));
 });
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 f=page.frames().find(f=>f.url().includes('game.html'));
 if(await f.evaluate(()=>moedas)!==ownCoins+50000)throw Error('Crédito do dono não foi somado');
 await f.evaluate(()=>{moedas-=25;saveGameState('credit-purchase')});
 await page.waitForFunction(coins=>testCloud['farms/rodrigo']?.state.moedas===coins,ownCoins+50000-25);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 f=page.frames().find(f=>f.url().includes('game.html'));
 if(await f.evaluate(()=>moedas)!==ownCoins+50000-25)throw Error('Crédito repetiu ao recarregar');
 console.log('PASS: 50000 moedas somente ao ID 986568, uma vez após salvar e recarregar');
 await page.evaluate(()=>testReplaceSession());
 await page.waitForFunction(()=>document.querySelector('iframe')===null && !document.querySelector('#login').hidden);
 if(!await page.locator('#message').innerText().then(t=>t.includes('outro dispositivo')))throw Error('Sessão antiga não foi desconectada');
 const revision=await page.evaluate(()=>testCloud['farms/rodrigo'].revision);
 await page.waitForTimeout(600);
 if(await page.evaluate(()=>testCloud['farms/rodrigo'].revision)!==revision)throw Error('Sessão antiga gravou depois de sair');
 console.log('PASS: nova sessão desconecta a anterior sem gravações posteriores');
 if(errors.length)throw Error(errors.join('\n'));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
