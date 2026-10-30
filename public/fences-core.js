/* Cercas vivem nas arestas da grade: um trecho e um poste por posição. */
(function(root){
 const catalog={flowers:{name:'Cerca de madeira com flores',price:50,id:'item-cerca-flores',icon:'assets/cercas/flores.svg'},wire:{name:'Cerca de madeira com arame',price:50,id:'item-cerca-arame',icon:'assets/cercas/arame.svg'},white:{name:'Cerca branca',price:80,id:'item-cerca-branca',icon:'assets/cercas/branca.svg'}};
 const key=e=>`${e.axis}:${e.gx}:${e.gy}`;
 const valid=e=>!!e&&!!catalog[e.type]&&['x','y'].includes(e.axis)&&Number.isSafeInteger(e.gx)&&Number.isSafeInteger(e.gy)&&e.gx>=0&&e.gy>=0&&e.gx<=100&&e.gy<=100;
 const ends=e=>[{gx:e.gx,gy:e.gy},{gx:e.gx+(e.axis==='x'?1:0),gy:e.gy+(e.axis==='y'?1:0)}];
 const fits=(e,cols,rows)=>valid(e)&&ends(e).every(p=>p.gx<=cols&&p.gy<=rows);
 function create(){const edges=new Map(),stock={flowers:0,wire:0,white:0};return {
 list:()=>[...edges.values()].map(e=>({...e})),stock:()=>({...stock}),
 canPlace(e,cols,rows,except){return fits(e,cols,rows)&&(!edges.has(key(e))||key(e)===except);},
 place(e,cols,rows,coins,fromStock=false){
  if(!this.canPlace(e,cols,rows))return {ok:false,reason:'Já existe uma cerca aqui ou o trecho está fora da fazenda.'};
  const cost=fromStock?0:catalog[e.type].price;
  if(fromStock?stock[e.type]<1:coins<cost)return {ok:false,reason:fromStock?'Nenhuma cerca guardada.':'Moedas insuficientes.'};
  edges.set(key(e),{type:e.type,axis:e.axis,gx:e.gx,gy:e.gy});if(fromStock)stock[e.type]--;return {ok:true,cost};
 },
 move(original,dest,cols,rows){const old=key(original);if(!edges.has(old)||!this.canPlace(dest,cols,rows,old))return false;const type=edges.get(old).type;edges.delete(old);edges.set(key(dest),{type,axis:dest.axis,gx:dest.gx,gy:dest.gy});return true;},
 store(e){const k=key(e),item=edges.get(k);if(!item)return false;stock[item.type]++;edges.delete(k);return true;},
 posts(){const posts=new Map();for(const e of edges.values())for(const p of ends(e)){const k=p.gx+':'+p.gy,node=posts.get(k)||{...p,type:e.type,degree:0};node.degree++;if(e.type==='white')node.type='white';posts.set(k,node);}return [...posts.values()];},
 capture(){return {segments:this.list(),stock:{...stock}};},
 restore(data){edges.clear();for(const e of (Array.isArray(data?.segments)?data.segments:[]))if(fits(e,100,100))edges.set(key(e),{type:e.type,axis:e.axis,gx:e.gx,gy:e.gy});for(const t of Object.keys(stock))stock[t]=Number.isSafeInteger(data?.stock?.[t])?Math.max(0,data.stock[t]):0;}
 };}
 root.MFFenceCore={catalog,key,ends,fits,create};
})(globalThis);
