(function(root){
 root.MFSalesCore={sell(map,selection,quote){
  const rows=[];let total=0,stars=0;
  for(const [type,qty] of Object.entries(selection)){
   if(!Number.isSafeInteger(qty)||qty<1)throw Error('Quantidade inválida.');
   const item=map[type];if(!item||qty>item.count)throw Error('O estoque mudou. Selecione novamente.');
   const price=quote(type),coins=price.coins*qty,xp=price.xp*qty;
   if(!Number.isSafeInteger(coins)||coins<0||!Number.isSafeInteger(xp)||xp<0)throw Error('Preço inválido.');
   total+=coins;stars+=xp;rows.push({type,qty,coins,xp,slotIndex:item.slotIndex,imgSrc:item.imgSrc,left:item.count-qty});
  }
  if(!rows.length)throw Error('Selecione ao menos um produto.');
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(stars))throw Error('Total inválido.');
  for(const row of rows){if(row.left)map[row.type].count=row.left;else delete map[row.type];}
  return {rows,total,stars};
 }};
})(globalThis);
