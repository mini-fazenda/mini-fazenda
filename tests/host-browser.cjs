const {chromium}=require('playwright');
const mock=`
const cloud=window.testCloud ||= JSON.parse(localStorage.getItem('test-cloud')||'{}');
window.testConnected=true;const subs=window.testSubs ||= [];const callbacks=window.testAuthCallbacks ||= [];
const snap=v=>({val:()=>v===undefined?null:structuredClone(v)});
const notify=p=>subs.filter(s=>s.p===p).forEach(s=>s.cb(snap(cloud[p])));
const persist=()=>localStorage.setItem('test-cloud',JSON.stringify(cloud));
export const initializeApp=()=>({}),getAuth=()=>({}),getDatabase=()=>({});
export const browserSessionPersistence={},setPersistence=async()=>{};
export const onAuthStateChanged=(auth,cb)=>{callbacks.push(cb);queueMicrotask(()=>cb(localStorage.getItem('test-user')?{uid:'rodrigo'}:null))};
export class GoogleAuthProvider{}
export const signInWithPopup=async()=>{localStorage.setItem('test-user','yes');callbacks.forEach(cb=>cb({uid:'rodrigo'}))};
export const signOut=async()=>{localStorage.removeItem('test-user');callbacks.forEach(cb=>cb(null))};
export const ref=(db,p='')=>({p});
export const get=async r=>snap(cloud[r.p]);
export const set=async(r,v)=>{cloud[r.p]=structuredClone(v);persist();notify(r.p)};
export const update=async(r,v)=>{Object.assign(cloud,structuredClone(v));persist()};
export const serverTimestamp=()=>Date.now();
export const runTransaction=async(r,fn)=>{const result=fn(cloud[r.p]||null);if(result===undefined)return {committed:false,snapshot:snap(cloud[r.p])};cloud[r.p]=structuredClone(result);persist();notify(r.p);return {committed:true,snapshot:snap(result)}};
export const onValue=(r,cb)=>{const s={p:r.p,cb};subs.push(s);queueMicrotask(()=>cb(snap(r.p==='.info/connected'?window.testConnected:cloud[r.p])));return ()=>subs.splice(subs.indexOf(s),1)};
window.testReplaceSession=()=>{cloud['sessions/rodrigo']='other-device';persist();notify('sessions/rodrigo')};
window.testDisconnect=()=>{window.testConnected=false;subs.filter(s=>s.p==='.info/connected').forEach(s=>s.cb(snap(false)))};
window.testReconnect=()=>{window.testConnected=true;subs.filter(s=>s.p==='.info/connected').forEach(s=>s.cb(snap(true)))};
export const query=r=>r,orderByKey=()=>{},limitToFirst=()=>{},startAfter=()=>{};
`;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>{dialogs.push(d.type());d.dismiss()});
 await page.route('**/firebase-config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.MINI_FAZENDA_FIREBASE={apiKey:'demo',authDomain:'demo',databaseURL:'demo',projectId:'demo',appId:'demo'};`}));
 await page.route('https://www.gstatic.com/firebasejs/12.5.0/*',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 await page.goto('http://localhost:8080');await page.locator('#login:not([disabled])').waitFor();
 if(await page.locator('iframe').count())throw Error('Jogo abriu antes do login');
 await page.locator('#login').click();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 let f=page.frames().find(f=>f.url().includes('game.html'));
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
 const controls=await page.evaluate(()=>['neighbors','logout'].map(id=>{
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
   const friends=document.getElementById('neighbors');
   const exit=document.getElementById('logout');
   return {warning:getComputedStyle(warning).display,passThrough:getComputedStyle(warning).pointerEvents,buttonZ:Number(getComputedStyle(document.getElementById('toolbar')).zIndex),warningZ:Number(getComputedStyle(warning).zIndex),friends:getComputedStyle(friends).visibility,logout:getComputedStyle(exit).visibility};
 });
 if(portrait.warning!=='flex'||portrait.passThrough!=='none'||portrait.buttonZ<=portrait.warningZ||portrait.friends!=='visible'||portrait.logout!=='visible')
   throw Error('Controles inacessíveis em retrato: '+JSON.stringify(portrait));
 await page.setViewportSize({width:1280,height:720});
 console.log('PASS: tela cheia solicitada pelo host; Amigos e Sair dentro do viewport mobile');
 await f.evaluate(()=>{moedas=9876;window.__farmName='Conta';saveGameState('test')});
 await page.waitForFunction(()=>testCloud['farms/rodrigo']?.state.moedas===9876);
 console.log('PASS: salvamento automático por conta');
 if(await page.locator('#backup,#recover,#use-cloud').count())throw Error('Interface de backup permaneceu');
 await page.evaluate(()=>localStorage.setItem('mf-online:demo:rodrigo',JSON.stringify({pending:true,baseRevision:999,state:{moedas:1}})));
 await page.reload();await page.waitForFunction(()=>document.querySelector('#gate').hidden);
 f=page.frames().find(f=>f.url().includes('game.html'));
 if(await f.evaluate(()=>moedas)!==9876)throw Error('Save local prevaleceu sobre a conta');
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
