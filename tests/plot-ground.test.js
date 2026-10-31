import test from 'node:test';import assert from 'node:assert/strict';import '../public/plot-ground.js';
const project=(x,y)=>({x:(x-y)*48,y:(x+y)*24});
test('canteiros vizinhos compartilham toda a borda do chão sem alterar coordenadas',()=>{
 const a={gx:3,gy:4,w:2,h:2,cultura:{tipo:'espinafre'}},original=structuredClone(a),p=MFPlotGround.corners(a,project);
 const right=MFPlotGround.corners({...a,gx:5},project),left=MFPlotGround.corners({...a,gy:6},project);
 assert.deepEqual([p[1],p[2]],[right[0],right[3]]);assert.deepEqual([p[2],p[3]],[left[1],left[0]]);assert.deepEqual(a,original);
 assert.equal(p[1].x-p[3].x,192);assert.equal(p[2].y-p[0].y,96);
});
test('somente plantações e solo recebem base; animais, árvores e construções ficam livres',()=>{
 for(const t of [{cultura:{tipo:'melancia'}},{imgSrc:'assets/terra-arada.png'},{imgSrc:'assets/terra-seca.png'}])assert.equal(MFPlotGround.isPlot(t),true);
 for(const t of [{animal:{tipo:'vaca'}},{fruitTree:{}},{itemId:'item-celeiro',imgSrc:'celeiro.png'},null])assert.equal(MFPlotGround.isPlot(t),false);
});
test('escala92% mantém centro e deixa4% em cada lado, nas duas diagonais',()=>{const t={gx:3,gy:4,w:2,h:2,cultura:{tipo:'cenoura'}},original=structuredClone(t),full=MFPlotGround.corners(t,project),small=MFPlotGround.visualCorners(t,project),center=project(3.5,4.5);assert.equal(PLOT_VISUAL_SCALE,.92);for(let i=0;i<4;i++){assert.ok(Math.abs(small[i].x-center.x-(full[i].x-center.x)*.92)<1e-9);assert.ok(Math.abs(small[i].y-center.y-(full[i].y-center.y)*.92)<1e-9);}assert.deepEqual(MFPlotGround.visualCorners(t,project,1),full);assert.deepEqual(t,original);const b=MFPlotGround.visualCorners({...t,gx:5},project),c=MFPlotGround.visualCorners({...t,gy:6},project);assert.ok(Math.abs(Math.hypot(small[2].x-b[3].x,small[2].y-b[3].y)-Math.hypot(small[2].x-c[1].x,small[2].y-c[1].y))<1e-8);});
test('pontes de solo não fecham os corredores quando a escala é menor que1',()=>{let saves=0;MFPlotGround.drawJoins({save(){saves++;}},[{gx:0,gy:0,w:2,h:2,cultura:{}}],project);assert.equal(saves,0);});
