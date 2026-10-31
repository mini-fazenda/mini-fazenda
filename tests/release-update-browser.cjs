// Jogo aberto há muito tempo: quando sai uma versão nova, ele salva o que estiver pendente e recarrega.
// (Clientes antigos deixavam a versão de visita da fazenda parada para os amigos.)
const {chromium}=require('playwright');
const mock=require('./firebase-mock.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MF_CHROMIUM_PATH?{executablePath:process.env.MF_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let published='v1';
 // A versão de cada página vem do ?v= da URL (como o carimbo da publicação faria).
 const stamp="<script>window.MF_BUILD_VERSION=new URL(location.href).searchParams.get('v')||'v1';</script>";
 await page.route(/localhost:8080\/(\?.*)?$|index\.html|game\.html/,async r=>{const res=await r.fetch();const body=(await res.text()).replace('<head>','<head>'+stamp);r.fulfill({response:res,body,headers:{...res.headers(),'content-type':'text/html'}});});
 await page.route('**/release.json*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:published})}));
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};`}));
 await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 await page.goto('http://localhost:8080/?v=v1');await page.locator('#login:not([disabled])').waitFor();
 await page.locator('#login').click();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 let f=page.frames().find(f=>f.url().includes('game.html'));
 await f.waitForFunction(()=>window.MFCharacter);await f.evaluate(()=>window.MFCharacter.choose('menino'));
 // mesma versão: nada acontece
 await page.evaluate(()=>window.MFCheckRelease());await page.waitForTimeout(400);
 if(!page.url().includes('v=v1'))throw Error('Recarregou sem versão nova');
 // muda algo no jogo e publica uma versão nova
 await f.evaluate(()=>{moedas=4321;});
 published='v2';
 await Promise.all([page.waitForURL(/v=v2/,{timeout:15000}),page.evaluate(()=>window.MFCheckRelease())]);
 await page.locator('#login').waitFor({state:'attached'});
 await page.waitForFunction(()=>document.querySelector('#gate').hidden,null,{timeout:15000});
 f=page.frames().find(f=>f.url().includes('game.html'));
 await f.waitForFunction(()=>typeof moedas==='number');
 const coins=await f.evaluate(()=>moedas),version=await page.evaluate(()=>window.MF_BUILD_VERSION);
 console.log('depois da atualização',{version,coins});
 if(version!=='v2')throw Error('Não carregou a versão nova');
 if(coins!==4321)throw Error('Perdeu o progresso ao atualizar: '+coins);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS: versão nova publicada salva o progresso e recarrega sozinha');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
