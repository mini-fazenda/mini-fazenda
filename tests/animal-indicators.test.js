import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import '../public/animal-production.js';
test('avisos aparecem sem hover, acompanham o animal e somem depois da coleta ou remoção',()=>{
 const nodes=new Map();function element(tag){const el={style:{},children:[],attrs:{},setAttribute(k,v){this.attrs[k]=v;},append(...children){for(const c of children){c.parent=this;this.children.push(c);if(c.id)nodes.set(c.id,c);}},remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}};if(tag==='canvas'){el.getContext=()=>({scale(){},drawImage(){},getImageData:()=>({data:new Uint8Array(64*96*4).fill(255)})});el.toDataURL=()=> 'data:image/png;base64,AA';}return el;}
 const cow={gx:3,gy:3,w:2,h:2,imgSrc:'vaca.gif',animal:{tipo:'vaca',etapa:2,startTime:1,totalTime:1,production:{readyAt:0}}};
 const sheep={...cow,imgSrc:'ovelha.png',gx:5,animal:{tipo:'ovelha',etapa:2,startTime:1,totalTime:1,production:{readyAt:0}}};
 const env={window:{MFAnimalProduction,MFAnimalTools:{draw(){}}},document:{body:element('body'),head:element('head'),createElement:element},MFViewport:{width:800,height:600},canvas:{width:800,height:600,getBoundingClientRect:()=>({left:0,top:0,right:800,bottom:600,width:800,height:600})},terrenos:[cow,sheep],modoMover:false,estruturaMovendo:null,preload:()=>({complete:true,naturalWidth:200,naturalHeight:200}),TILE_W:80,TILE_H:40,offsetX:0,offsetY:0,zoom:1,gridToScreen:(x,y)=>({x:(x-y)*40,y:(x+y)*20}),requestAnimationFrame(){}};
 vm.runInNewContext(fs.readFileSync(new URL('../public/animal-indicators.js',import.meta.url),'utf8'),env);const api=env.window.MFAnimalIndicators,layer=nodes.get('mf-animal-indicators');
 api.update();assert.equal(layer.children.length,2);assert.equal(layer.children[0].attrs['aria-label'],'Leite pronto para coletar');assert.equal(layer.children[1].attrs['aria-label'],'Lã pronto para coletar');
 const x=layer.children[0].style.left;env.offsetX=20;api.update();assert.notEqual(layer.children[0].style.left,x);
 MFAnimalProduction.collect(cow.animal);api.update();assert.equal(layer.children.length,1);
 env.terrenos=[];api.update();assert.equal(layer.children.length,0);
});
