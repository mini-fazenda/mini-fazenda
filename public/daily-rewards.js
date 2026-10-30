(function(){
 'use strict';
 // Edite esta lista para mudar os prêmios da campanha. Quantidades são produtos no inventário.
 const rewards=[
  {name:'200 moedas',coins:200,icon:'coin'},
  {name:'3 trigos',item:'trigo',qty:3},
  {name:'5 cenouras orgânicas',item:'cenoura',qty:5},
  {name:'400 moedas',coins:400,icon:'coin'},
  {name:'4 morangos',item:'morango',qty:4},
  {name:'6 espinafres',item:'espinafre',qty:6},
  {name:'Baú misterioso',icon:'chest',preview:true}
 ];
 const model=new MFRewardState();let panel;
 const visiting=()=>window.MFHost?.isVisiting?.();
 function icon(r){
  if(r.icon==='chest')return 'assets/ambiente/bau-misterioso.png';
  if(r.icon==='coin')return document.querySelector('#hud-moedas img')?.src||'';
  return document.querySelector('#item-'+r.item+' img')?.src||window.MFAdapter?.project?.items?.['item-'+r.item]?.icon||window.MFAdapter?.project?.items?.['item-'+r.item]?.lootIcon||'';
 }
 function render(){
  if(!panel)return;
  const claimed=model.capture().claimed,can=model.available();
  const cards=panel.querySelector('.daily-cards');cards.replaceChildren();
  rewards.forEach((r,i)=>{
   const done=i<claimed,today=i===claimed,card=document.createElement('article');card.className='daily-card'+(today?' today':'')+(done?' done':'');
   const title=document.createElement('h3');title.textContent=today?'Hoje · Dia '+(i+1):'Dia '+(i+1);
   const img=document.createElement('img');img.src=icon(r)||'';img.alt=r.name;
   const name=document.createElement('strong');name.textContent=r.name;
   const button=document.createElement('button');button.type='button';
   button.textContent=done?'✓ Resgatado':r.preview?'Em breve':today&&can?'Resgatar':today?'Volte amanhã':'Próximo dia';
   button.disabled=done||!today||!can||r.preview||!!visiting();
   button.onclick=()=>{
    if(visiting())return;
    const ok=model.claim(index=>{
     const reward=rewards[index];
     if(reward.coins){moedas+=reward.coins;document.getElementById('valor-moedas').textContent=moedas;}
     else window.addToInventory(reward.item,reward.qty,icon(reward));
    });
    if(ok){window.MFHost?.changed?.('daily-reward');requestRedraw();render();}
   };
   card.append(title,img,name,button);cards.append(card);
  });
 }
 function open(){if(visiting())return;panel.hidden=false;render();panel.querySelector('.daily-close').focus();}
 window.MFDaily={capture:()=>model.capture(),restore:s=>{model.restore(s);render()},open,rewards};
 const style=document.createElement('style');style.textContent=`
 #hud-moedas{position:fixed!important;left:auto!important;right:116px!important;top:14px!important;bottom:auto!important;transform:none!important;padding:6px 12px!important;gap:5px!important;z-index:20!important;pointer-events:none}
 #hud-moedas img{width:27px!important;height:27px!important;margin-right:4px!important}#hud-moedas span{font-size:25px!important}
 body:has(#mf-shop.on) #hud-moedas,body:has(#overlay-loja[style*="flex"]) #hud-moedas{visibility:hidden!important}
 #btn-mover[aria-pressed="true"]{filter:drop-shadow(0 0 5px #ffe968)}
 #mf-daily[hidden]{display:none!important}#mf-daily{position:fixed;inset:0;z-index:60000;background:#102638b8;display:grid;place-items:center;padding:18px;box-sizing:border-box}
 #mf-daily .daily-panel{position:relative;width:min(1060px,94vw);max-height:90vh;overflow:auto;box-sizing:border-box;padding:25px;border:8px solid #875527;border-radius:26px;background:radial-gradient(ellipse at 50% 0,#b5ecff88,transparent 65%),linear-gradient(135deg,#258dd4,#1265b9);box-shadow:inset 0 0 0 3px #ffd17c,0 20px 70px #0009;font-family:Amfost,Arial,sans-serif;text-align:center}
 #mf-daily h2{margin:0 35px 8px;color:#ffdc38;font-size:clamp(30px,4vw,52px);text-shadow:2px 3px #5c351b,-2px -2px #5c351b,2px -2px #5c351b,-2px 2px #5c351b}
 #mf-daily p{margin:0 0 20px;color:#fff;font:600 15px Arial;line-height:1.5}
 #mf-daily .daily-close{position:absolute;right:10px;top:10px;background:linear-gradient(#ff7261,#d93332);border:3px solid #a42c27;border-radius:12px;color:white;font:bold 28px Arial;width:44px;height:44px;cursor:pointer}
 #mf-daily .daily-cards{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:9px}
 #mf-daily .daily-card{display:flex;flex-direction:column;align-items:center;background:linear-gradient(#fff9d2,#f4df9a);border:3px solid #d9a44d;border-radius:15px;padding:0 7px 12px;min-width:0;overflow:hidden}
 #mf-daily h3{align-self:stretch;margin:0 -7px 9px;padding:10px 2px;background:linear-gradient(#ffc65a,#ef970e);color:#fff;font-size:21px;text-shadow:1px 2px #b57220}
 #mf-daily .today{border-color:#52d742;box-shadow:0 0 0 3px #96fa63}#mf-daily .today h3{background:linear-gradient(#75df39,#299d20)}
 #mf-daily .daily-card img{width:100%;height:105px;object-fit:contain;margin:6px 0 12px;filter:drop-shadow(0 4px 3px #0003)}
 #mf-daily strong{font-size:18px;line-height:1.15;color:#62401e;min-height:46px;display:grid;place-items:center;flex:1}
 #mf-daily .daily-card button{margin-top:14px;width:100%;min-height:36px;border:2px solid #367a22;border-radius:10px;background:linear-gradient(#8de245,#409e21);color:white;font:18px Amfost,Arial;cursor:pointer;text-shadow:1px 1px #34651e}
 #mf-daily .daily-card button:disabled{background:#dfce9d;border-color:#baa36b;color:#7e6e47;text-shadow:none;cursor:default}#mf-daily .done button{background:#d7ebba;color:#3b722b;border-color:#86b65b}
 @media(max-width:800px){#mf-daily .daily-cards{grid-template-columns:repeat(4,minmax(0,1fr))}#mf-daily .daily-panel{padding:20px 14px}#mf-daily .daily-card img{height:75px}}
 @media(max-width:480px){#mf-daily .daily-cards{grid-template-columns:repeat(2,minmax(0,1fr))}#hud-moedas{right:86px!important;top:8px!important}#hud-moedas span{font-size:21px!important}}
 `;document.head.append(style);
 panel=document.createElement('div');panel.id='mf-daily';panel.hidden=true;
 panel.innerHTML='<section class="daily-panel" role="dialog" aria-modal="true" aria-labelledby="daily-title"><button class="daily-close" aria-label="Fechar">×</button><h2 id="daily-title">Recompensas diárias</h2><p>Um carinho para sua fazenda a cada novo dia!<br>Complete a sequência no seu ritmo. O baú do dia 7 é uma prévia.</p><div class="daily-cards"></div></section>';
 document.body.append(panel);panel.querySelector('.daily-close').onclick=()=>panel.hidden=true;
 panel.onclick=e=>{if(e.target===panel)panel.hidden=true};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true});
 // Captura antes dos handlers antigos do botão de presente.
 document.addEventListener('click',e=>{if(e.target.closest?.('#mf-btn-presente')){e.preventDefault();e.stopImmediatePropagation();open();}},true);
 const arrow=document.getElementById('btn-mover');
 if(arrow){arrow.innerHTML=window.MFMenuTile('<path d="M19 12L20 45L28 36L36 50L43 46L35 33L48 31Z" fill="white" stroke="#50772a" stroke-width="2.5" stroke-linejoin="round"/>');arrow.title='Seta: clique para ativar mover';}
})();
