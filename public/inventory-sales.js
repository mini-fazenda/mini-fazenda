(function(){
 const box=document.getElementById('bau-content');if(!box)return;
 let selecting=false,selected={};
 window.MFInventorySales={reset:()=>reset()};
 const inv=()=>window.__gameInventory;
 const name=type=>window.MFAdapter?.project?.items?.['item-'+type]?.name||document.querySelector('#item-'+type+' .item-name')?.textContent||({cenoura:'Cenoura Orgânica',espinafre:'Espinafre',trigo:'Trigo',morango:'Morango',leite:'Leite'}[type])||type.charAt(0).toUpperCase()+type.slice(1);
 function quote(type){
  const card=document.getElementById('item-'+type),fallback={milho:60,cenoura:95,morango:150,trigo:55,beterraba:75,terra:50,leite:150};
  const price=Number(card?.dataset.preco)||fallback[type]||1,xp=Number(card?.dataset.xp)||0;
  return window.MFAdapter.salePreview(price,xp,type);
 }
 const style=document.createElement('style');style.textContent=`
 #mini-venda-overlay,.mini-venda-btn{display:none!important}
 #mf-sales-actions{position:absolute;bottom:1%;left:50%;transform:translateX(-50%);z-index:15;display:flex;align-items:center;gap:9px;background:#ac652ddd;border-radius:14px;padding:7px 12px;white-space:nowrap}
 #mf-sales-actions button,#mf-sale-summary button{font:20px Amfost,Arial;color:white;border:2px solid #3b7626;border-radius:10px;background:linear-gradient(#8cdb51,#418e28);padding:7px 15px;cursor:pointer;box-shadow:0 3px #5f3c1d}
 #mf-sales-actions .cancel{background:linear-gradient(#d9a966,#a46c36);border-color:#794e22}
 #mf-sales-msg{font:14px Arial;color:#fff1bb;text-align:center;position:absolute;bottom:13%;left:5%;right:5%;pointer-events:none}
 #bau-inventario .mf-sale-selected{outline:3px solid #a4ef56;background:#8ad13c55!important}
 #bau-inventario .mf-sale-qty{position:absolute;left:4px;bottom:3px;z-index:12;width:48px;max-width:60%;font:bold 14px Arial;border:2px solid #5b8e26;border-radius:6px;padding:2px;text-align:center;background:#fff9d8;color:#553315}
 #mf-sale-summary[hidden]{display:none!important}#mf-sale-summary{position:fixed;inset:0;z-index:61000;background:#081e34b8;display:grid;place-items:center;padding:18px;box-sizing:border-box}
 #mf-sale-summary section{background:linear-gradient(#fff6ce,#edd69e);border:6px solid #955b2e;border-radius:22px;width:min(560px,92vw);max-height:85vh;overflow:auto;padding:22px;box-sizing:border-box;color:#60391d;text-align:center;font:17px Arial}
 #mf-sale-summary h2{font:36px Amfost,Arial;color:#7f4d1c;margin:0 0 8px}#mf-sale-summary table{width:100%;border-collapse:collapse;margin:18px 0;text-align:left}#mf-sale-summary td,#mf-sale-summary th{padding:9px 6px;border-bottom:1px solid #b8945677}#mf-sale-summary td:last-child,#mf-sale-summary th:last-child{text-align:right}#mf-sale-summary .total{font:28px Amfost,Arial;padding:12px;background:#fff9dc;border-radius:12px;margin-bottom:16px}
 @media(max-width:600px){#mf-sales-actions{gap:5px;padding:5px}#mf-sales-actions button{font-size:16px;padding:6px 9px}}
 `;document.head.append(style);
 const footer=document.createElement('div');footer.id='mf-sales-actions';
 const sell=document.createElement('button');sell.textContent='Vender';
 const all=document.createElement('button');all.textContent='Vender tudo';
 const cancel=document.createElement('button');cancel.textContent='Cancelar';cancel.className='cancel';cancel.hidden=true;
 footer.append(sell,all,cancel);box.append(footer);
 const msg=document.createElement('div');msg.id='mf-sales-msg';box.append(msg);
 const summary=document.createElement('div');summary.id='mf-sale-summary';summary.hidden=true;document.body.append(summary);
 function reset(){selecting=false;selected={};sell.textContent='Vender';cancel.hidden=true;msg.textContent='';for(const slot of inv()?.slots||[]){slot.classList.remove('mf-sale-selected');slot.querySelector('.mf-sale-qty')?.remove();}}
 function visitor(){return !!window.MFHost?.isVisiting?.();}
 function finish(selection){
  if(visitor()||!window.MFHost?.playing?.())return;
  try{
   const result=MFSalesCore.sell(inv().map,selection,quote);
   window.MFValueSource?.element(box,'venda');moedas+=result.total;if(result.stars)addXP(result.stars);
   document.getElementById('valor-moedas').textContent=moedas;
   for(const row of result.rows){const slot=inv().slots[row.slotIndex];if(slot)window.MFRenderInventorySlot(slot,row.left?row.type:'',row.left,row.imgSrc);}
   window.MFGameAudio?.event('sell');reset();window.MFHost?.changed?.('inventory-sale');requestRedraw();
   summary.replaceChildren();const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Resumo da venda');
   const title=document.createElement('h2');title.textContent='Venda concluída!';panel.append(title);
   const table=document.createElement('table');table.innerHTML='<thead><tr><th>Produto</th><th>Qtd.</th><th>Moedas</th></tr></thead>';const body=document.createElement('tbody');
   for(const row of result.rows){const tr=document.createElement('tr');for(const value of [name(row.type),row.qty,row.coins.toLocaleString('pt-BR')]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}
   table.append(body);panel.append(table);const total=document.createElement('div');total.className='total';total.textContent='Total recebido: '+result.total.toLocaleString('pt-BR')+' moedas';panel.append(total);
   if(result.stars){const stars=document.createElement('p');stars.textContent='★ +'+result.stars+' estrelas';panel.append(stars);}
   const close=document.createElement('button');close.textContent='Voltar ao celeiro';close.onclick=()=>summary.hidden=true;panel.append(close);summary.append(panel);summary.hidden=false;close.focus();
  }catch(e){msg.textContent=e.message;}
 }
 sell.onclick=()=>{if(visitor())return;if(!selecting){selecting=true;cancel.hidden=false;sell.textContent='Vender seleção';msg.textContent='Clique nos produtos e ajuste as quantidades.';}else finish(selected);};
 all.onclick=()=>{const selection={};for(const [type,item] of Object.entries(inv()?.map||{}))if(item.count>0)selection[type]=item.count;finish(selection);};
 cancel.onclick=reset;
 document.getElementById('bau-inventario').addEventListener('click',e=>{
  if(!selecting)return;e.stopImmediatePropagation();
  if(e.target.closest('.mf-sale-qty'))return;
  const slot=e.target.closest('.bau-slot'),type=slot?.dataset.tipo,item=inv()?.map[type];if(!item)return;
  if(selected[type]){delete selected[type];slot.classList.remove('mf-sale-selected');slot.querySelector('.mf-sale-qty')?.remove();}
  else{selected[type]=item.count;slot.classList.add('mf-sale-selected');const input=document.createElement('input');input.className='mf-sale-qty';input.type='number';input.min='1';input.max=String(item.count);input.value=String(item.count);input.setAttribute('aria-label','Quantidade de '+name(type));input.oninput=()=>selected[type]=Number(input.value);slot.append(input);}
 },true);
 document.getElementById('btn-bau')?.addEventListener('click',reset);
 box.querySelector('.btn-fechar-overlay')?.addEventListener('click',reset);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){summary.hidden=true;reset();}});
})();
