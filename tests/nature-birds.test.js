import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../public/birds.js';
import '../public/nature-assets.js';

test('pássaros percorrem voo, planeio e pouso sem saltar nas transições',()=>{
 const b={a:{gx:2,gy:12},b:{gx:17,gy:5},color:0,offset:0};
 assert.equal(MFBirds.sample(0,b).state,'chao');
 for(const [t,state] of [[8000,'decolando'],[12000,'voando'],[17000,'planando'],[20500,'pousando'],[23000,'chao']])assert.equal(MFBirds.sample(t,b).state,state);
 for(let t=0;t<48000;t+=25){const a=MFBirds.sample(t,b),c=MFBirds.sample(t+25,b);assert.ok(Math.hypot(a.x-c.x,a.y-c.y,a.height-c.height)<3);assert.ok(a.pose>=0&&a.pose<23);}
 assert.deepEqual(MFBirds.sample(0,b),MFBirds.sample(48000,b));
 assert.equal(MFBirds.sample(12000,b).facing,-MFBirds.sample(36000,b).facing);
});
test('pousos evitam objetos e plantações e não modificam a fazenda',()=>{
 const objects=[{gx:2,gy:12,w:2,h:2,cultura:{tipo:'arroz'}},{gx:6,gy:8,w:2,h:2}];
 const before=JSON.stringify(objects),routes=MFBirds.routes(20,20,objects);
 assert.equal(routes.length,4);assert.deepEqual(routes.map(b=>b.color),[0,1,0,1]);
 for(const b of routes)for(const p of [b.a,b.b])assert.equal(MFBirds.occupied(p,objects),false);
 assert.equal(JSON.stringify(objects),before);
});
test('arroz salvo recebe somente arte nova, mantendo relógio, quantidade e saldo',()=>{
 const culture={tipo:'arroz',etapa:1,startTime:123,totalTime:86400000};
 const data={moedas:12345,terrenos:[{cultura:culture,imgSrc:'assets/plantas/arroz-quase.png'}],inventory:{arroz:{count:7,imgSrc:'assets/plantas/arroz-icone.png'},leite:{count:3,imgSrc:'leite.png'}}};
 MFNatureAssets.normalizeState(data);assert.equal(data.moedas,12345);assert.equal(data.terrenos[0].cultura,culture);assert.equal(data.terrenos[0].imgSrc,'assets/natureza/arroz-quase.png');assert.equal(data.inventory.arroz.count,7);assert.equal(data.inventory.leite.imgSrc,'leite.png');
});
test('atlas carregado desenha os quatro pássaros no compositor existente, sem capturar o mouse',()=>{
 let atlas,created=0;const placements=[];
 const env={URL,console,Image:class{constructor(){atlas=this;}},document:{currentScript:{src:'https://example.com/farm/birds.js'},createElement(){created++;return {getContext:()=>({drawImage(){}}),toDataURL:()=>`frame-${created}`};}},COLS:20,ROWS:20,terrenos:[],window:{MFAmbient:{enabled:()=>true},MFAdapter:{spritePlace(...args){placements.push(args)},flush(){}}}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/birds.js',import.meta.url),'utf8'),env);assert.equal(atlas.src,'https://example.com/farm/assets/natureza/passaros.png');atlas.onload();
 const g={save(){},restore(){},beginPath(){},ellipse(){},fill(){}};env.window.MFBirds.draw(g,12000);assert.equal(placements.length,4);assert.ok(placements.some(p=>p[7]===2000));assert.equal(created,48);
});
