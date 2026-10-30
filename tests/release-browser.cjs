const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawn}=require('node:child_process');const {chromium,webkit}=require('playwright');const mock=require('./firebase-mock.cjs');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mf-built-'));let server,browser;
 try{
  fs.cpSync('public',dir,{recursive:true});execFileSync('python3',['scripts/stamp-release.py',dir,'buildtest58']);
  server=spawn('python3',['-m','http.server','8081','--directory',dir],{stdio:'ignore'});
  for(let i=0;i<50;i++){try{if((await fetch('http://localhost:8081')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  const ios=process.env.MF_BROWSER==='webkit';browser=await(ios?webkit:chromium).launch({headless:true,...(!ios?{args:['--no-sandbox']}: {})});
  async function setup(page){
   await page.route(/\/firebase-config\.js(?:\?|$)/,r=>r.fulfill({contentType:'application/javascript',body:"window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'https://firebase.test',projectId:'demo',appId:'demo'};"}));
   await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));await page.route('https://i.postimg.cc/**',r=>r.abort());
  }
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('localhost:8081')&&/\.js(?:\?|$)/.test(r.url()))requests.push(r.url());});await setup(page);
  await page.goto('http://localhost:8081');await page.locator('#login:not([disabled])').click();await page.waitForFunction(()=>MFOnline.playing()&&testCloud['farms/rodrigo']);
  assert.ok(requests.length>10);assert.ok(requests.every(u=>new URL(u).searchParams.get('v')==='buildtest58'));
  assert.equal(await page.frames().find(f=>f.url().includes('game.html')).evaluate(()=>MF_BUILD_VERSION),'buildtest58');
  const cloud=await page.evaluate(()=>JSON.stringify(testCloud));
  const context=await browser.newContext();const stale=await context.newPage();await setup(stale);
  await stale.addInitScript(value=>{localStorage.setItem('test-cloud',value);localStorage.setItem('test-user','yes');},cloud);
  await stale.route(/\/game\.html(?:\?|$)/,async r=>{const response=await r.fetch();const html=(await response.text()).replace('window.MF_BUILD_VERSION="buildtest58"','window.MF_BUILD_VERSION="old-build"');await r.fulfill({response,body:html});});
  await stale.goto('http://localhost:8081');await stale.waitForFunction(()=>document.getElementById('message').textContent.includes('versões diferentes'));
  assert.equal(await stale.evaluate(()=>MFOnline.playing()),false);
  assert.equal(await stale.evaluate(()=>testCloud['farms/rodrigo'].revision),JSON.parse(cloud)['farms/rodrigo'].revision);
  assert.equal(await stale.locator('#game-container iframe').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS: publicação compilada usa um build em todos os módulos; jogo de build antigo é bloqueado antes de gravar na conta.');
 }finally{await browser?.close();server?.kill();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
