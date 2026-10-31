/* Dois quadradinhos por animal; tamanho da arte separado da ocupação. */
(function(root){
 const scales={vaca:.7,ovelha:.45,cavalo:.75,bodejunino:.6,porco:.63};
 const typeOf=t=>t?.animal?.tipo||String(t?.itemId||t?.id||t?.catalogId||'').replace(/^item-/,'');
 function normalize(t){const type=typeOf(t);if(!Object.hasOwn(scales,type)||t.cultura||t.fruitTree||t.pigsty)return false;
  const changed=t.w!==2||t.h!==1||t.visualScale!==scales[type];t.w=2;t.h=1;t.visualScale=scales[type];return changed;
 }
 function applyCatalog(items,doc){for(const [type,visualScale]of Object.entries(scales)){
  const id='item-'+type;items[id]||={};Object.assign(items[id],{w:2,h:1,visualScale});
  const card=doc?.getElementById(id);if(card)Object.assign(card.dataset,{w:'2',h:'1',visualscale:String(visualScale)});
 }}
 root.MFAnimalLayout={normalize,applyCatalog,typeOf,scales};
})(globalThis);
