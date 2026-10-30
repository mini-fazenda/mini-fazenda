/* Arte fornecida pelo jogador: grama, vegetação e arroz. Sem alterar economia ou save. */
(function(root){
 'use strict';
 const rects={"oak":[6,6,144,182],"dark":[262,6,113,166],"pine":[518,6,98,191],"gold":[774,6,109,167],"apple":[6,262,128,163],"orange":[262,262,120,164],"palm":[518,262,171,199],"palms":[774,262,244,194],"bush":[6,518,110,93],"bushFlowers":[262,518,113,81],"bushLight":[518,518,117,92],"rock":[774,518,169,80],"rockFlowers":[6,774,219,100],"flower":[262,774,101,55],"flowerPink":[518,774,95,68],"tuft":[774,774,85,72]};
 const rice=['assets/natureza/arroz-inicio.png','assets/natureza/arroz-quase.png','assets/natureza/arroz-final.png'];
 let revision=0,atlas,grass;const sprites=new Map();
 function changed(){revision++;sprites.clear();root.MFAmbient?.refreshSprites?.();root.MFAdapter?.flush?.();}
 function sprite(name,height){
  if(!atlas?.complete||!atlas.naturalWidth||!rects[name])return null;
  const key=name+':'+height;if(sprites.has(key))return sprites.get(key);
  const [x,y,w,h]=rects[name],c=document.createElement('canvas');c.width=w;c.height=h;
  c.getContext('2d').drawImage(atlas,x,y,w,h,0,0,w,h);
  const width=height*w/h,result={c,w:width,h:height,ax:width/2,ay:height-3};sprites.set(key,result);return result;
 }
 function ground(b,view){
  if(!grass?.complete||!grass.naturalWidth)return false;
  const pattern=b.createPattern(grass,'repeat');if(!pattern)return false;
  b.fillStyle=pattern;b.fillRect(view.l-200,view.t-200,view.r-view.l+400,view.b-view.t+400);return true;
 }
 function srcFor(t){return t?.cultura?.tipo==='arroz'?rice[Math.max(0,Math.min(2,t.cultura.etapa||0))]:null;}
 function normalizeState(data){
  for(const t of data?.terrenos||[])if(t.cultura?.tipo==='arroz')t.imgSrc=srcFor(t);
  for(const item of Object.values(data?.inventory||{}))if(typeof item.imgSrc==='string'&&/assets\/plantas\/arroz-/.test(item.imgSrc))item.imgSrc='assets/natureza/arroz-icone.png';
 }
 root.MFNatureAssets={sprite,ground,srcFor,normalizeState,signature:()=>revision,groundReady:()=>!!(grass?.complete&&grass.naturalWidth)};
 if(typeof document==='undefined')return;
 const base=new URL('./assets/natureza/',document.currentScript.src);
 atlas=new Image();atlas.onload=changed;atlas.src=new URL('vegetacao.png',base).href;
 grass=new Image();grass.onload=changed;grass.src=new URL('grama.png',base).href;
})(typeof window==='undefined'?globalThis:window);
