/* Mini Fazenda · Ajustes para celular deitado (telas baixas).
   Recompensas diárias, Mini Celeiro e Configurações cabem inteiros na tela.
   Carregado por último para ficar por cima das regras de cada módulo. */
(function () {
  'use strict';
  const css = `
  /* janelas sempre acima da barra de amigos e do menu */
  #overlay-bau,#overlay-config{z-index:2050!important}
  /* Celeiro: botões Vender / Vender tudo sempre visíveis (antes ficavam escondidos
     embaixo da rolagem em telas de notebook, e a venda não acontecia) */
  #overlay-bau #mf-sales-actions{position:sticky!important;bottom:0!important;z-index:30!important;background:#77381fee!important;border-radius:12px!important}
  @media (min-height:521px){
    #overlay-bau #bau-content{width:min(720px,94vw,calc((94vh - 300px) * 1.5 + 60px))!important;min-width:min(420px,94vw)!important}
  }
  @media (max-height:520px){
    /* ---------- Recompensas diárias ---------- */
    #mf-daily{padding:6px!important}
    #mf-daily .daily-panel{width:min(1000px,97vw)!important;max-height:96vh!important;padding:10px 12px 12px!important;border-width:5px!important;border-radius:18px!important}
    #mf-daily h2{font-size:26px!important;margin:0 40px 2px!important}
    #mf-daily p{font-size:11.5px!important;line-height:1.3!important;margin:0 0 8px!important}
    #mf-daily .daily-close{width:34px!important;height:34px!important;font-size:21px!important;top:6px!important;right:6px!important}
    #mf-daily .daily-cards{grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:5px!important}
    #mf-daily .daily-card{padding:0 4px 6px!important;border-width:2px!important;border-radius:11px!important}
    #mf-daily h3{font-size:14px!important;padding:5px 2px!important;margin:0 -4px 3px!important}
    #mf-daily .daily-card img{height:min(54px,14vh)!important;margin:2px 0 4px!important}
    #mf-daily strong{font-size:12.5px!important;min-height:30px!important}
    #mf-daily .daily-card button{margin-top:5px!important;min-height:26px!important;font-size:13px!important;padding:2px!important}

    /* ---------- Mini Celeiro ---------- */
    #overlay-bau{padding:6px!important}
    #overlay-bau #bau-content{width:min(560px,96vw)!important;max-height:97vh!important;padding:52px 14px 10px!important;
      clip-path:polygon(50% 0,100% 42px,100% 100%,0 100%,0 42px)!important}
    #bau-content .mf-barn-roof{height:44px!important}
    #bau-content #mf-barn-title{font-size:24px!important;margin:-14px 46px 6px!important}
    #bau-content .btn-fechar-overlay{top:40px!important;right:8px!important;transform:scale(.8)!important;transform-origin:top right!important}
    #overlay-bau #bau-inventario{grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:4px!important;padding:6px!important}
    #overlay-bau #mf-sales-actions{margin-top:8px!important;padding:5px!important;gap:6px!important}
    #overlay-bau #mf-sales-actions button{font-size:16px!important;padding:5px 12px!important}
    #overlay-bau #mf-sales-msg{margin-top:4px!important;font-size:12px!important}
    #mf-sale-summary section{padding:12px!important;max-height:94vh!important}
    #mf-sale-summary h2{font-size:26px!important}
    #mf-sale-summary table{margin:8px 0!important}
    #mf-sale-summary td,#mf-sale-summary th{padding:4px 6px!important}

    /* ---------- Configurações ---------- */
    #overlay-config{align-items:center!important;padding:6px!important;box-sizing:border-box!important}
    #config-content{max-height:96vh!important;overflow:auto!important;justify-content:flex-start!important}
    #config-content > div{padding-top:8px!important;gap:6px!important}
    #config-content h3{margin:0 0 8px!important;font-size:17px!important}
    #config-content > div > div{padding:12px 16px!important}
    .mf-cfg-row{margin:0 0 9px!important;gap:4px!important}
    .mf-cfg-chars button img{height:30px!important}
    #config-content{transform:none!important;scale:1!important}
    #config-content .btn-fechar-overlay{position:absolute!important;top:-6px!important;right:-6px!important;transform:scale(.75)!important;z-index:3!important}
    /* duas colunas: nome e personagem | som e desempenho */
    #config-content > div > div{display:grid!important;grid-template-columns:1fr 1fr!important;column-gap:18px!important;row-gap:4px!important;
      width:min(660px,94vw)!important;box-sizing:border-box!important;font-size:13px!important;padding:10px 14px!important}
    #config-content > div > div > h3{grid-column:1/-1!important;margin:0 0 2px!important}
    #config-content > div > div > *{margin-top:0!important;margin-bottom:0!important}
    #config-content select{margin-top:4px!important;padding:4px!important}
    .mf-cfg-line input{padding:6px 8px!important;font-size:14px!important}
    .mf-cfg-line button{padding:6px 10px!important}
    .mf-cfg-ok{min-height:0!important}
  }
  @media (max-height:520px) and (max-width:700px){
    #mf-daily .daily-cards{grid-template-columns:repeat(4,minmax(0,1fr))!important}
    #overlay-bau #bau-inventario{grid-template-columns:repeat(8,minmax(0,1fr))!important}
  }`;
  function add() {
    if (document.getElementById('mf-ajustes-celular')) return;
    const st = document.createElement('style'); st.id = 'mf-ajustes-celular'; st.textContent = css;
    document.head.appendChild(st);
  }
  // depois dos estilos que os outros módulos colocam ao carregar
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(add, 0)); else setTimeout(add, 0);
  setTimeout(() => { const st = document.getElementById('mf-ajustes-celular'); if (st) document.head.appendChild(st); }, 800);
})();
