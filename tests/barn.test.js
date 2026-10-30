import test from 'node:test';import assert from 'node:assert/strict';import '../public/barn-core.js';
const c=MFBarnCore;
test('celeiro ocupa 2x3 plantações, gira mantendo centro e tamanho visual e não sobrepõe',()=>{
 const t=c.start(6,6,0,1000),center=[t.gx+(t.w-1)/2,t.gy+(t.h-1)/2];assert.equal(t.w,4);assert.equal(t.h,6);assert.equal(t.w*t.h,6*4);const width=t.w*t.visualScale;
 assert.equal(c.rotate(t,20,20,[t]),true);assert.equal(t.w,6);assert.equal(t.h,4);assert.equal(t.w*t.visualScale,width);assert.deepEqual([t.gx+(t.w-1)/2,t.gy+(t.h-1)/2],center);
 const before=structuredClone(t),obstacle={gx:7,gy:6,w:1,h:1};assert.equal(c.rotate(t,20,20,[t,obstacle]),false);assert.deepEqual(t,before);
 assert.equal(c.fits(c.start(18,18,0),20,20,[]),false);
});
test('obra dura cinco minutos, completa offline e concede cinco estrelas uma única vez',()=>{
 const t=c.start(2,2,0,1000);assert.equal(t.barnReadyAt-t.barnStartedAt,300000);assert.equal(c.sync(t,300999).stars,0);assert.equal(c.stage(t,50000),0);assert.equal(c.stage(t,120000),1);assert.equal(c.stage(t,250000),2);
 const restored=JSON.parse(JSON.stringify(t));assert.equal(c.sync(restored,301000).stars,5);assert.equal(c.sync(restored,401000).stars,0);assert.equal(c.stage(restored,301000),3);assert.match(restored.imgSrc,/celeiro-0.png$/);
});
test('visitar não concede estrelas; mover/guardar preservam recibo e prazo da obra',()=>{
 const t=c.start(3,3,1,1000);assert.equal(c.sync(t,301000,false).stars,0);assert.equal(t.barnXPGranted,false);const stored=JSON.parse(JSON.stringify(t));assert.equal(c.sync(stored,400000,true).stars,5);assert.equal(c.sync(JSON.parse(JSON.stringify(stored)),500000,true).stars,0);
});
