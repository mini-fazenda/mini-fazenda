const {chromium}=require('playwright');const mock=require('./firebase-mock.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const context=await browser.newContext();let page=await context.newPage();const errors=[];
 const setup=async p=>{p.on('pageerror',e=>errors.push(e.message));await p.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'demo',projectId:'demo',appId:'demo'};"}));await p.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));await p.route('https://i.postimg.cc/**',r=>r.abort());};
 const loaded=async()=>{await page.waitForFunction(()=>document.querySelector('#gate').hidden&&document.querySelector('iframe'));return page.frames().find(f=>f.url().includes('game.html'));};
 await setup(page);await page.goto('http://localhost:8080');await page.locator('#login:not([disabled])').click();let f=await loaded();
 await f.evaluate(()=>{MFCharacter.choose('menino');window.__farmName='Save';moedas=1000;saveGameState('initial');});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.moedas===1000);await page.waitForTimeout(300);
 await page.evaluate(()=>{const state=structuredClone(testCloud['farms/rodrigo'].state),game=document.querySelector('iframe').contentWindow;MFOnline.attach({capture:()=>({...state,moedas:game.moedas})});});
 await page.evaluate(()=>{window.testHoldSaves=true;});
 await f.evaluate(()=>{moedas=2000;saveGameState('first');});await page.waitForFunction(()=>testSaveWaiters.length===1);
 await f.evaluate(()=>{moedas=3000;saveGameState('latest');});await page.waitForTimeout(50);
 await page.evaluate(()=>testReleaseSave());await page.waitForFunction(()=>testCloud['farms/rodrigo'].state.moedas===2000&&testSaveWaiters.length===1);
 await page.reload();f=await loaded();if(await f.evaluate(()=>moedas)!==3000)throw Error('Perdeu alteração mais recente: confirmação anterior avançou revisão');
 await page.waitForFunction(()=>testCloud['farms/rodrigo'].state.moedas===3000);console.log('PASS: recarregar durante confirmação de save anterior preserva o mais recente');

 await page.evaluate(()=>{window.testHoldSaves=true;});await f.evaluate(()=>{moedas=3500;saveGameState('stalled');});await page.waitForFunction(()=>testSaveWaiters.length===1);
 await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('save/timeout'),null,{timeout:18000});
 if(await page.evaluate(()=>MFOnline.playing()))throw Error('Jogo continuou durante save sem resposta');
 await page.evaluate(()=>{window.testHoldSaves=false;testReleaseSave();});await page.waitForFunction(()=>testCloud['farms/rodrigo'].state.moedas===3500&&MFOnline.playing());
 console.log('PASS: save sem resposta pausa, confirmação atrasada libera o jogo sem duplicação');
 await page.evaluate(()=>{window.testDenySave=true;});await f.evaluate(()=>{moedas=4000;saveGameState('denied');});
 await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('PERMISSION_DENIED'));
 if(!await page.locator('#sync').isVisible())throw Error('Falha de salvamento está escondida');
 if(await page.evaluate(()=>MFOnline.playing()))throw Error('Jogo continuou alterando fazenda com escrita negada');
 // Fechar a aba encerra sessionStorage; a recuperação pendente precisa sobreviver.
 await page.close();page=await context.newPage();await setup(page);await page.goto('http://localhost:8080');f=await loaded();
 if(await f.evaluate(()=>moedas)!==4000)throw Error('Perdeu progresso pendente ao fechar a aba');
 await page.waitForFunction(()=>testCloud['farms/rodrigo'].state.moedas===4000);console.log('PASS: permissão negada fica visível, pausa alterações e fechamento da aba preserva pendência');
 await page.evaluate(()=>{window.testHoldSaves=true});await f.evaluate(()=>{moedas=5000;saveGameState('stale');});await page.waitForFunction(()=>testSaveWaiters.length===1);
 await page.evaluate(()=>{const c=testCloud['farms/rodrigo'];c.revision++;c.saveId='other-newer';c.sessionId='other-session';c.state.moedas=6000;localStorage.setItem('test-cloud',JSON.stringify(testCloud));});
 await page.reload();f=await loaded();if(await f.evaluate(()=>moedas)!==6000)throw Error('Recuperação antiga sobrescreveu save mais novo');console.log('PASS: pendência antiga não sobrescreve progresso confirmado mais recente de outra sessão');
 if(errors.length)throw Error(errors.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
