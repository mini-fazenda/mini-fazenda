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
