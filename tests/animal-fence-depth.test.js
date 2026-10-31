import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../public/cow-animation.js';
test('animação da vaca preserva duração dos 76 quadros e repete no tempo certo',()=>{
 const c=MFCowAnimation;assert.equal(c.durations.length,76);assert.equal(c.frameIndex(0),0);assert.equal(c.frameIndex(c.durations[0]-1),0);assert.equal(c.frameIndex(c.durations[0]),1);assert.equal(c.frameIndex(c.total-1),75);assert.equal(c.frameIndex(c.total),0);
});
test('vaca e ovelha com cercas usam o canvas sem cópias DOM acima da cerca',()=>{
 const source=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8'),start=source.indexOf('const liveSheep=t.animal?'),end=source.indexOf('  // O PNG do animal',start),code=source.slice(start,end);
 for(const [type,animationReady]of [['vaca',true],['vaca',false],['ovelha',false]]){
  const calls=[],ctx={save(){},restore(){},translate(){},scale(){},drawImage(){calls.push('canvas')}};
  const env={ctx,t:{animal:{tipo:type,etapa:2},imgSrc:'animal.gif'},item:{animal:true},img:{},drawX:1,drawY:2,drawW:30,drawH:40,key:'cow',animalFrame:'frame',anchor:{x:0},window:{MFFences:{count:()=>3},MFCowAnimation:{draw(){if(animationReady)calls.push('animated-canvas');return animationReady}},MFAdapter:{gifPlace(){calls.push('DOM');return true},spritePlace(){calls.push('DOM');return true}}}};
  vm.runInNewContext(code,env);assert.equal(calls.includes('DOM'),false);assert.deepEqual(calls,animationReady?['animated-canvas']:['canvas']);
 }
});
test('atlas da vaca mantém o espelhamento e seleciona o quadro correto no canvas',()=>{
 let atlas;const calls=[];const env={URL,globalThis:null,document:{currentScript:{src:'https://example.com/cow-animation.js'}},Image:class{constructor(){atlas=this;this.complete=true;this.naturalWidth=2168}},performance:{now:()=>0}};env.globalThis=env;
 vm.runInNewContext(fs.readFileSync(new URL('../public/cow-animation.js',import.meta.url),'utf8'),env);
 const g={save(){},restore(){},translate(...a){calls.push(['translate',...a])},scale(...a){calls.push(['scale',...a])},drawImage(...a){calls.push(['draw',...a.slice(1)])}};
 assert.equal(env.MFCowAnimation.draw(g,{animal:{tipo:'vaca',etapa:2,flipped:true}},{x:10,y:20,w:100,h:80},env.MFCowAnimation.durations[0]),true);
 assert.deepEqual(calls,[['translate',110,20],['scale',-1,1],['draw',271,0,271,232,0,0,100,80]]);assert.ok(atlas.src.endsWith('/assets/animais/vaca-atlas.webp'));
});
test('pés da vaca e ovelha ficam entre as cercas traseiras e frontais da área ocupada',()=>{
 const source=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8');const start=source.indexOf('const drawables = [];'),end=source.indexOf('// Player',start);
 const iso=(x,y)=>({x:(x-y)*48,y:(x+y)*24});
 for(const size of [1,2]){
  const t={gx:5,gy:5,w:size,h:size,animal:{tipo:size===1?'ovelha':'vaca'}},env={terrenos:[t],gridToScreen:iso,TILE_H:48,ANIMAL_GROUND_Y:4.8,LAYER_STEP:1,isMFAnimal:()=>true,getFootBaseDepthForTerreno:()=>0,getHeightLayerForTerreno:()=>0,window:{}};
  const [animal]=vm.runInNewContext(source.slice(start,end)+';drawables',env);
  const back=(iso(4.5,4.5).y+iso(5.5,4.5).y)*2/2;
  const front=(iso(5+size-1.5,5+size-.5).y+iso(5+size-.5,5+size-.5).y)*2/2;
  assert.ok(animal.depth>back);assert.ok(animal.depth<front,`animal ${size} à frente da cerca: ${animal.depth} >= ${front}`);
 }
});
test('desenho e prévias preservam a posição anterior dos animais sem alterar coordenadas',()=>{
 const source=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
 const lines=source.split('\n').filter(line=>line.includes('const drawY = anchor.y - drawH +'));
 assert.equal(lines.length,3);
 for(const line of lines){
  const animal={animal:{tipo:'ovelha'}},env={anchor:{y:100},drawH:80,TILE_H:48,t:animal,estruturaMovendo:animal,placingItem:animal,window:{},isMFAnimal:()=>true,ANIMAL_GROUND_Y:4.8};
  const y=vm.runInNewContext(line+';drawY',env);assert.ok(Math.abs(y-63.2)<1e-9);
 }
});
