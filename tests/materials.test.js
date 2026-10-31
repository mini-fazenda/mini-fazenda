import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import '../public/materials-core.js';
test('presente com recibo entra uma vez, inclusive após reconexão',()=>{
 const s=MFMaterialsCore.create();assert.equal(s.grant({madeira:4,telha:2,feno:1},'gift:abc'),true);assert.equal(s.grant({madeira:4,telha:2,feno:1},'gift:abc'),false);const restored=MFMaterialsCore.create(JSON.parse(JSON.stringify(s.capture())));assert.equal(restored.grant({madeira:4},'gift:abc'),false);assert.deepEqual(restored.counts(),{madeira:4,telha:2,feno:1});
});
test('debita materiais atomicamente e rejeita quantidades ou materiais inválidos',()=>{
 const s=MFMaterialsCore.create();for(const b of [{madeira:-1},{madeira:1.5},{madeira:Infinity},{moedas:999},{constructor:1}])assert.equal(s.grant(b,'bad'),false);
 s.grant({madeira:4,telha:1},'ok');const before=s.capture();assert.equal(s.spend({madeira:4,telha:2}),false);assert.deepEqual(s.capture(),before);assert.equal(s.spend({madeira:2,telha:1}),true);assert.deepEqual(s.counts(),{madeira:2,telha:0,feno:0});
});
test('contrato de presentes bloqueia visitas e preserva os recibos',()=>{
 let visit=true,changed=0;const env={MFMaterialsCore,window:{MFHost:{isVisiting:()=>visit,changed(){changed++}}},requestRedraw(){}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/materials.js',import.meta.url),'utf8'),env);const api=env.window.MFMaterials;assert.equal(api.receiveGift({id:'a',materials:{feno:2}}),false);visit=false;assert.equal(api.receiveGift({id:'a',materials:{feno:2}}),true);assert.equal(api.receiveGift({id:'a',materials:{feno:2}}),false);assert.equal(changed,1);assert.equal(api.counts().feno,2);
});
test('prêmio de nível inclui materiais e desfaz o crédito se o restante do resgate falhar',()=>{
 const source=fs.readFileSync(new URL('../public/level-rewards.js',import.meta.url),'utf8'),start=source.indexOf('function grant(r,bonus)'),end=source.indexOf(' const style=',start),stock=MFMaterialsCore.create();let fail=true;
 const env={moedas:100,moedasSpan:{},model:{current:()=>({level:3})},MFMaterials:stock,MFObjects:{capture:()=>[],restore(){}},MFFences:{capture:()=>({}),restore(){}},getInventorySimpleSnapshot:()=>({}),restoreInventoryFromSimple(){},window:{MFMaterials:stock,MFValueSource:{actor(){if(fail)throw Error('efeito')}}}};
 vm.createContext(env);vm.runInContext(source.slice(start,end),env);assert.throws(()=>env.grant({kind:'material',id:'madeira',qty:2},100));assert.equal(stock.counts().madeira,0);assert.equal(env.moedas,100);
 fail=false;env.grant({kind:'material',id:'madeira',qty:2},100);assert.equal(stock.counts().madeira,2);assert.equal(env.moedas,200);assert.throws(()=>env.grant({kind:'material',id:'madeira',qty:2},100));assert.equal(stock.counts().madeira,2);assert.equal(env.moedas,200);
});
