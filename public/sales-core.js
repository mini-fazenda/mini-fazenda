(function(root){
 root.MFSalesCore={sell(map,selection,quote,wallet){
  const rows=[];let total=0,stars=0;
  for(const [type,qty] of Object.entries(selection)){
   if(!Number.isSafeInteger(qty)||qty<1)throw Error('Quantidade inválida.');
   const item=map[type];if(!item||!Number.isSafeInteger(item.count)||qty>item.count)throw Error('O estoque mudou. Selecione novamente.');
   const price=quote(type),coins=price.coins*qty,xp=price.xp*qty;
   if(!Number.isSafeInteger(coins)||coins<=0||!Number.isSafeInteger(xp)||xp<0)throw Error('Preço inválido. Os produtos continuam no celeiro.');
   total+=coins;stars+=xp;rows.push({type,qty,coins,xp,slotIndex:item.slotIndex,imgSrc:item.imgSrc,left:item.count-qty});
  }
  if(!rows.length)throw Error('Selecione ao menos um produto.');
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(stars))throw Error('Total inválido.');
  // Valide e confirme o crédito antes de retirar qualquer produto.
  let before,after;
  if(wallet){
   before=wallet.get();after=before+total;
   if(!Number.isSafeInteger(before)||before<0||!Number.isSafeInteger(after))throw Error('Saldo inválido. Os produtos continuam no celeiro.');
  }
  const originals=rows.map(row=>[row.type,{...map[row.type]}]);
  try{
   if(wallet){wallet.set(after);if(wallet.get()!==after)throw Error('Não foi possível creditar a venda.');}
   for(const row of rows){if(row.left)map[row.type].count=row.left;else delete map[row.type];}
  }catch(error){
   for(const [type,item]of originals)map[type]=item;
   if(wallet&&wallet.get()!==before)wallet.set(before);
   throw error;
  }
  return {rows,total,stars};
 }};
})(globalThis);
