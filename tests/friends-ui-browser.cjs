const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  const page = await browser.newPage(); const errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
  await page.route('**/assets/fonts/*.ttf',r=>r.fulfill({contentType:'font/ttf',path:path.join(__dirname,'../public/assets/fonts',r.request().url().split('/').pop())}));
  await page.route('**/friends-ui-fixture',r=>r.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('http://localhost:8080/friends-ui-fixture');
  await page.evaluate(()=>{
   window.terrenos=[]; window.preload=()=>new Image(); window.calls=[]; window.save={coins:50000,gifts:[]};
   const friends=Array.from({length:35},(_,i)=>({uid:'user'+i,code:i===0?'128385':String(200000+i),name:i===0?'Bacuri':i===1?'Cabaré':'Fazenda '+i,level:12,xp:1104}));
   window.friendState={code:'986568',friends,requests:[]};
   window.MFHost={friends:{subscribe(fn){window.publish=fn;fn(friendState)},myCode:()=>friendState.code,refresh(){},
    async sendInvite(code){calls.push(['invite',code]);if(code==='999999')throw Error('Não achamos nenhuma fazenda com esse ID.');return 'Convite enviado!'},
    async visit(uid){calls.push(['visit',uid])},async remove(uid){calls.push(['remove',uid]);friendState.friends=friendState.friends.filter(f=>f.uid!==uid);publish(friendState)} }};
   Object.defineProperty(navigator,'clipboard',{value:{async writeText(value){window.copied=value}}});
  });
  await page.addScriptTag({path:path.join(__dirname,'../public/extras.js')});
  await page.waitForFunction(()=>typeof window.publish==='function');
  await page.evaluate(()=>MFFriendsUI.open());
  await page.evaluate(()=>document.fonts.load('600 16px Nunito'));
  assert.equal(await page.evaluate(()=>document.fonts.check('600 16px Nunito')),true);
  const search=page.locator('.mfd-search');
  for(const q of ['baC','#128385','128385']){await search.fill(q);assert.equal(await page.locator('.mfd-friends .row').count(),1);assert.match(await page.locator('.mfd-friends').innerText(),/1º Bacuri/)}
  await search.fill('cabare');assert.match(await page.locator('.mfd-friends').innerText(),/Cabaré/);
  await page.locator('.mfd-clear').click();assert.equal(await search.inputValue(),'');
  await page.locator('.mfd-copy').click();assert.equal(await page.evaluate(()=>copied),'#986568');assert.equal(await page.locator('.mfd-copy').innerText(),'Copiado ✓');
  await page.waitForTimeout(2100);assert.equal(await page.locator('.mfd-copy').innerText(),'Copiar');
  const saved=await page.evaluate(()=>JSON.stringify(save));await page.locator('[data-gift="user0"]').click();assert.equal(await page.locator('#mf-toast').innerText(),'Envio de presentes chega em breve! 🎁');assert.equal(await page.evaluate(()=>JSON.stringify(save)),saved);assert.equal(await page.evaluate(()=>calls.length),0);
  await page.locator('[data-rm="user0"]').click();assert.equal(await page.locator('#mfd-confirm-text').innerText(),'Remover Bacuri dos seus amigos?');await page.locator('.mfd-confirm-cancel').click();assert.equal(await page.evaluate(()=>calls.length),0);
  for(const [value,msg] of [['986568','Esse é o seu ID'],['128385','Esse jogador já é seu amigo'],['999999','ID não encontrado'],['123456','Convite enviado!']]){await page.locator('.mfd-input').fill(value);await page.locator('.mfd-send').click();await page.waitForFunction(t=>document.querySelector('.mfd-msg').textContent===t,msg)}
  await search.fill('#654321');assert.equal(await page.locator('[data-invite="654321"]').count(),1);await page.locator('[data-invite]').click();assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['invite','654321']);
  await page.locator('.mfd-clear').click();
  for(const [width,height] of [[390,844],[320,568],[844,390],[667,375],[1280,800]]){
   await page.setViewportSize({width,height});
   const result=await page.evaluate(()=>{const d=document.querySelector('.mfd'),list=document.querySelector('.mfd-scroll'),title=document.querySelector('.mfd-header'),r=d.getBoundingClientRect();const y=title.getBoundingClientRect().top;list.scrollTop=500;return {width:r.width,height:r.height,x:r.x,y:r.y,outerOverflow:d.scrollHeight-d.clientHeight,listScroll:list.scrollHeight>list.clientHeight,fixed:title.getBoundingClientRect().top===y,bad:[...d.querySelectorAll('button,input,.who')].filter(e=>!e.closest('[hidden]')&&e.getBoundingClientRect().width&& (e.getBoundingClientRect().right>r.right+1||e.getBoundingClientRect().left<r.left-1)).length}});
   assert.ok(result.width<=600&&result.x>=12&&result.height<=height*.85+1,JSON.stringify(result));assert.ok(result.outerOverflow<=1,JSON.stringify(result));assert.ok(result.listScroll&&result.fixed,JSON.stringify(result));assert.equal(result.bad,0,JSON.stringify(result));
   await page.evaluate(()=>document.querySelector('.mfd-scroll').scrollTop=0);
   await page.evaluate(()=>document.querySelector('#mf-toast')?.classList.remove('on'));
   await page.waitForTimeout(250);
   if(width===390||width===844)await page.screenshot({path:`/tmp/friends-${width}.png`});
  }
  await page.locator('[data-rm="user0"]').click();await page.locator('.mfd-confirm-remove').click();assert.equal(await page.locator('[data-rm="user0"]').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: 35 amigos, cinco telas, busca sem acentos/nome/ID, copiar, convites, confirmação e presente sem mudar save.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
