import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/save-runtime.js';
const project={items:{'item-milho':{lootIcon:'milho-atual.png'},'item-vaca':{adultImg:'vaca-atual.gif',visualScale:.7},'item-casa':{imgSrc:'casa-atual.png',w:6,h:6,visualScale:1.5}}};
test('save antigo atualiza configuração sem apagar progresso ou alterar o original',()=>{
 const old={moedas:12345,playerXP:345,COLS:25,ROWS:23,player:{gx:5,gy:7,speed:999,scale:10,path:[{gx:6,gy:7}]},aradora:{gx:4,gy:5,spawned:true,velocidade:99},terrenos:[{gx:3,gy:4,itemId:'item-casa',w:2,h:2,imgSrc:'antiga.png',visualScale:9},{gx:7,gy:6,animal:{tipo:'vaca',etapa:2,startTime:1,totalTime:300,production:{readyAt:98765}},imgSrc:'velha.gif'}],inventory:{milho:{count:25,imgSrc:'velho.png'}},truckOrder:{aberto:true,pedidos:[{tipo:'milho',qtd:10,entregue:3}],recompensa:200},storedObjects:[{itemId:'item-casa',imgSrc:'antiga.png',w:2,h:2}],dailyRewards:{claimed:3},custom:{keep:true}};
 const original=structuredClone(old),next=MFSaveRuntime.refresh(old,project);
 assert.deepEqual(old,original);assert.equal(next.moedas,12345);assert.equal(next.playerXP,345);
 assert.deepEqual(next.player,{gx:5,gy:7,path:[{gx:6,gy:7}]});assert.equal(next.aradora.spawned,true);assert.equal(next.aradora.velocidade,undefined);
 assert.equal(next.terrenos[0].imgSrc,'casa-atual.png');assert.equal(next.terrenos[0].w,2);assert.equal(next.terrenos[0].gx,3);
 assert.equal(next.terrenos[1].imgSrc,'vaca-atual.gif');assert.deepEqual(next.terrenos[1].animal,old.terrenos[1].animal);
 assert.equal(next.inventory.milho.count,25);assert.equal(next.inventory.milho.imgSrc,'milho-atual.png');
 assert.equal(next.truckOrder.aberto,false);assert.equal(next.truckOrder.pedidos[0].entregue,3);
 assert.deepEqual(next.dailyRewards,old.dailyRewards);assert.deepEqual(next.custom,old.custom);
 assert.equal(next.storedObjects[0].imgSrc,'casa-atual.png');assert.deepEqual(MFSaveRuntime.refresh(next,project),next);
});
test('não troca terra em cultivo, relógios, arte dinâmica do celeiro nem objetos desconhecidos',()=>{
 const old={terrenos:[{cultura:{tipo:'milho',startTime:123,totalTime:456},imgSrc:'estagio.png'},{itemId:'item-celeiro',barnStartedAt:100,imgSrc:'obra.svg'},{itemId:'desconhecido',imgSrc:'preservar.png'}]};
 const next=MFSaveRuntime.refresh(old,project);assert.deepEqual(next.terrenos[0].cultura,old.terrenos[0].cultura);assert.equal(next.terrenos[0].imgSrc,'estagio.png');assert.equal(next.terrenos[0].itemId,'item-milho');assert.deepEqual(next.terrenos.slice(1),old.terrenos.slice(1));
});
