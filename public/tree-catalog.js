/* Árvores permanentes: catálogo, validação e mensagens. */
(()=>{
 const core=MFFruitTrees,newTypes=Object.entries(core.types).filter(([,c])=>c.directCoins);
 const message=document.createElement('div');message.id='mf-tree-notice';message.setAttribute('role','status');message.hidden=true;Object.assign(message.style,{position:'fixed',bottom:'18px',left:'50%',transform:'translateX(-50%)',maxWidth:'60vw',padding:'9px 15px',background:'#fff0c9',border:'2px solid #89572e',borderRadius:'12px',color:'#51351e',font:'16px Arial',zIndex:75000,pointerEvents:'none',textAlign:'center'});document.body.append(message);let timer;
 function notice(text){message.textContent=text;message.hidden=false;clearTimeout(timer);timer=setTimeout(()=>message.hidden=true,3500);}
 for(const [type,c]of newTypes){const id='item-arvore-'+type;
  const description=`Produz a cada ${c.minutes} min. Lucro: ${c.saleCoins} moedas por colheita. XP: +${c.plantXP} ao plantar, +${c.stars} por colheita. Ocupa 2×2 blocos e produz para sempre.`;
  MFAdapter.project.items[id]={name:c.treeName,category:'arvores',type:'proprio',price:c.price,xp:c.plantXP,level:c.level,w:2,h:2,imgSrc:c.stages[0],icon:c.stages[2],growTime:c.cycle,visualScale:1,description};
  const card=document.createElement('div');card.className='card-item';card.id=id;Object.assign(card.dataset,{category:'arvores',tipo:'proprio',preco:String(c.price),xp:String(c.plantXP),nivel:String(c.level),w:'2',h:'2',img:c.stages[0]});card.innerHTML='<span>'+c.treeName+'</span><img src="'+c.stages[2]+'">';
  card.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();if(window.MFHost?.isVisiting?.())return;if(playerLevel<c.level){notice('Libera no nível '+c.level);return;}if(moedas<c.price){notice('Moedas insuficientes');return;}setFarmMoveMode(false);placingItem={id,tipo:'proprio',price:c.price,xp:c.plantXP,w:2,h:2,imgSrc:c.stages[0],visualScale:1};selectedItem={...placingItem};modoColocar='placing';preview.active=true;preview.img=preload(c.stages[0]);requestRedraw();};document.getElementById('cards-grid').append(card);
  c.stages.forEach(preload);
 }
 const spawn=trySpawnProprioAt;trySpawnProprioAt=function(gx,gy,...rest){const c=core.types[String(placingItem?.id).replace('item-arvore-','')];if(!c?.directCoins)return spawn(gx,gy,...rest);if(window.MFHost?.isVisiting?.()||playerLevel<c.level||moedas<c.price)return false;
  const fits=gx>=0&&gy>=0&&gx+2<=COLS&&gy+2<=ROWS&&!terrenos.some(t=>gx<t.gx+t.w&&gx+2>t.gx&&gy<t.gy+t.h&&gy+2>t.gy);
  if(!fits){notice('Precisa de um espaço livre de 2x2 para plantar esta árvore.');return false;}return spawn(gx,gy,...rest);
 };
 setInterval(()=>{if(window.MFHost?.isVisiting?.())return;for(const t of terrenos){const s=core.state(t);if(!s?.directCoins||!s.ready||t.fruitTree.readyNotified)continue;t.fruitTree.readyNotified=true;notice('Sua '+s.treeName+' está pronta para colher!');window.MFHost?.changed?.('tree-ready');}},1000);
 window.MFTreeCatalog={notice};
})();
