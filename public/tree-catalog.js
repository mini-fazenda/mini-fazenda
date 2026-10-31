/* Árvores permanentes: catálogo, validação e mensagens. */
(()=>{
 const core=MFFruitTrees,newTypes=Object.entries(core.types).filter(([,c])=>c.directCoins);
 const message=document.createElement('div');message.id='mf-tree-notice';message.setAttribute('role','status');message.hidden=true;Object.assign(message.style,{position:'fixed',bottom:'18px',left:'50%',transform:'translateX(-50%)',maxWidth:'60vw',padding:'9px 15px',background:'#fff0c9',border:'2px solid #89572e',borderRadius:'12px',color:'#51351e',font:'16px Arial',zIndex:75000,pointerEvents:'none',textAlign:'center'});document.body.append(message);let timer;
 function notice(text){message.textContent=text;message.hidden=false;clearTimeout(timer);timer=setTimeout(()=>message.hidden=true,3500);}
 for(const [type,c]of newTypes){const id='item-arvore-'+type;
  const description=`Produz novamente a cada ${c.minutes} minutos. Lucro: ${c.saleCoins} moedas por colheita. XP: +${c.plantXP} ao plantar, +${c.stars} por colheita. Ocupa 2×2 blocos e produz para sempre.`;
  MFAdapter.project.items[id]={name:c.treeName,category:'arvores',type:'proprio',price:c.price,xp:c.plantXP,level:c.level,w:2,h:2,imgSrc:c.stages[0],icon:c.stages[2],growTime:c.cycle,visualScale:1,description};
  document.getElementById(id)?.remove();const card=document.createElement('div');card.className='card-item';card.id=id;Object.assign(card.dataset,{category:'arvores',tipo:'proprio',preco:String(c.price),xp:String(c.plantXP),nivel:String(c.level),w:'2',h:'2',img:c.stages[0]});card.innerHTML='<span>'+c.treeName+'</span><img src="'+c.stages[2]+'">';
  card.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();if(window.MFHost?.isVisiting?.())return;if(playerLevel<c.level){notice('Libera no nível '+c.level);return;}if(moedas<c.price){notice('Moedas insuficientes');return;}setFarmMoveMode(false);placingItem={id,tipo:'proprio',price:c.price,xp:c.plantXP,w:2,h:2,imgSrc:c.stages[0],visualScale:1};selectedItem={...placingItem};modoColocar='placing';preview.active=true;preview.img=preload(c.stages[0]);requestRedraw();};document.getElementById('cards-grid').append(card);
  c.stages.forEach(preload);
 }
 const spawn=trySpawnProprioAt;trySpawnProprioAt=function(gx,gy,...rest){const c=core.types[String(placingItem?.id).replace('item-arvore-','')];if(!c?.directCoins)return spawn(gx,gy,...rest);if(window.MFHost?.isVisiting?.()||playerLevel<c.level||moedas<c.price)return false;
  const fits=gx>=0&&gy>=0&&gx+2<=COLS&&gy+2<=ROWS&&!terrenos.some(t=>gx<t.gx+t.w&&gx+2>t.gx&&gy<t.gy+t.h&&gy+2>t.gy);
  if(!fits){notice('Precisa de um espaço livre de 2x2 para plantar esta árvore.');return false;}return spawn(gx,gy,...rest);
 };
 setInterval(()=>{if(window.MFHost?.isVisiting?.())return;for(const t of terrenos){if(window.MFAnimalProduction?.repair(t,window.MFAdapter?.project?.items))window.MFHost?.changed?.('animal-identity-repair');const s=core.state(t);if(!s?.directCoins||!s.ready||t.fruitTree.readyNotified)continue;t.fruitTree.readyNotified=true;notice('Sua '+s.treeName+' está pronta para colher!');window.MFHost?.changed?.('tree-ready');}},1000);
 const cropDraw=MFCropSprites.drawSprite,cropHit=MFCropSprites.hit;
 function geometry(t,img,a){const w=TILE_W*2,h=w*img.naturalHeight/img.naturalWidth;return {x:a.x-w/2,y:a.y-h*(300/320),w,h,root:{x:a.x,y:a.y}};}
 MFCropSprites.drawSprite=function(ctx,t,a,img){if(!core.config(t))return cropDraw(ctx,t,a,img);const b=geometry(t,img,a);ctx.drawImage(img,b.x,b.y,b.w,b.h);return true;};
 MFCropSprites.hit=function(t,img,x,y,a){if(!core.config(t))return cropHit(t,img,x,y,a);const b=geometry(t,img,a);if(x<b.x||x>=b.x+b.w||y<b.y||y>=b.y+b.h)return false;try{const c=document.createElement('canvas');c.width=c.height=1;const g=c.getContext('2d');g.drawImage(img,(x-b.x)/b.w*img.naturalWidth,(y-b.y)/b.h*img.naturalHeight,1,1,0,0,1,1);return g.getImageData(0,0,1,1).data[3]>40;}catch(_){return true;}};
 const legacy=core.types.acerola,acerolaCard=document.getElementById('item-arvore-acerola');if(acerolaCard){acerolaCard.dataset.img=legacy.stages[0];acerolaCard.querySelector('img').src=legacy.stages[2];Object.assign(MFAdapter.project.items['item-arvore-acerola'],{imgSrc:legacy.stages[0],icon:legacy.stages[2]});}window.MFTreeCatalog={notice,geometry};
})();
