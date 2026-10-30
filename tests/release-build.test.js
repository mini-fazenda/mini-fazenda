import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
test('publicação identifica host/jogo e versiona todos os scripts, estilos e imports locais',()=>{
 const dir=mkdtempSync(join(tmpdir(),'mf-release-'));
 try{
  const html='<head><script src="a.js?v=old"></script><link href="a.css"><script src="https://www.gstatic.com/firebasejs/12.5.0/firebase.js"></script></head>';
  for(const file of ['index.html','game.html'])writeFileSync(join(dir,file),html);
  writeFileSync(join(dir,'a.js'),"import {x} from './b.js?v=old';\nimport './c.js';");
  execFileSync('python3',['scripts/stamp-release.py',dir,'test123']);
  for(const file of ['index.html','game.html']){
   const s=readFileSync(join(dir,file),'utf8');assert.ok(s.includes('window.MF_BUILD_VERSION="test123"'));assert.ok(s.includes('a.js?v=test123'));assert.ok(s.includes('a.css?v=test123'));assert.ok(s.includes('firebasejs/12.5.0/firebase.js'));
  }
  const js=readFileSync(join(dir,'a.js'),'utf8');assert.ok(js.includes('./b.js?v=test123'));assert.ok(js.includes('./c.js?v=test123'));
  execFileSync('python3',['scripts/stamp-release.py',dir,'test456']);
  assert.equal((readFileSync(join(dir,'index.html'),'utf8').match(/id="mf-release"/g)||[]).length,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
