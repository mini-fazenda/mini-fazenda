/* A espécie e o custo pertencem ao pedido de plantio, nunca à seleção seguinte. */
(function(root){
 function snapshot(item){
  if(!item||!/^item-[a-z0-9-]+$/.test(item.id||''))return null;
  const price=Number(item.price);if(!Number.isFinite(price)||price<0)return null;
  return {id:item.id,price,xp:Number(item.xp)||0,w:Number(item.w)||2,h:Number(item.h)||2,imgSrc:item.imgSrc||'',tipo:'dependente',visualScale:Number(item.visualScale)||1};
 }
 function fromJob(job,card){
  if(!job||!card||card.id!==job.itemId)return null;
  const seed=job.seed||{id:job.itemId,price:job.price??Number(card.dataset.preco),xp:Number(card.dataset.xp)||0};
  return seed.id===job.itemId?snapshot(seed):null;
 }
 function matches(t,type){
  if(t.cultura)return String(t.cultura.tipo||'').toLowerCase()===type;
  if(t.animal)return String(t.animal.tipo||'').toLowerCase()===type;
  return String(t.itemId||t.catalogId||t.tipo||'').replace(/^item-/,'').toLowerCase()===type;
 }
 root.MFPlanting={snapshot,fromJob,matches};
})(globalThis);
