import test from 'node:test';import assert from 'node:assert/strict';import '../public/plot-ground.js';
test('solo une apenas bordas compartilhadas, incluindo contato parcial',()=>{
 let fills=0;const g={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){fills++;}};
 const a={gx:0,gy:0,w:2,h:2,cultura:'melancia'},project=(x,y)=>({x:(x-y)*48,y:(x+y)*24});
 MFPlotGround.drawJoins(g,[a,{...a,gx:3}],project);assert.equal(fills,0);
 MFPlotGround.drawJoins(g,[a,{...a,gx:2}],project);assert.equal(fills,1);
 MFPlotGround.drawJoins(g,[a,{...a,gx:2,gy:1}],project);assert.equal(fills,2);
 MFPlotGround.drawJoins(g,[a,{...a,gx:2,gy:2}],project);assert.equal(fills,2);
 MFPlotGround.drawJoins(g,[a,{...a,gx:2}],project,a);assert.equal(fills,2);
});

test('reutiliza a geometria dos encontros de canteiros quando a câmera se move',()=>{
 let calls=0,fills=0;
 const g={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){fills++;}};
 const project=(x,y)=>{calls++;return {x:(x-y)*48,y:(x+y)*24};};
 const plots=[];
 for(let y=0;y<24;y++)for(let x=0;x<24;x++)plots.push({gx:x*2,gy:y*2,w:2,h:2,cultura:{tipo:'milho'}});
 MFPlotGround.drawJoins(g,plots,project);
 const firstCalls=calls,firstFills=fills;
 assert.ok(firstFills>500,'o conjunto deve criar diversas ligações');
 assert.ok(firstCalls<=firstFills*4,'a indexação não deve pesquisar todas as combinações do mapa');
 MFPlotGround.drawJoins(g,plots,project);
 assert.equal(calls,firstCalls,'não recalcular pontos quando apenas a câmera mudou');
 assert.equal(fills,firstFills*2,'desenhar as mesmas conexões, sem perder geometria');
 plots[0].gx=-2;
 MFPlotGround.drawJoins(g,plots,project);
 assert.ok(calls>firstCalls,'movimentar um canteiro deve invalidar o cache');
});
