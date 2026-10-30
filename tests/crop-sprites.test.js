import test from 'node:test';import assert from 'node:assert/strict';import '../public/crop-sprites.js';
const project=(x,y)=>({x:(x-y)*48,y:(x+y)*24});
const close=(a,b)=>{assert.ok(Math.abs(a.x-b.x)<.001);assert.ok(Math.abs(a.y-b.y)<.001);};
test('base de cada arte ocupa exatamente seu canteiro, com inversa para o clique',()=>{
 for(const [src,foot]of Object.entries(MFCropSprites.bases)){
  const t={gx:3,gy:4,w:2,h:2},original=structuredClone(t),anchor=project(3.5,4.5),g=MFCropSprites.geometry(t,anchor,src);
  close(g.project(...foot.left),project(2.5,5.5));close(g.project(...foot.front),project(4.5,5.5));close(g.project(...foot.right),project(4.5,3.5));
  for(const [x,y]of [foot.left,foot.front,foot.right,[300,200]]){const p=g.project(x,y),q=g.unproject(p.x,p.y);close(q,{x,y});}
  assert.deepEqual(t,original);
 }
});
test('corredor de um quadrado permanece separado; artes de vizinhos encostam',()=>{
 const src='assets/cultivos-novos/espinafre-final-v3.png',t={gx:0,gy:0,w:2,h:2};
 const a=MFCropSprites.geometry(t,project(.5,.5),src),adjacent=MFCropSprites.geometry({...t,gx:2},project(2.5,.5),src),corridor=MFCropSprites.geometry({...t,gx:3},project(3.5,.5),src);
 close(a.right,project(1.5,-.5));close(a.front,adjacent.left);
 assert.equal(corridor.left.x-adjacent.left.x,48);assert.equal(corridor.left.y-adjacent.left.y,24);
 assert.equal(MFCropSprites.geometry(t,project(.5,.5),'vaca.png'),null);
});
test('todos os arquivos de estágios locais têm base calibrada',async()=>{
 const {readdir}=await import('node:fs/promises');
 for(const dir of ['public/assets','public/assets/cultivos-novos'])for(const name of await readdir(dir)){
  if(/-(inicio|quase|final)(-v3)?\.(png|webp)$/.test(name))assert.ok(MFCropSprites.bases[name],name);
 }
});
