import test from 'node:test';import assert from 'node:assert/strict';import '../public/fences-core.js';
const edge=(gx,gy,axis='x',type='flowers')=>({gx,gy,axis,type});
test('três cercas com preço por trecho; duplicatas e falta de moedas não cobram',()=>{
 const b=MFFenceCore.create();let money=180;
 for(const type of ['flowers','wire','white']){const r=b.place(edge(b.list().length,0,'x',type),20,20,money);assert.equal(r.ok,true);money-=r.cost;}
 assert.equal(money,0);assert.equal(b.place(edge(0,0),20,20,1000).ok,false);assert.equal(b.place(edge(4,0),20,20,money).ok,false);assert.equal(b.list().length,3);
});
test('trechos compartilham postes nas retas e nos cantos nas duas direções',()=>{
 const b=MFFenceCore.create();for(const e of [edge(2,2),edge(3,2),edge(4,2,'y'),edge(4,3,'y')])assert.ok(b.place(e,20,20,1000).ok);
 assert.equal(b.list().length,4);assert.equal(b.posts().length,5);assert.equal(b.posts().find(p=>p.gx===4&&p.gy===2).degree,2);
 const square=MFFenceCore.create();for(const e of [edge(0,0),edge(0,1),edge(0,0,'y'),edge(1,0,'y')])square.place(e,20,20,1000);assert.equal(square.posts().length,4);assert.ok(square.posts().every(p=>p.degree===2));
});
test('bordas da fazenda são permitidas, trechos para fora não',()=>{
 const b=MFFenceCore.create();assert.ok(b.place(edge(19,20),20,20,100).ok);assert.ok(b.place(edge(20,19,'y'),20,20,100).ok);assert.equal(b.place(edge(20,20),20,20,100).ok,false);assert.equal(b.place(edge(-1,0),20,20,100).ok,false);
});
test('mover mantém original se o destino está ocupado; guardar e recolocar não cobram',()=>{
 const b=MFFenceCore.create(),a=edge(2,2),other=edge(3,2);b.place(a,20,20,100);b.place(other,20,20,100);
 assert.equal(b.move(a,other,20,20),false);assert.equal(b.list().length,2);const dest=edge(5,5,'y');assert.equal(b.move(a,dest,20,20),true);assert.equal(b.store(dest),true);assert.equal(b.store(dest),false);assert.equal(b.stock().flowers,1);
 const restored=b.place(edge(7,7),20,20,0,true);assert.deepEqual(restored,{ok:true,cost:0});assert.equal(b.stock().flowers,0);assert.equal(b.place(edge(8,8),20,20,0,true).ok,false);
});
test('save restaura cercas, orientações e estoque, rejeitando entradas inválidas',()=>{
 const b=MFFenceCore.create();b.place(edge(1,1,'y','white'),20,20,100);b.place(edge(2,2,'x','wire'),20,20,100);b.store(edge(2,2,'x','wire'));
 const c=MFFenceCore.create();c.restore(JSON.parse(JSON.stringify(b.capture())));assert.deepEqual(c.capture(),b.capture());c.restore({segments:[edge(100,100),edge(0,0,'invalid')],stock:{white:-1,wire:Infinity}});assert.equal(c.list().length,0);assert.equal(c.stock().wire,0);
});
