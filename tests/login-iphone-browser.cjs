// iPhone/navegador de app: se a janela do Google for bloqueada, NÃO redireciona (o redirecionamento
// quebra no Safari com "missing initial state"); mostra aviso e deixa tocar de novo.
const {chromium,devices}=require('playwright');
const base=require('./firebase-mock.cjs')
 .replace("export const signInWithPopup=async()=>{","export const signInWithPopup=async()=>{if(window.testPopupBlocked){const e=Error('blocked');e.code='auth/popup-blocked';throw e;}")
 +"\nexport const signInWithRedirect=async()=>{window.testRedirects=(window.testRedirects||0)+1;};export const getRedirectResult=async()=>null;\n";
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [name,opts,expectRedirect] of [['iPhone Safari',devices['iPhone 13'],0],['Instagram no Android',{...devices['Pixel 5'],userAgent:devices['Pixel 5'].userAgent+' Instagram 300.0'},0],['PC Chrome',{viewport:{width:1280,height:800}},1]]){
  const ctx=await browser.newContext(opts),page=await ctx.newPage();
  await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:"window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};"}));
  await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:base}));
  await page.addInitScript(()=>{window.testPopupBlocked=true;localStorage.removeItem('test-user');});
  await page.goto('http://localhost:8080');
  await page.waitForFunction(()=>!document.getElementById('login').disabled&&!document.getElementById('login').hidden,null,{timeout:15000});
  await page.click('#login');await page.waitForTimeout(500);
  const r=await page.evaluate(()=>({redirects:window.testRedirects||0,msg:document.getElementById('message').textContent,loginVisible:!document.getElementById('login').hidden&&!document.getElementById('login').disabled}));
  console.log(name,JSON.stringify(r));
  if(r.redirects!==expectRedirect)throw Error(name+': redirecionamento inesperado');
  if(!expectRedirect&&(!/de novo/.test(r.msg)||!r.loginVisible))throw Error(name+': sem aviso para tocar de novo');
  await ctx.close();
 }
 console.log('PASS: login no iPhone/app não redireciona e pede novo toque');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
