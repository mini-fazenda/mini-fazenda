import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import '../public/farm-boundary.js';import '../public/fences-core.js';
test('a divisória usa a borda real do terreno e acompanha expansões retangulares',()=>{
 const first=MFFarmBoundary.corners(20,20);assert.deepEqual(first,[{x:0,y:-24},{x:960,y:456},{x:0,y:936},{x:-960,y:456}]);
 const expanded=MFFarmBoundary.corners(25,23);assert.deepEqual(expanded[2],{x:96,y:1128});assert.deepEqual(expanded[3],{x:-1104,y:528});
 const points=[],strokes=[];const g={save(){},restore(){},beginPath(){},moveTo(x,y){points.push([x,y])},lineTo(x,y){points.push([x,y])},closePath(){},fill(){},stroke(){strokes.push(this.lineWidth)},setLineDash(){}};
 MFFarmBoundary.draw(g,25,23,.25);assert.deepEqual(points,expanded.map(p=>[p.x,p.y]));assert.deepEqual(strokes,[16,8]);
});
test('arte separa trilhos por orientação e compartilha um único poste em cada canto',()=>{
 const calls=[];let atlas;
 const env={URL,window:{},Image:class{constructor(){atlas=this;this.complete=true;this.naturalWidth=240;}},document:{currentScript:{src:'https://example.com/farm/fence-art.js'},createElement(){return {getContext:()=>({drawImage(...a){calls.push(a)}})};}}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/fence-art.js',import.meta.url),'utf8'),env);atlas.onload();
 const output=[],g={drawImage(...a){output.push(a)}};
 env.window.MFFenceArt.rail(g,{axis:'y',type:'flowers'},{x:100,y:200});env.window.MFFenceArt.rail(g,{axis:'x',type:'flowers'},{x:100,y:200});env.window.MFFenceArt.post(g,{type:'white'},{x:100,y:200});
 assert.deepEqual(calls.map(c=>[c[1],c[2]]),[[0,0],[80,0],[160,200]]);
 assert.deepEqual(output.map(o=>o.slice(1)),[[36,145],[85,145],[60,115]]);
 const board=MFFenceCore.create();for(const e of [{gx:0,gy:0,axis:'x'},{gx:0,gy:1,axis:'x'},{gx:0,gy:0,axis:'y'},{gx:1,gy:0,axis:'y'}])board.place({...e,type:'flowers'},20,20,1000);
 assert.equal(board.posts().length,4);
 for(const item of Object.values(MFFenceCore.catalog))assert.ok(fs.existsSync(new URL('../public/'+item.icon,import.meta.url)));
});

test('postes nas quatro bordas ficam dentro do terreno sem mudar arestas salvas',()=>{
 for(const [cols,rows] of [[20,20],[32,32],[25,23]])for(const gx of [0,cols])for(const gy of [0,rows]){
  const p=MFFenceCore.visualPoint({gx,gy},cols,rows),x=(p.x/48+p.y/24)/2+.5,y=(p.y/24-p.x/48)/2+.5;
  assert.equal(x,gx===0?.25:cols-.25);assert.equal(y,gy===0?.25:rows-.25);
 }
 assert.deepEqual(MFFenceCore.visualPoint({gx:5,gy:6},20,20),{x:-48,y:240});
 const board=MFFenceCore.create();board.place({gx:20,gy:5,axis:'y',type:'white'},20,20,1000);
 assert.deepEqual(board.list(),[{gx:20,gy:5,axis:'y',type:'white'}]);
});
