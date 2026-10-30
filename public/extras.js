/*
  Mini Fazenda · Extras de interface
  - Mini Loja nova (abas, sub-abas, cartões, prévia e "Em construção")
  - Enxada: ara a grama para criar terra (a compra de Terra saiu da loja)
  - Configurações: nome da fazenda e som
  - Barra de XP no estilo "0/15 ★ 1"
  Usa os cartões originais (#cards-grid) para comprar: preço, nível e
  modo de colocar continuam sendo os do jogo.
*/
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const editing = () => document.body.classList.contains('mf-editing') || !!window.__MF_EDITOR_EDITING;
  const visiting = () => !!window.MFHost?.isVisiting?.();
  const coinSrc = () => document.querySelector('#hud-moedas img')?.src || '';
  const starSrc = () => (typeof XP_SPRITE_SRC !== 'undefined' ? XP_SPRITE_SRC : '');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ================= ESTILO =================
  const css = document.createElement('style');
  css.id = 'mf-extras-style';
  css.textContent = `
  /* ---------- Barra de XP ---------- */
  #hud-xp{gap:0!important}
  #hud-xp #hud-xp-bar{width:230px!important;height:38px!important;padding:5px!important;border:3px solid #2e1d08!important;border-radius:14px!important;
    background:linear-gradient(#5a3a12,#3b260b)!important;box-shadow:0 3px 0 #1f1405,inset 0 2px 0 #ffffff22!important;box-sizing:border-box}
  #hud-xp #hud-xp-fill{left:5px!important;top:5px!important;bottom:5px!important;border-radius:9px!important;min-width:0;
    background:linear-gradient(#ffd25a 0%,#ffae1f 45%,#f08a00 100%)!important;box-shadow:inset 0 2px 0 #fff6,inset 0 -2px 0 #0002}
  #hud-xp #hud-xp-fill-stripes{display:none}
  #hud-xp #hud-xp-text{text-align:left!important;padding-left:12px;font:700 15px Amfost,Arial,sans-serif!important;line-height:22px;color:#fff;
    text-shadow:-1px -1px 0 #4a2a00,1px -1px 0 #4a2a00,-1px 1px 0 #4a2a00,1px 1px 0 #4a2a00!important}
  #hud-xp #hud-xp-sprite{width:44px!important;height:44px!important;margin-left:-34px!important;z-index:7!important;filter:drop-shadow(0 2px 1px #0006)}
  #hud-xp #hud-xp-level{position:relative!important;left:auto!important;top:auto!important;background:none!important;padding:0 0 0 6px!important;
    font:700 34px Amfost,Arial,sans-serif!important;color:#fff;line-height:1;z-index:7;
    text-shadow:-2px -2px 0 #3b260b,2px -2px 0 #3b260b,-2px 2px 0 #3b260b,2px 2px 0 #3b260b,0 3px 3px #0008!important}
  @media (max-width:900px){#hud-xp #hud-xp-bar{width:170px!important;height:32px!important}#hud-xp #hud-xp-text{font-size:13px!important;line-height:17px}
    #hud-xp #hud-xp-sprite{width:36px!important;height:36px!important;margin-left:-28px!important}#hud-xp #hud-xp-level{font-size:26px!important}}

  /* ---------- Som fora da tela (fica nas configurações) ---------- */
  body:not(.mf-editing) > #mf-audio-player{display:none!important}
  #mf-cfg-audio #mf-audio-player{position:static!important;display:flex!important;max-width:none!important;background:#0f2a30!important;border-radius:10px!important;padding:6px 10px!important}
  #mf-cfg-audio #mf-audio-range{width:150px!important}

  /* ---------- Configurações ---------- */
  .mf-cfg-row{display:flex;flex-direction:column;gap:6px;margin:0 0 16px}
  .mf-cfg-row label{font-weight:700}
  .mf-cfg-line{display:flex;gap:8px}
  .mf-cfg-line input{flex:1;min-width:0;padding:8px 10px;border-radius:8px;border:0;font:15px system-ui}
  .mf-cfg-line button{border:0;border-radius:8px;padding:8px 12px;background:#5aa63c;color:#fff;font-weight:700;cursor:pointer}
  .mf-cfg-ok{color:#a8f08a;font-size:13px;min-height:16px}

  /* ---------- Enxada ---------- */
  #btn-enxada{position:absolute;bottom:95px;right:210px;width:65px;height:65px;padding:0;border:0;background:none;cursor:pointer;z-index:5}
  #btn-enxada svg{width:100%;height:100%;display:block}
  #btn-enxada.ativo svg{filter:drop-shadow(0 0 6px #fff36b) drop-shadow(0 0 3px #fff36b)}
  #btn-enxada.ativo::after{content:'';position:absolute;inset:-4px;border:3px solid #fff36b;border-radius:16px;animation:mfPulse 1s infinite}
  @keyframes mfPulse{50%{opacity:.35}}
  @media (max-width:900px){#btn-enxada{bottom:60px!important;right:142px!important;width:46px;height:46px}}
  #mf-toast{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:100000;background:#3b260bee;color:#fff3cf;border:2px solid #c98a3c;
    border-radius:14px;padding:10px 16px;font:700 16px Amfost,Arial,sans-serif;pointer-events:none;opacity:0;transition:opacity .25s;text-align:center;max-width:80vw}
  #mf-toast.on{opacity:1}


  /* ---------- Menu da direita ---------- */
  #mf-menu{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:40;display:flex;flex-direction:column;align-items:flex-end;gap:8px;
    transform-origin:right bottom;pointer-events:none}
  #mf-menu > *{pointer-events:auto}
  #mf-menu button{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;
    margin:0!important;padding:0!important;border:0!important;background:none!important;cursor:pointer;display:block;transition:transform .1s}
  #mf-menu button:hover{transform:translateY(-2px)!important}
  #mf-menu .mfm-top{display:flex;gap:6px}
  #mf-menu .mfm-top button,#mf-menu .mfm-top button img,#mf-menu .mfm-top button svg{width:40px!important;height:40px!important;display:block}
  #mf-menu .mfm-main{display:flex;align-items:center;gap:8px}
  #mf-menu .mfm-loja button,#mf-menu .mfm-loja img{width:86px!important;height:120px!important}
  #mf-menu .mfm-tools{display:grid;grid-template-columns:repeat(3,62px);grid-template-rows:repeat(2,62px);gap:6px}
  #mf-menu .mfm-tools button,#mf-menu .mfm-tools button > img,#mf-menu .mfm-tools button > svg{width:62px!important;height:62px!important}
  #mf-menu #btn-bau.mfm-tile{border-radius:13px!important;background:linear-gradient(#a8ec82,#5dbb3e)!important;box-shadow:inset 0 0 0 2px #2f6e1f,0 0 0 1px #2f6e1f!important}
  #mf-menu #btn-bau.mfm-tile img{width:52px!important;height:48px!important;margin:7px auto 0!important;display:block}
  #mf-menu #btn-enxada.ativo::after{inset:-4px}
  @media (max-width:900px),(max-height:500px){#mf-menu{transform:scale(.68)!important}}


  /* ---------- ID ao lado do nome ---------- */
  #hud-fazenda-text{position:relative}
  #mf-hud-id{display:block;width:max-content;max-width:190px;overflow-wrap:anywhere;margin:3px 0 0;font:700 11px Arial,sans-serif;color:#fff2d0;background:#3b260bb8;border:1px solid #b98c48;border-radius:6px;padding:2px 5px;cursor:pointer;text-shadow:none;pointer-events:auto;line-height:1.2}
  #mf-hud-id:hover{background:#5a3a12}
  /* ---------- Barra de amigos ---------- */
  #mf-amigos{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:39;display:flex;align-items:stretch;gap:6px;
    padding:6px;border-radius:16px;background:linear-gradient(#e7a95e,#b86f2c);border:3px solid #6b3a12;box-shadow:0 4px 0 #4a260a,0 8px 18px #0005;transform-origin:left bottom;font-family:Amfost,Arial,sans-serif}
  #mf-amigos button{cursor:pointer;font-family:inherit}
  #mf-amigos .mfa-head{width:58px;border:0;border-radius:11px;background:linear-gradient(#ffd765,#f5a623);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;position:relative;
    font-size:13px;text-shadow:-1px -1px 0 #8a4b10,1px -1px 0 #8a4b10,-1px 1px 0 #8a4b10,1px 1px 0 #8a4b10;padding:0}
  #mf-amigos .mfa-head b{font-size:26px;line-height:1;text-shadow:none}
  #mf-amigos .mfa-badge{position:absolute;top:-8px;left:-8px;min-width:22px;height:22px;border-radius:11px;background:#e8463c;border:2px solid #fff;color:#fff;font:700 13px Arial,sans-serif;display:flex;align-items:center;justify-content:center;text-shadow:none}
  #mf-amigos .mfa-cards{display:flex;gap:6px}
  #mf-amigos .mfa-card{width:84px;height:112px;background:#fff8e4;border:2px solid #d9bf8c;border-radius:10px;display:flex;flex-direction:column;align-items:center;padding:4px 3px;box-sizing:border-box;position:relative}
  #mf-amigos .mfa-rank{position:absolute;top:-6px;left:-6px;width:24px;height:24px;border-radius:12px;color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 2px #0005}
  #mf-amigos .mfa-av{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;border:2px solid #6b3a12;text-shadow:0 2px 0 #0004;flex:none}
  #mf-amigos .mfa-name{font-size:12.5px;color:#4a2a0e;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}
  #mf-amigos .mfa-lv{font:700 11px Arial,sans-serif;color:#a4652f}
  #mf-amigos .mfa-visit{margin-top:auto;border:2px solid #2f6e1f;border-radius:8px;background:linear-gradient(#8ee05d,#4ea72e);color:#fff;font-size:12px;padding:2px 8px;
    text-shadow:-1px -1px 0 #2f6e1f,1px -1px 0 #2f6e1f,-1px 1px 0 #2f6e1f,1px 1px 0 #2f6e1f}
  #mf-amigos .mfa-empty{border-style:dashed;background:#fff3d6;justify-content:center;color:#a4652f;font-size:12px;text-align:center;cursor:pointer;border-color:#c99a55}
  #mf-amigos .mfa-empty b{font-size:30px;line-height:1;color:#c98a3c}
  #mf-amigos .mfa-arrows{display:flex;flex-direction:column;gap:4px}
  #mf-amigos .mfa-arrow{width:26px;flex:1;border:0;border-radius:8px;background:#fff3d6;color:#6b3a12;font-size:18px;padding:0;line-height:1}
  #mf-amigos .mfa-arrow:disabled{opacity:.35;cursor:default}
  @media (max-width:900px),(max-height:500px){#mf-amigos{transform:scale(.66)}}
  /* ---------- Janela de amigos ---------- */
  #mf-amigos-dlg{position:fixed;inset:0;z-index:2100;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45);font-family:Amfost,Arial,sans-serif}
  #mf-amigos-dlg.on{display:flex}
  #mf-amigos-dlg .mfd{width:min(560px,94vw);max-height:90vh;overflow:auto;border-radius:22px;padding:14px 18px 18px;box-sizing:border-box;position:relative;
    background:linear-gradient(#cf9152,#a4652f 40%,#8b5124);border:6px solid #5b3417;box-shadow:0 14px 40px #0008}
  #mf-amigos-dlg h2{margin:0 0 10px;text-align:center;font-size:36px;font-weight:400;color:#ffcf3f;text-shadow:-3px -3px 0 #6b3a12,3px -3px 0 #6b3a12,-3px 3px 0 #6b3a12,3px 3px 0 #6b3a12,0 5px 0 #4a260a}
  #mf-amigos-dlg .x{position:absolute;right:8px;top:8px;width:44px;height:44px;border:0;background:none;padding:0;cursor:pointer}
  #mf-amigos-dlg .x img{width:100%;height:100%}
  #mf-amigos-dlg section{background:#f6ecd6;border:2px solid #6b3f1b;border-radius:14px;padding:10px 12px;margin-top:10px;color:#4a2a0e}
  #mf-amigos-dlg h3{margin:0 0 8px;font-size:18px;font-weight:400;color:#a4652f}
  #mf-amigos-dlg .myid{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:16px}
  #mf-amigos-dlg .myid strong{font-size:30px;font-weight:400;color:#3b260b;letter-spacing:2px}
  #mf-amigos-dlg .line{display:flex;gap:8px}
  #mf-amigos-dlg input{flex:1;min-width:0;border:2px solid #d9bf8c;border-radius:10px;padding:8px 10px;font:700 18px Arial,sans-serif;letter-spacing:2px}
  #mf-amigos-dlg .btn{border:2px solid #2f6e1f;border-radius:10px;background:linear-gradient(#8ee05d,#4ea72e);color:#fff;font:400 15px Amfost,Arial,sans-serif;padding:6px 12px;cursor:pointer;
    text-shadow:-1px -1px 0 #2f6e1f,1px -1px 0 #2f6e1f,-1px 1px 0 #2f6e1f,1px 1px 0 #2f6e1f;white-space:nowrap}
  #mf-amigos-dlg .btn.no{background:linear-gradient(#f2a08f,#d9533f);border-color:#8a2a1c;text-shadow:-1px -1px 0 #8a2a1c,1px -1px 0 #8a2a1c,-1px 1px 0 #8a2a1c,1px 1px 0 #8a2a1c}
  #mf-amigos-dlg .btn.sec{background:#e8d3a6;border-color:#b08850;color:#6b3f1b;text-shadow:none}
  #mf-amigos-dlg .msg{min-height:18px;margin-top:6px;font:700 13px Arial,sans-serif}
  #mf-amigos-dlg .msg.ok{color:#2f7a24}#mf-amigos-dlg .msg.err{color:#c0261b}
  #mf-amigos-dlg .row{display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid #e3cfa5}
  #mf-amigos-dlg .row:first-of-type{border-top:0}
  #mf-amigos-dlg .row .av{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:19px;border:2px solid #6b3a12;flex:none}
  #mf-amigos-dlg .row .who{flex:1;min-width:0}
  #mf-amigos-dlg .row .who b{display:block;font-weight:400;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  #mf-amigos-dlg .row .who small{font:700 12px Arial,sans-serif;color:#a4652f}
  #mf-amigos-dlg .none{font:600 14px Arial,sans-serif;color:#8a6a40}
  #mf-amigos-dlg .hint{font:600 13px Arial,sans-serif;color:#7a4a1f;margin:6px 0 0}


  /* ---------- Escolha de personagem ---------- */
  #mf-char{position:fixed;inset:0;z-index:2200;display:none;align-items:center;justify-content:center;background:rgba(10,30,15,.65);font-family:Amfost,Arial,sans-serif}
  #mf-char.on{display:flex}
  #mf-char .box{text-align:center;max-width:94vw}
  #mf-char h2{margin:0 0 14px;font-size:40px;font-weight:400;color:#ffcf3f;text-shadow:-3px -3px 0 #6b3a12,3px -3px 0 #6b3a12,-3px 3px 0 #6b3a12,3px 3px 0 #6b3a12,0 5px 0 #4a260a}
  #mf-char .opts{display:flex;gap:22px;justify-content:center}
  #mf-char .opt{width:210px;height:300px;border-radius:18px;background:#0f2a14;border:4px solid #0f2a14;box-shadow:0 8px 20px #0007;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:10px;box-sizing:border-box;transition:transform .12s}
  #mf-char .opt:hover,#mf-char .opt.sel{transform:translateY(-4px);border-color:#ffcf3f}
  #mf-char .opt img{height:230px;width:auto;object-fit:contain;filter:drop-shadow(0 6px 6px #0008)}
  #mf-char .opt span{color:#fff;font-size:24px;margin-top:6px}
  @media (max-height:500px){#mf-char .opt{width:150px;height:220px}#mf-char .opt img{height:160px}#mf-char h2{font-size:28px;margin-bottom:8px}}
  .mf-cfg-chars{display:flex;gap:8px}
  .mf-cfg-chars button{flex:1;display:flex;align-items:center;gap:6px;border:2px solid #2d5a63;border-radius:10px;background:#0f2a30;color:#fff;padding:4px 8px;cursor:pointer;font-weight:700}
  .mf-cfg-chars button img{height:42px;width:auto}
  .mf-cfg-chars button.sel{border-color:#ffcf3f;background:#24444a}


  body.mf-visit #mf-menu,body.mf-visit #btn-enxada,body.mf-visit #mf-amigos{display:none!important}
  /* ---------- Fertilizar (visita) ---------- */
  #mf-visit-bar{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:5;pointer-events:none;
    background:linear-gradient(#6b4218f2,#3b260bf2);border:3px solid #c98a3c;border-radius:18px;color:#fff3cf;font:400 18px Amfost,Arial,sans-serif;
    padding:6px 14px 7px;text-align:center;box-shadow:0 6px 16px #0007;max-width:92vw;box-sizing:border-box}
  #mf-visit-bar .mfv-title{display:flex;align-items:center;justify-content:center;gap:8px;line-height:1.1}
  #mf-visit-bar .mfv-title b{color:#9bff6b;font-weight:400}
  #mf-visit-bar .mfv-count{background:#2a1a07;border:2px solid #c98a3c;border-radius:10px;padding:0 8px;color:#fff;font-size:17px}
  #mf-visit-bar .mfv-bags{display:flex;justify-content:center;gap:6px;margin:4px 0 2px}
  #mf-visit-bar .mfv-bags img{width:46px;height:54px;object-fit:contain;filter:drop-shadow(0 2px 0 #0006);transition:filter .3s,opacity .3s,transform .3s}
  #mf-visit-bar .mfv-bags img.used{filter:grayscale(1) brightness(.6);opacity:.35;transform:scale(.82)}
  #mf-visit-bar small{display:block;font:700 12px Arial,sans-serif;color:#ffe9b0;margin-top:1px}
  #mf-visit-bar.empty{border-color:#8a8a8a}
  #mf-visit-bar{pointer-events:auto!important;cursor:pointer}
  #mf-visit-bar.holding{border-color:#9bff6b;box-shadow:0 0 0 3px #9bff6b88,0 6px 16px #0007}
  #mf-fert-cursor{position:fixed;z-index:8;width:64px;height:64px;pointer-events:none;background:url(assets/fertilizante/saco.png) center/contain no-repeat;
    transform:translate(-30%,-85%) rotate(-8deg);filter:drop-shadow(0 4px 3px #0006);display:none}
  .mf-fert-pour{position:fixed;z-index:7;width:130px;height:130px;pointer-events:none;background:url(assets/fertilizante/despejar.webp) 0 0/auto 100% no-repeat}
  @media (max-width:900px),(max-height:500px){#mf-visit-bar{font-size:14px;padding:4px 10px 5px;border-radius:14px}
    #mf-visit-bar .mfv-bags img{width:32px;height:38px}#mf-fert-cursor{width:48px;height:48px}.mf-fert-pour{width:100px;height:100px}#mf-visit-bar .mfv-count{font-size:14px}#mf-visit-bar small{font-size:10.5px}}
  .mf-spark{position:fixed;z-index:6;pointer-events:none;font-size:26px;animation:mfSpark 1.2s ease-out forwards}
  @keyframes mfSpark{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}20%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% - 70px)) scale(1.2);opacity:0}}

  /* ---------- Mini Loja ---------- */
  #mf-shop{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
  #mf-shop.on{display:flex}
  #mf-shop .mfs-panel{position:relative;width:960px;height:600px;flex:none;transform-origin:center;border-radius:26px;padding:14px;box-sizing:border-box;
    background:linear-gradient(#cf9152,#a4652f 40%,#8b5124);border:6px solid #5b3417;box-shadow:0 14px 40px #0008,inset 0 2px 0 #ffd9a344;
    font-family:Amfost,Arial,sans-serif;animation:mfsIn .22s ease-out}
  @keyframes mfsIn{from{transform:scale(var(--s,1)) translateY(20px);opacity:0}to{transform:scale(var(--s,1));opacity:1}}
  #mf-shop .mfs-head{height:62px;display:flex;align-items:center;justify-content:center;position:relative}
  #mf-shop .mfs-title{font-size:48px;color:#ffcf3f;letter-spacing:1px;line-height:1;
    text-shadow:-3px -3px 0 #6b3a12,3px -3px 0 #6b3a12,-3px 3px 0 #6b3a12,3px 3px 0 #6b3a12,0 6px 0 #4a260a}
  #mf-shop .mfs-wallet{position:absolute;left:8px;top:6px;display:flex;align-items:center;gap:6px;background:#4a2a0e;border:2px solid #2e1906;border-radius:12px;padding:6px 14px;color:#fff;font-size:24px}
  #mf-shop .mfs-wallet img{width:28px;height:28px}
  #mf-shop .mfs-close{position:absolute;right:-30px;top:-34px;width:58px;height:58px;border:0;background:none;padding:0;cursor:pointer}
  #mf-shop .mfs-close img{width:100%;height:100%}
  #mf-shop .mfs-tabs{display:flex;gap:6px;margin:6px 0 0;flex-wrap:nowrap}
  #mf-shop .mfs-tab{flex:1;border:2px solid #6b3f1b;border-bottom:0;border-radius:12px 12px 0 0;padding:8px 2px 6px;background:linear-gradient(#f4dfb2,#dcbc84);
    color:#5b3417;font:700 17px Amfost,Arial,sans-serif;cursor:pointer;white-space:nowrap}
  #mf-shop .mfs-tab.on{background:linear-gradient(#ffd765,#f5a623);color:#fff;text-shadow:-1px -1px 0 #8a4b10,1px -1px 0 #8a4b10,-1px 1px 0 #8a4b10,1px 1px 0 #8a4b10}
  #mf-shop .mfs-tab.promo{color:#c0261b}
  #mf-shop .mfs-tab.promo.on{color:#fff}
  #mf-shop .mfs-paper{position:relative;height:calc(100% - 62px - 44px);background:#f6ecd6;border:2px solid #6b3f1b;border-radius:0 0 16px 16px;padding:10px 14px;box-sizing:border-box;display:flex;flex-direction:column}
  #mf-shop .mfs-subs{display:flex;gap:8px;height:34px;margin-bottom:8px}
  #mf-shop .mfs-sub{border:0;border-radius:8px;padding:4px 16px;background:#e8d3a6;color:#6b3f1b;font:700 16px Amfost,Arial,sans-serif;cursor:pointer}
  #mf-shop .mfs-sub.on{background:#f5a623;color:#fff}
  #mf-shop .mfs-body{flex:1;display:flex;gap:14px;min-height:0}
  #mf-shop .mfs-gridwrap{flex:1;position:relative;display:flex;align-items:center;min-width:0}
  #mf-shop .mfs-grid{flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:10px;height:100%;padding:0 34px;box-sizing:border-box}
  #mf-shop .mfs-arrow{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:70px;border:0;border-radius:10px;background:#d9bf8c;color:#6b3f1b;font-size:34px;cursor:pointer;z-index:2}
  #mf-shop .mfs-arrow:disabled{opacity:.3;cursor:default}
  #mf-shop .mfs-prev{left:0}#mf-shop .mfs-next{right:0}
  #mf-shop .mfs-card{position:relative;background:#fff8e4;border:2px solid #d9bf8c;border-radius:12px;display:flex;flex-direction:column;align-items:center;padding:6px 6px 8px;box-sizing:border-box;cursor:pointer;min-height:0;overflow:hidden}
  #mf-shop .mfs-card:hover,#mf-shop .mfs-card.sel{border-color:#f5a623;background:#fff2c6}
  #mf-shop .mfs-card h4{margin:0;font-size:17px;color:#4a2a0e;text-align:center;line-height:1.1;min-height:19px}
  #mf-shop .mfs-card .mfs-img{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center}
  #mf-shop .mfs-card .mfs-img img{max-width:88%;max-height:100%;object-fit:contain}
  #mf-shop .mfs-info{font:600 12.5px Arial,sans-serif;color:#5b3417;display:flex;gap:10px;align-items:center}
  #mf-shop .mfs-info img{width:15px;height:15px;vertical-align:-3px}
  #mf-shop .mfs-sell{font:600 12.5px Arial,sans-serif;color:#5b3417}
  #mf-shop .mfs-price{display:flex;align-items:center;gap:5px;font-size:24px;color:#3b260b;margin:2px 0}
  #mf-shop .mfs-price img{width:24px;height:24px}
  #mf-shop .mfs-buy{border:2px solid #2f6e1f;border-radius:10px;background:linear-gradient(#8ee05d,#4ea72e);color:#fff;font:700 16px Amfost,Arial,sans-serif;padding:4px 18px;cursor:pointer;
    text-shadow:-1px -1px 0 #2f6e1f,1px -1px 0 #2f6e1f,-1px 1px 0 #2f6e1f,1px 1px 0 #2f6e1f}
  #mf-shop .mfs-card.lock{filter:grayscale(.85);opacity:.75;cursor:default}
  #mf-shop .mfs-card.lock .mfs-buy{background:#9a9a9a;border-color:#666}
  #mf-shop .mfs-lock{position:absolute;top:24%;left:50%;transform:translateX(-50%);background:#3b260bdd;color:#ffe36b;padding:4px 12px;border-radius:10px;font-size:16px;white-space:nowrap;z-index:2}
  #mf-shop .mfs-preview{width:270px;flex:none;background:#fff8e4;border:2px solid #d9bf8c;border-radius:14px;padding:10px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;text-align:center}
  #mf-shop .mfs-preview .t{font-size:16px;color:#a4652f}
  #mf-shop .mfs-preview h3{margin:2px 0 6px;font-size:24px;color:#4a2a0e;font-weight:400}
  #mf-shop .mfs-preview .pic{width:100%;height:150px;border-radius:10px;background:radial-gradient(#7bd24f,#3f9a2c);display:flex;align-items:center;justify-content:center;overflow:hidden}
  #mf-shop .mfs-preview .pic img{max-width:92%;max-height:92%;object-fit:contain;filter:drop-shadow(0 4px 4px #0004)}
  #mf-shop .mfs-preview .mfs-info,#mf-shop .mfs-preview .mfs-sell{font-size:15px;margin-top:8px}
  #mf-shop .mfs-preview .mfs-price{font-size:30px}
  #mf-shop .mfs-preview p{font:600 13px Arial,sans-serif;color:#7a4a1f;margin:6px 0 0;border-top:1px solid #e3cfa5;padding-top:6px}
  #mf-shop .mfs-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#7a4a1f;text-align:center}
  #mf-shop .mfs-empty .big{font-size:54px;line-height:1}
  #mf-shop .mfs-empty .t1{font-size:34px;margin-top:10px;color:#a4652f}
  #mf-shop .mfs-empty .t2{font:600 16px Arial,sans-serif;margin-top:6px}
  #mf-shop .mfs-msg{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);background:#c0261b;color:#fff;border-radius:10px;padding:5px 14px;font:700 15px Arial,sans-serif;opacity:0;transition:opacity .2s;pointer-events:none;z-index:5}
  #mf-shop .mfs-msg.on{opacity:1}
  `;
  document.head.appendChild(css);

  // ================= TOAST =================
  let toastTimer = 0;
  function toast(text) {
    let el = $('mf-toast');
    if (!el) { el = document.createElement('div'); el.id = 'mf-toast'; document.body.appendChild(el); }
    el.textContent = text; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
  }

  // ================= MINI LOJA =================
  const TABS = [
    { k: 'promo', l: 'PROMO!' },
    { k: 'sementes', l: 'Sementes', subs: [['todos', 'Todos'], ['frutas', 'Frutas'], ['vegetais', 'Vegetais'], ['graos', 'Grãos'], ['flores', 'Flores']] },
    { k: 'animais', l: 'Animais' },
    { k: 'arvores', l: 'Árvores' },
    { k: 'construcoes', l: 'Construções' },
    { k: 'decoracoes', l: 'Decorações' },
    { k: 'veiculos', l: 'Veículos' },
    { k: 'upgrades', l: 'Upgrades' },
  ];
  const SUB = { arroz: 'graos', morango: 'frutas', abacaxi: 'frutas', melancia: 'frutas', cenoura: 'vegetais', beterraba: 'vegetais', soja: 'vegetais', espinafre: 'vegetais', cebola: 'vegetais', cana: 'vegetais', feijao: 'vegetais', milho: 'graos', trigo: 'graos', cafe: 'graos' };
  const CAT = { plantacoes: 'sementes', sementes: 'sementes', animais: 'animais', arvores: 'arvores', construcoes: 'construcoes', decoracoes: 'decoracoes', veiculos: 'veiculos', mini: 'upgrades', upgrades: 'upgrades', promo: 'promo' };
  // unidades que cada colheita manda para o Mini Baú (igual ao jogo)
  const YIELD = { milho: 6, cenoura: 5, morango: 3, trigo: 6, beterraba: 4, abacaxi: 5, cafe: 5, melancia: 4 };
  const DESC = {
    milho: 'Milho fresquinho, ótimo para encher o Mini Baú.',
    trigo: 'Trigo dourado que cresce rápido. Ideal para começar!',
    cenoura: 'A cenoura é uma grande fonte de fibra e vitamina A.',
    morango: 'Morangos vermelhinhos e doces, os favoritos da fazenda.',
    abacaxi: 'Abacaxi suculento: cada colheita rende vários frutos.',
    melancia: 'Melancia grande e refrescante para os dias de calor.',
    beterraba: 'Beterraba roxinha, cheia de nutrientes.',
    cafe: 'Café para acordar a fazenda inteira!',
  };
  const fmtTime = ms => {
    const m = Math.round((Number(ms) || 0) / 60000);
    if (!m) return '';
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), r = m % 60;
    if (h < 24) return h + ' h' + (r ? ' ' + r + ' min' : '');
    const d = Math.round(h / 24); return d + (d === 1 ? ' dia' : ' dias');
  };

  function readItems() {
    const cfg = window.MFAdapter?.project?.items || {};
    return [...document.querySelectorAll('#cards-grid > .card-item')]
      .filter(c => c.id !== 'item-terra' && c.dataset.editorHidden !== 'true' && !['terrenos', 'oculto'].includes(c.dataset.category))
      .map(card => {
        const id = card.id, tipo = id.replace(/^item-/, ''), conf = cfg[id] || {};
        const tab = CAT[card.dataset.category] || 'upgrades';
        const price = Number(card.dataset.preco) || 0, xp = Number(card.dataset.xp) || 0;
        const grow = Number(conf.growTime || card.dataset.growTime) || (typeof CROP_TIME_TABLE !== 'undefined' ? CROP_TIME_TABLE[tipo] : 0) || 0;
        let sell = null;
        if (tab === 'sementes') {
          const one = window.MFAdapter?.salePreview?.(price, xp, tipo)?.coins;
          if (Number.isFinite(one)) sell = one * (Number(conf.yieldCount) || Number(conf.yield) || YIELD[tipo] || 1);
        }
        return {
          card, id, tipo, tab, sub: SUB[tipo] || '',
          name: card.querySelector('span')?.textContent?.trim() || tipo,
          icon: card.querySelector('img')?.src || card.dataset.img || '',
          pic: tab === 'sementes' ? (card.dataset.img || card.querySelector('img')?.src) : (card.querySelector('img')?.src || card.dataset.img),
          price, xp, level: Math.max(1, Number(card.dataset.nivel || conf.level) || 1), grow, sell,
          desc: conf.description || DESC[tipo] || (tab === 'animais' ? 'Um novo amigo para a sua fazenda.' : 'Item especial para a sua fazenda.'),
        };
      });
  }

  let shop = null, state = { tab: 'sementes', sub: 'todos', page: 0, sel: null };
  function buildShop() {
    shop = document.createElement('div');
    shop.id = 'mf-shop';
    shop.innerHTML = `<div class="mfs-panel" role="dialog" aria-label="Mini Loja">
      <div class="mfs-head"><div class="mfs-wallet"><img alt=""><span class="mfs-coins">0</span></div>
        <div class="mfs-title">Mini Loja</div>
        <button class="mfs-close" type="button" aria-label="Fechar"><img alt="Fechar" src="https://i.postimg.cc/NfZ5Tcm1/icone-botao-fechar.png"></button></div>
      <div class="mfs-tabs"></div>
      <div class="mfs-paper"><div class="mfs-subs"></div><div class="mfs-body"></div><div class="mfs-msg"></div></div>
    </div>`;
    document.body.appendChild(shop);
    shop.addEventListener('click', e => { if (e.target === shop) closeShop(); });
    shop.querySelector('.mfs-close').addEventListener('click', closeShop);
    const tabs = shop.querySelector('.mfs-tabs');
    for (const t of TABS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mfs-tab' + (t.k === 'promo' ? ' promo' : ''); b.textContent = t.l; b.dataset.k = t.k;
      b.addEventListener('click', () => { state.tab = t.k; state.sub = 'todos'; state.page = 0; state.sel = null; render(); });
      tabs.appendChild(b);
    }
    window.addEventListener('resize', fit);
  }
  function fit() {
    if (!shop) return;
    const s = Math.min(1, (innerWidth - 24) / 960, (innerHeight - 24) / 600);
    const panel = shop.querySelector('.mfs-panel');
    panel.style.setProperty('--s', s); panel.style.transform = `scale(${s})`;
  }
  let msgTimer = 0;
  function shopMsg(t) { const m = shop.querySelector('.mfs-msg'); m.textContent = t; m.classList.add('on'); clearTimeout(msgTimer); msgTimer = setTimeout(() => m.classList.remove('on'), 1800); }

  function cardHTML(it, lv) {
    const lock = it.level > lv;
    return `<div class="mfs-card${lock ? ' lock' : ''}${state.sel === it.id ? ' sel' : ''}" data-id="${esc(it.id)}">
      ${lock ? `<div class="mfs-lock">🔒 Nível ${it.level}</div>` : ''}
      <h4>${esc(it.name)}</h4>
      <div class="mfs-img"><img alt="" src="${esc(it.icon)}"></div>
      <div class="mfs-info"><span><img alt="" src="${esc(starSrc())}"> ★ ${it.xp}</span>${it.grow ? `<span>⏱ ${fmtTime(it.grow)}</span>` : ''}</div>
      ${it.sell != null ? `<div class="mfs-sell">Colher por: <img alt="" style="width:14px;height:14px;vertical-align:-3px" src="${esc(coinSrc())}"> ${it.sell}</div>` : ''}
      <div class="mfs-price"><img alt="" src="${esc(coinSrc())}">${it.price}</div>
      <button class="mfs-buy" type="button">Comprar</button></div>`;
  }
  function previewHTML(it) {
    if (!it) return '<div class="mfs-preview"><div class="t">Prévia</div><p style="border:0">Toque em um item para ver os detalhes.</p></div>';
    return `<div class="mfs-preview"><div class="t">Prévia</div><h3>${esc(it.name)}</h3>
      <div class="pic"><img alt="" src="${esc(it.pic)}"></div>
      <div class="mfs-info"><span><img alt="" src="${esc(starSrc())}"> Estrelas: ${it.xp}</span>${it.grow ? `<span>⏱ ${fmtTime(it.grow)}</span>` : ''}</div>
      ${it.sell != null ? `<div class="mfs-sell">Colher e vender: <img alt="" style="width:15px;height:15px;vertical-align:-3px" src="${esc(coinSrc())}"> ${it.sell}</div>` : ''}
      <div class="mfs-price"><img alt="" src="${esc(coinSrc())}">${it.price}</div>
      ${it.level > 1 ? `<div class="mfs-sell">Disponível no nível ${it.level}</div>` : ''}
      <p>${esc(it.desc)}</p></div>`;
  }
  function render() {
    const lv = typeof playerLevel !== 'undefined' ? playerLevel : 1;
    shop.querySelector('.mfs-coins').textContent = typeof moedas !== 'undefined' ? moedas : '';
    shop.querySelector('.mfs-wallet img').src = coinSrc();
    shop.querySelectorAll('.mfs-tab').forEach(b => b.classList.toggle('on', b.dataset.k === state.tab));
    const tab = TABS.find(t => t.k === state.tab), subs = shop.querySelector('.mfs-subs'), body = shop.querySelector('.mfs-body');
    subs.innerHTML = ''; subs.style.display = tab.subs ? '' : 'none';
    for (const [k, l] of tab.subs || []) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mfs-sub' + (state.sub === k ? ' on' : ''); b.textContent = l;
      b.addEventListener('click', () => { state.sub = k; state.page = 0; state.sel = null; render(); }); subs.appendChild(b);
    }
    let list = readItems().filter(i => i.tab === state.tab).sort((a, b) => state.tab === 'sementes' ? (a.grow - b.grow) || (a.level - b.level) || (a.price - b.price) : (a.level - b.level) || (a.grow - b.grow) || (a.price - b.price));
    if (tab.subs && state.sub !== 'todos') list = list.filter(i => i.sub === state.sub);
    if (!list.length) {
      body.innerHTML = `<div class="mfs-empty"><div class="big">🚧</div><div class="t1">Em construção</div><div class="t2">Esta parte da loja chega em breve. Aguarde as novidades!</div></div>`;
      return;
    }
    const pages = Math.ceil(list.length / 6); state.page = Math.max(0, Math.min(state.page, pages - 1));
    const shown = list.slice(state.page * 6, state.page * 6 + 6);
    const sel = list.find(i => i.id === state.sel) || shown[0];
    state.sel = sel.id;
    body.innerHTML = `<div class="mfs-gridwrap"><button class="mfs-arrow mfs-prev" type="button" aria-label="Anterior" ${state.page ? '' : 'disabled'}>‹</button>
      <div class="mfs-grid">${shown.map(i => cardHTML(i, lv)).join('')}</div>
      <button class="mfs-arrow mfs-next" type="button" aria-label="Próxima" ${state.page < pages - 1 ? '' : 'disabled'}>›</button></div>${previewHTML(sel)}`;
    body.querySelector('.mfs-prev').onclick = () => { state.page--; render(); };
    body.querySelector('.mfs-next').onclick = () => { state.page++; render(); };
    body.querySelectorAll('.mfs-card').forEach(el => {
      const it = list.find(i => i.id === el.dataset.id);
      el.addEventListener('mouseenter', () => { if (state.sel !== it.id) { state.sel = it.id; body.querySelector('.mfs-preview').outerHTML = previewHTML(it); body.querySelectorAll('.mfs-card').forEach(c => c.classList.toggle('sel', c === el)); } });
      el.addEventListener('click', e => {
        e.stopPropagation();
        if (!e.target.closest('.mfs-buy')) { state.sel = it.id; render(); return; }
        buy(it, lv);
      });
    });
  }
  function buy(it, lv) {
    if (it.level > lv) { shopMsg(`Disponível a partir do nível ${it.level}`); return; }
    if ((typeof moedas !== 'undefined' ? moedas : 0) < it.price) { shopMsg('Moedas insuficientes'); return; }
    closeShop();
    stopHoe();
    // depois que este clique terminar, usa a compra original do jogo (modo colocar)
    setTimeout(() => it.card.click(), 0);
  }
  function openShop() {
    if (!shop) buildShop();
    try { window.atualizarBloqueioLoja?.(); } catch (e) { }
    state.page = 0; fit(); render(); shop.classList.add('on');
  }
  function closeShop() { shop?.classList.remove('on'); }
  window.MFShop = { open: openShop, close: closeShop };

  function hookShopButton() {
    const btn = $('btn-loja'); if (!btn || btn.dataset.mfShop) return;
    btn.dataset.mfShop = '1';
    btn.addEventListener('click', e => {
      if (editing()) return; // no editor continua a loja antiga
      e.preventDefault(); e.stopImmediatePropagation();
      if (visiting()) return;
      openShop();
    }, true);
  }

  // ================= ENXADA =================
  let hoeOn = false;
  const HOE_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs>
    <linearGradient id="mfhg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8ec82"/><stop offset="1" stop-color="#5dbb3e"/></linearGradient>
    <linearGradient id="mfhb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef3f6"/><stop offset="1" stop-color="#8d9aa3"/></linearGradient></defs>
    <rect x="3" y="3" width="58" height="58" rx="13" fill="#2f6e1f"/><rect x="5" y="5" width="54" height="52" rx="11" fill="url(#mfhg)"/>
    <rect x="9" y="8" width="46" height="10" rx="5" fill="#fff" opacity=".22"/>
    <path d="M17 51 L44 17" stroke="#5a3417" stroke-width="7" stroke-linecap="round"/><path d="M17 51 L44 17" stroke="#b27a42" stroke-width="4" stroke-linecap="round"/>
    <path d="M38 12 C46 9 54 13 56 20 L47 24 C46 20 43 17 38 17 Z" fill="url(#mfhb)" stroke="#4b555c" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="42" cy="18" r="3" fill="#6b4a2a"/></svg>`;
  function buildHoe() {
    if ($('btn-enxada') || visiting()) return;
    const b = document.createElement('button');
    b.id = 'btn-enxada'; b.type = 'button'; b.title = 'Enxada: arar a terra'; b.setAttribute('aria-label', 'Enxada: arar a terra');
    b.innerHTML = HOE_SVG; document.body.appendChild(b);
    b.addEventListener('click', e => { e.stopPropagation(); hoeOn ? stopHoe() : startHoe(); });
  }
  function startHoe() {
    const card = $('item-terra'); if (!card) return;
    const price = Number(card.dataset.basepreco || card.dataset.preco || 0);
    if ((typeof moedas !== 'undefined' ? moedas : 0) < price) { toast('Moedas insuficientes para arar'); return; }
    card.click(); // ativa o modo colocar com a terra, igual à loja antiga
    if (typeof modoColocar !== 'undefined' && modoColocar && placingItem?.id === 'item-terra') {
      hoeOn = true; $('btn-enxada')?.classList.add('ativo');
      toast('Clique na grama para arar. Toque na enxada de novo para parar.');
    }
  }
  function stopHoe() {
    if (!hoeOn) return;
    hoeOn = false; $('btn-enxada')?.classList.remove('ativo');
    try {
      if (typeof modoColocar !== 'undefined' && placingItem?.id === 'item-terra') {
        modoColocar = false; placingItem = null; continuousSelection = false; preview.active = false; requestRedraw();
        document.querySelectorAll('.card-item').forEach(c => c.style.outline = '');
      }
    } catch (e) { }
  }
  window.MFHoe = { start: startHoe, stop: stopHoe, active: () => hoeOn };
  // Depois de colocar a terra com a enxada, o personagem já vai arar.
  function hookSpawn() {
    if (typeof window.trySpawnProprioAt !== 'function' || window.trySpawnProprioAt._mf) return;
    const orig = window.trySpawnProprioAt;
    const wrapped = function (gx, gy) {
      const before = terrenos.length, ok = orig.apply(this, arguments);
      if (ok && hoeOn && terrenos.length > before) {
        const t = terrenos[terrenos.length - 1];
        if (t && String(t.imgSrc).includes('terra-seca')) { try { queueArar(t); } catch (e) { } }
      }
      return ok;
    };
    wrapped._mf = true; window.trySpawnProprioAt = wrapped;
  }
  // mantém o botão em sincronia (Esc / clique direito cancelam o modo)
  setInterval(() => {
    if (hoeOn && (typeof modoColocar === 'undefined' || !modoColocar || placingItem?.id !== 'item-terra')) { hoeOn = false; $('btn-enxada')?.classList.remove('ativo'); }
  }, 300);


  // ================= MENU DA DIREITA (tudo junto) =================
  const tile = (inner) => `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="mfg$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8ec82"/><stop offset="1" stop-color="#5dbb3e"/></linearGradient></defs>
    <rect x="3" y="3" width="58" height="58" rx="13" fill="#2f6e1f"/><rect x="5" y="5" width="54" height="52" rx="11" fill="url(#mfg$)"/><rect x="9" y="8" width="46" height="10" rx="5" fill="#fff" opacity=".22"/>${inner}</svg>`;
  let tileN = 0; const mkTile = inner => tile(inner).replace(/mfg\$/g, 'mfg' + (++tileN));
  const GIFT = `<rect x="16" y="28" width="32" height="24" rx="3" fill="#e8463c" stroke="#7a1b14" stroke-width="2.5"/><rect x="13" y="22" width="38" height="9" rx="3" fill="#ff6a5c" stroke="#7a1b14" stroke-width="2.5"/>
    <rect x="29" y="22" width="6" height="30" fill="#ffd84a" stroke="#8a6a10" stroke-width="1.5"/><path d="M32 22 C24 12 16 16 22 22 Z M32 22 C40 12 48 16 42 22 Z" fill="#ffd84a" stroke="#8a6a10" stroke-width="2"/>`;
  window.MFMenuTile = inner => mkTile(inner);
  const BARN = `<path d="M13 30 L32 15 L51 30 L51 52 L13 52 Z" fill="#d6372c" stroke="#6e1712" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 31 L32 13 L54 31" fill="none" stroke="#fff3e0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="24" y="34" width="16" height="18" fill="#8a2a20" stroke="#fff3e0" stroke-width="2.5"/><path d="M24 34 L40 52 M40 34 L24 52" stroke="#fff3e0" stroke-width="2"/><rect x="28" y="22" width="8" height="7" fill="#fff3e0" stroke="#6e1712" stroke-width="1.5"/>`;
  const blue = sym => `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="1.5" y="1.5" width="37" height="37" rx="9" fill="#1d5fa8"/><rect x="3" y="3" width="34" height="32" rx="8" fill="#3d9cf0"/><rect x="6" y="5" width="28" height="7" rx="3.5" fill="#fff" opacity=".3"/>${sym}</svg>`;
  function zoomBy(f) {
    try {
      const cam = window.MFAdapter?.project?.camera || {}, sx = canvas.width / 2, sy = canvas.height / 2;
      const wx = (sx - canvas.width / 2 - offsetX) / zoom, wy = (sy - canvas.height / 3 - offsetY) / zoom;
      zoom = Math.min(Number(cam.maxZoom) || 1.6, Math.max(Number(cam.minZoom) || 0.25, zoom * f));
      offsetX = sx - canvas.width / 2 - wx * zoom; offsetY = sy - canvas.height / 3 - wy * zoom;
      window.MFAdapter?.clampCamera?.(); try { updateTruckDomPosition(); } catch (e) { } requestRedraw();
    } catch (e) { }
  }
  function buildMenu() {
    if ($('mf-menu') || editing()) return;
    const loja = $('btn-loja'); if (!loja) return;
    const m = document.createElement('div'); m.id = 'mf-menu';
    m.innerHTML = `<div class="mfm-top"></div><div class="mfm-main"><div class="mfm-loja"></div><div class="mfm-tools"></div></div>`;
    document.body.appendChild(m);
    const top = m.querySelector('.mfm-top'), tools = m.querySelector('.mfm-tools');
    const btn = (id, title, html, fn) => { const b = document.createElement('button'); b.id = id; b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = html; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
    top.append(
      btn('mf-zoom-in', 'Aproximar', blue('<path d="M20 11 V29 M11 20 H29" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'), () => zoomBy(1.2)),
      btn('mf-zoom-out', 'Afastar', blue('<path d="M11 20 H29" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'), () => zoomBy(1 / 1.2)));
    for (const id of ['btn-fullscreen', 'btn-config']) { const el = $(id); if (el) top.appendChild(el); }
    m.querySelector('.mfm-loja').appendChild(loja);
    const soon = name => () => toast(`${name}: em construção. Chega em breve!`);
    const order = [$('btn-mover'), $('btn-enxada'), $('btn-trator'), $('btn-bau'),
      btn('mf-btn-presente', 'Presentes', mkTile(GIFT), soon('Presentes')), btn('mf-btn-celeiro', 'Celeiro', mkTile(BARN), soon('Celeiro'))];
    for (const el of order) if (el) tools.appendChild(el);
    const bau = $('btn-bau'); if (bau) bau.classList.add('mfm-tile');
  }


  // ================= AMIZADES (barra de baixo + janela) =================
  const FR = () => window.MFHost?.friends || null;
  let frState = { code: '', friends: [], requests: [], sent: [], ready: false }, frOpen = false, frPage = 0, frExpanded = false;
  const COLORS = ['#e8463c', '#f39c12', '#27ae60', '#2980b9', '#8e44ad', '#16a085', '#d35400', '#c0392b'];
  const avColor = k => { let h = 0; for (const c of String(k || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
  const initial = n => esc((String(n || '?').trim()[0] || '?').toUpperCase());
  const RANK = ['#f5b301', '#a7b1ba', '#c97a3a'];
  function myInfo() { return { name: window.__farmName || 'Minha fazenda', level: typeof playerLevel !== 'undefined' ? playerLevel : 1 }; }
  function copyId() {
    const code = frState.code || FR()?.myCode?.(); if (!code) { toast('Seu ID aparece quando você entra na conta'); return; }
    const done = () => toast(`ID #${code} copiado! Mande para os amigos.`);
    try { navigator.clipboard.writeText('#' + code).then(done, () => toast(`Seu ID: #${code}`)); } catch (e) { toast(`Seu ID: #${code}`); }
  }
  function updateHudId() {
    const box = $('hud-fazenda-text'); if (!box || visiting()) return;
    const code = frState.code || FR()?.myCode?.() || '';
    let el = $('mf-hud-id');
    if (!code) { el?.remove(); return; }
    if (!el) { el = document.createElement('span'); el.id = 'mf-hud-id'; el.title = 'Seu ID de amigo (toque para copiar)'; el.addEventListener('click', e => { e.stopPropagation(); copyId(); }); box.appendChild(el); }
    el.textContent = '#' + code;
  }
  function buildFriendsBar() {
    if ($('mf-amigos') || visiting() || editing()) return;
    const bar = document.createElement('div'); bar.id = 'mf-amigos';
    bar.innerHTML = `<button class="mfa-head" type="button" aria-label="Amigos"><b>👥</b>Amigos<span class="mfa-badge" hidden></span></button>
      <div class="mfa-cards"></div>
      <div class="mfa-arrows"><button class="mfa-arrow mfa-more" type="button" aria-label="Mostrar mais amigos">▶</button><button class="mfa-arrow mfa-back" type="button" aria-label="Voltar">◀</button></div>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', e => e.stopPropagation());
    bar.querySelector('.mfa-head').addEventListener('click', () => openFriends());
    bar.querySelector('.mfa-more').addEventListener('click', () => {
      const per = frExpanded ? 7 : 3, pages = Math.max(1, Math.ceil(frState.friends.length / 7));
      if (!frExpanded) { frExpanded = true; frPage = 0; } else if (frPage < pages - 1) frPage++;
      renderBar();
    });
    bar.querySelector('.mfa-back').addEventListener('click', () => { if (frExpanded && frPage > 0) frPage--; else { frExpanded = false; frPage = 0; } renderBar(); });
    renderBar();
  }
  function friendCard(f, rank) {
    return `<div class="mfa-card">${rank < 3 ? `<span class="mfa-rank" style="background:${RANK[rank]}">${rank + 1}</span>` : ''}
      <div class="mfa-av" style="background:${avColor(f.code || f.uid)}">${initial(f.name)}</div>
      <div class="mfa-name" title="${esc(f.name)}">${esc(f.name)}</div><div class="mfa-lv">★ Nível ${f.level}</div>
      <button class="mfa-visit" type="button" data-uid="${esc(f.uid)}">Visitar</button></div>`;
  }
  function renderBar() {
    const bar = $('mf-amigos'); if (!bar) return;
    const per = frExpanded ? 7 : 3, list = frState.friends, start = frExpanded ? frPage * 7 : 0;
    const shown = list.slice(start, start + per);
    let html = shown.map((f, i) => friendCard(f, start + i)).join('');
    for (let i = shown.length; i < per; i++) html += `<div class="mfa-card mfa-empty" role="button" tabindex="0"><span class="mfa-rank">${start + i + 1}</span><svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" style="opacity:.4"><circle cx="24" cy="14" r="9" fill="#816746"/><path d="M7 43v-7c0-17 34-17 34 0v7Z" fill="#816746"/></svg>Adicionar amigo</div>`;
    bar.querySelector('.mfa-cards').innerHTML = html;
    bar.querySelectorAll('.mfa-empty').forEach(el => el.addEventListener('click', () => openFriends(true)));
    bar.querySelectorAll('.mfa-visit').forEach(b => b.addEventListener('click', () => visitFriend(b.dataset.uid)));
    const badge = bar.querySelector('.mfa-badge'), n = frState.requests.length;
    badge.hidden = !n; badge.textContent = n;
    const pages = Math.max(1, Math.ceil(list.length / 7));
    bar.querySelector('.mfa-more').disabled = frExpanded && frPage >= pages - 1;
    bar.querySelector('.mfa-back').disabled = !frExpanded;
  }
  async function visitFriend(uid) {
    const F = FR(); if (!F) { toast('Na versão online, isso abre a fazenda do seu amigo.'); return; }
    try { closeFriends(); await F.visit(uid); } catch (e) { toast(e?.message || 'Não foi possível abrir a fazenda.'); }
  }
  function buildFriendsDialog() {
    if ($('mf-amigos-dlg')) return;
    const d = document.createElement('div'); d.id = 'mf-amigos-dlg';
    d.innerHTML = `<div class="mfd" role="dialog" aria-label="Amigos"><button class="x" type="button" aria-label="Fechar"><img alt="Fechar" src="https://i.postimg.cc/NfZ5Tcm1/icone-botao-fechar.png"></button>
      <h2>Amigos</h2>
      <section><h3>Seu ID de amigo</h3><div class="myid"><strong class="mfd-code">——</strong><button class="btn sec mfd-copy" type="button">Copiar</button></div>
        <p class="hint">Mande esse número para os seus amigos te adicionarem.</p></section>
      <section><h3>Adicionar amigo</h3><div class="line"><input class="mfd-input" inputmode="numeric" maxlength="7" placeholder="#000000" aria-label="ID do amigo"><button class="btn mfd-send" type="button">Enviar convite</button></div><div class="msg mfd-msg"></div></section>
      <section><h3>Convites recebidos</h3><div class="mfd-reqs"></div></section>
      <section><h3 class="mfd-ftitle">Seus amigos</h3><div class="mfd-friends"></div></section></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', e => { e.stopPropagation(); if (e.target === d) closeFriends(); });
    d.addEventListener('keydown', e => e.stopPropagation());
    d.querySelector('.x').addEventListener('click', closeFriends);
    d.querySelector('.mfd-copy').addEventListener('click', copyId);
    const input = d.querySelector('.mfd-input'), msg = d.querySelector('.mfd-msg'), send = d.querySelector('.mfd-send');
    const doSend = async () => {
      const F = FR(); msg.className = 'msg mfd-msg';
      if (!F) { msg.classList.add('err'); msg.textContent = 'Entre na sua conta para adicionar amigos.'; return; }
      send.disabled = true; msg.textContent = 'Enviando…';
      try { msg.classList.add('ok'); msg.textContent = await F.sendInvite(input.value, myInfo()); input.value = ''; }
      catch (e) { msg.className = 'msg mfd-msg err'; msg.textContent = e?.message || 'Não foi possível enviar.'; }
      finally { send.disabled = false; }
    };
    send.addEventListener('click', doSend);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    input.addEventListener('input', () => { const v = input.value.replace(/\D/g, '').slice(0, 6); input.value = v ? '#' + v : ''; });
  }
  function renderDialog() {
    const d = $('mf-amigos-dlg'); if (!d) return;
    d.querySelector('.mfd-code').textContent = frState.code ? '#' + frState.code : (FR() ? 'carregando…' : '—');
    const reqs = d.querySelector('.mfd-reqs'), fr = d.querySelector('.mfd-friends');
    reqs.innerHTML = frState.requests.length ? frState.requests.map(r => `<div class="row"><div class="av" style="background:${avColor(r.code || r.uid)}">${initial(r.name)}</div>
      <div class="who"><b>${esc(r.name)}</b><small>#${esc(r.code)} · Nível ${r.level}</small></div>
      <button class="btn" type="button" data-ok="${esc(r.uid)}">Aceitar</button><button class="btn no" type="button" data-no="${esc(r.uid)}">Recusar</button></div>`).join('')
      : '<div class="none">Nenhum convite por enquanto.</div>';
    d.querySelector('.mfd-ftitle').textContent = `Seus amigos (${frState.friends.length})`;
    fr.innerHTML = frState.friends.length ? frState.friends.map((f, i) => `<div class="row"><div class="av" style="background:${avColor(f.code || f.uid)}">${initial(f.name)}</div>
      <div class="who"><b>${i + 1}º ${esc(f.name)}</b><small>${f.code ? '#' + esc(f.code) + ' · ' : ''}Nível ${f.level} · ${f.xp} ★</small></div>
      <button class="btn" type="button" data-visit="${esc(f.uid)}">Visitar</button><button class="btn sec" type="button" data-rm="${esc(f.uid)}">Remover</button></div>`).join('')
      : '<div class="none">Você ainda não tem amigos na fazenda. Mande seu ID para alguém!</div>';
    const F = FR(), act = async (fn, btn) => { if (!F) return; btn.disabled = true; try { await fn(); } catch (e) { toast(e?.message || 'Não deu certo. Tente de novo.'); btn.disabled = false; } };
    reqs.querySelectorAll('[data-ok]').forEach(b => b.addEventListener('click', () => act(() => F.accept(b.dataset.ok), b)));
    reqs.querySelectorAll('[data-no]').forEach(b => b.addEventListener('click', () => act(() => F.decline(b.dataset.no), b)));
    fr.querySelectorAll('[data-visit]').forEach(b => b.addEventListener('click', () => visitFriend(b.dataset.visit)));
    fr.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.sure) act(() => F.remove(b.dataset.rm), b); else { b.dataset.sure = '1'; b.textContent = 'Tem certeza?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Remover'; } }, 3000); }
    }));
  }
  function openFriends(focusAdd) {
    buildFriendsDialog(); renderDialog(); $('mf-amigos-dlg').classList.add('on'); frOpen = true;
    try { FR()?.refresh?.(); } catch (err) { }
    if (focusAdd) setTimeout(() => $('mf-amigos-dlg')?.querySelector('.mfd-input')?.focus(), 50);
  }
  function closeFriends() { $('mf-amigos-dlg')?.classList.remove('on'); frOpen = false; }
  window.MFFriendsUI = { open: openFriends, close: closeFriends };
  let frSubscribed = false;
  function hookFriends() {
    if (visiting() || editing()) return;
    buildFriendsBar(); updateHudId();
    const F = FR();
    if (F && !frSubscribed) {
      frSubscribed = true;
      F.subscribe(st => { frState = { ...frState, ...st }; renderBar(); if (frOpen) renderDialog(); updateHudId(); });
    }
  }


  // ================= PERSONAGEM (Menino / Menina) =================
  // A Menina usa a mesma programação do Menino; só as imagens mudam.
  const CHAR_GIRL = { idle: 'assets/menina/parada.gif', back: 'assets/menina/costas.png', plow: 'assets/menina/arando.png', walkFront: 'assets/menina/andando-frente.gif', walkBack: 'assets/menina/andando-costas.gif', card: 'assets/menina/frente.png' };
  let CHAR_BOY = null;
  function rememberBoy() {
    if (CHAR_BOY) return;
    try {
      CHAR_BOY = { idle: spriteFront.src, back: spriteBack.src, plow: spriteArando.src, walkFront: mfHumanWalk.playerFront.src, walkBack: mfHumanWalk.playerBack.src, card: 'assets/b86748633e6ac8337f3b-personagem-de-frente.png' };
    } catch (e) { }
  }
  function applyCharacter(kind) {
    rememberBoy(); if (!CHAR_BOY) return;
    const c = kind === 'menina' ? CHAR_GIRL : CHAR_BOY;
    window.__mfCharacter = kind === 'menina' ? 'menina' : 'menino';
    try {
      if (spriteFront.src !== new URL(c.idle, location.href).href) spriteFront.src = c.idle;
      if (spriteBack.src !== new URL(c.back, location.href).href) spriteBack.src = c.back;
      if (spriteArando.src !== new URL(c.plow, location.href).href) spriteArando.src = c.plow;
      if (c.walkFront && mfHumanWalk.playerFront.src !== new URL(c.walkFront, location.href).href) mfHumanWalk.playerFront.src = c.walkFront;
      if (c.walkBack && mfHumanWalk.playerBack.src !== new URL(c.walkBack, location.href).href) mfHumanWalk.playerBack.src = c.walkBack;
      if (!player.path?.length && !player.acaoAtual) player.currentSprite = mfHumanSprite(player, false, false);
      requestRedraw();
    } catch (e) { console.warn('[personagem]', e); }
    document.querySelectorAll('.mf-cfg-chars button').forEach(b => b.classList.toggle('sel', b.dataset.k === window.__mfCharacter));
  }
  function chooseCharacter(kind) {
    applyCharacter(kind);
    $('mf-char')?.classList.remove('on');
    try { window.MFHost?.changed?.('character'); } catch (e) { }
  }
  function showCharacterPicker() {
    rememberBoy();
    let el = $('mf-char');
    if (!el) {
      el = document.createElement('div'); el.id = 'mf-char';
      el.innerHTML = `<div class="box"><h2>Escolha seu personagem</h2><div class="opts">
        <button class="opt" type="button" data-k="menino"><img alt="" src="${esc(CHAR_BOY?.card || '')}"><span>Menino</span></button>
        <button class="opt" type="button" data-k="menina"><img alt="" src="${esc(CHAR_GIRL.card)}"><span>Menina</span></button></div></div>`;
      document.body.appendChild(el);
      el.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('.opt'); if (b) chooseCharacter(b.dataset.k); });
    }
    el.classList.add('on');
  }
  window.MFCharacter = { apply: applyCharacter, choose: chooseCharacter, pick: showCharacterPicker, get: () => window.__mfCharacter || 'menino', init: () => hookCharacter() };
  function hookCharacter() {
    if (editing()) return;
    rememberBoy();
    if (window.__mfCharacter) applyCharacter(window.__mfCharacter);
    else if (!visiting()) showCharacterPicker(); // conta nova ou save antigo: escolhe uma vez
  }


  // ================= FERTILIZAR (amizade) =================
  const FERT_BOOST = 0.35;
  function sparkleAt(x, y, host = document.body) {
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('div'); s.className = 'mf-spark'; s.textContent = i % 2 ? '✨' : '🌱';
      s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', ((i - 3) * 16) + 'px'); s.style.animationDelay = (i * 60) + 'ms';
      host.appendChild(s); setTimeout(() => s.remove(), 1600);
    }
  }
  function tileScreen(t) {
    const p = gridToScreen(t.gx + ((t.w || 1) - 1) / 2, t.gy + ((t.h || 1) - 1) / 2), r = canvas.getBoundingClientRect();
    return { x: r.left + canvas.width / 2 + offsetX + p.x * zoom, y: r.top + canvas.height / 3 + offsetY + p.y * zoom };
  }
  function boost(t) {
    const c = t.cultura; const total = Number(c.totalTime) || 0; if (!total) return false;
    c.startTime = (Number(c.startTime) || Date.now()) - Math.round(total * FERT_BOOST);
    c.fertilizada = true;
    try { startGrowthTimer(t); } catch (e) { } requestRedraw(); return true;
  }
  const growing = t => t && t.cultura && String(t.cultura.tipo) !== 'morta' && t.cultura.etapa !== 2;
  // Dono: aplica o que os amigos mandaram.
  window.MFFertilize = {
    apply(list) {
      const by = {};
      for (const e of list || []) {
        const t = findTerrainAt(e.gx, e.gy);
        if (growing(t) && !t.cultura.fertilizada && boost(t)) { by[e.name] = (by[e.name] || 0) + 1; const q = tileScreen(t); sparkleAt(q.x, q.y); }
      }
      const names = Object.entries(by);
      if (names.length) toast(names.map(([n, k]) => `${n} fertilizou ${k} plantaç${k > 1 ? 'ões' : 'ão'} sua${k > 1 ? 's' : ''}!`).join(' ') + ' 🌱 +35%');
      return true;
    }
  };
  // Visitante: barra com 5 fertilizantes POR AMIGO (voltam 24h depois do primeiro uso nessa fazenda).
  const FERT_IMG = 'assets/fertilizante/saco.png', FERT_POUR = 'assets/fertilizante/despejar.webp', FERT_FRAMES = 29, FERT_MAX = 5;
  let visitBar = null, fertLeft = null, fertBusy = false, fertResetAt = 0, fertTimer = 0, holding = true, cursorEl = null;
  try { new Image().src = FERT_POUR; } catch (e) { }
  function fmtWait(ms) {
    const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60);
    return h ? `${h}h ${String(m % 60).padStart(2, '0')}min` : `${m} min`;
  }
  function renderVisitBar(extra) {
    if (!visitBar) return;
    const left = fertLeft == null ? null : fertLeft;
    let bags = '';
    for (let i = 0; i < FERT_MAX; i++) bags += `<img src="${FERT_IMG}" alt="" draggable="false"${left != null && i >= left ? ' class="used"' : ''}>`;
    let msg = extra;
    if (!msg) {
      if (left == null) msg = 'Carregando fertilizantes…';
      else if (left === 0) msg = fertResetAt ? `Acabaram nessa fazenda! Voltam em ${fmtWait(fertResetAt - Date.now())}` : 'Acabaram nessa fazenda por hoje.';
      else if (!holding) msg = 'Toque aqui para pegar o fertilizante';
      else msg = 'Toque numa plantação crescendo · cada um acelera 35%';
    }
    visitBar.classList.toggle('empty', left === 0);
    visitBar.classList.toggle('holding', holding && left > 0);
    visitBar.innerHTML = `<div class="mfv-title">🌱 <b>Fertilizante</b> <span class="mfv-count">${left == null ? '…' : left}/${FERT_MAX}</span></div><div class="mfv-bags">${bags}</div><small>${msg}</small>`;
    syncCursor();
  }
  // Cursor de saco de fertilizante (no PC). No celular a barra mostra que está "segurando".
  const finePointer = () => !window.matchMedia || window.matchMedia('(pointer:fine)').matches;
  function syncCursor(x, y) {
    if (!cursorEl) return;
    const on = holding && fertLeft > 0 && !fertBusy && finePointer();
    cursorEl.style.display = on && cursorEl.dataset.in === '1' ? 'block' : 'none';
    const cover = document.getElementById('mf-visit-cover'); if (cover) cover.style.cursor = on ? 'none' : '';
    if (x != null) { cursorEl.style.left = x + 'px'; cursorEl.style.top = y + 'px'; }
  }
  // Animação: o saco vira em cima da plantação e cai a purpurina.
  function pourAt(q) {
    return new Promise(done => {
      const host = document.getElementById('mf-visit-cover') || document.body;
      const el = document.createElement('div'); el.className = 'mf-fert-pour'; host.appendChild(el);
      const size = el.getBoundingClientRect().width || 130;
      // na arte, o saco fica em (50%, 35%) e a terra cai perto de (45%, 85%)
      el.style.left = (q.x - size * .40) + 'px'; el.style.top = (q.y - size * .86) + 'px';
      const t0 = performance.now(), fps = 30; let soilDone = false;
      (function step(now) {
        const f = Math.floor((now - t0) / 1000 * fps);
        if (f >= FERT_FRAMES) { el.remove(); if (!soilDone) done(); return; }
        el.style.backgroundPositionX = (-f * size) + 'px';
        if (!soilDone && f >= 14) { soilDone = true; done(); } // terra já caiu: aplica o efeito
        requestAnimationFrame(step);
      })(t0);
    });
  }
  window.MFVisit = {
    async init(cover) {
      const owner = window.MFHost?.visitingUid?.();
      if (!FR()?.fertilize || !owner) return;
      visitBar = document.createElement('div'); visitBar.id = 'mf-visit-bar'; cover.appendChild(visitBar);
      cursorEl = document.createElement('div'); cursorEl.id = 'mf-fert-cursor'; cover.appendChild(cursorEl);
      // a barra não deixa o toque "vazar" para a plantação de baixo; tocar nela pega/solta o fertilizante
      for (const ev of ['pointerdown', 'pointerup', 'click']) visitBar.addEventListener(ev, e => {
        e.stopPropagation();
        if (ev === 'click' && fertLeft > 0) { holding = !holding; renderVisitBar(); }
      });
      cover.addEventListener('pointermove', e => { if (cursorEl) { cursorEl.dataset.in = '1'; syncCursor(e.clientX, e.clientY); } });
      cover.addEventListener('pointerleave', () => { if (cursorEl) { cursorEl.dataset.in = '0'; syncCursor(); } });
      renderVisitBar();
      try {
        const r = await FR().fertilizeLeft(owner);
        fertLeft = r.left; fertResetAt = r.resetIn ? Date.now() + r.resetIn : 0; renderVisitBar();
      } catch (e) { fertLeft = null; renderVisitBar(e?.message || 'Fertilizante indisponível agora.'); }
      clearInterval(fertTimer); fertTimer = setInterval(() => { if (fertLeft === 0) renderVisitBar(); }, 30000);
    },
    async tap(x, y) {
      const F = FR(), owner = window.MFHost?.visitingUid?.(); if (!F?.fertilize || !owner || fertBusy) return;
      if (!holding) { renderVisitBar(); return; }
      const r = canvas.getBoundingClientRect();
      const tile = screenPointToTile((x - r.left - canvas.width / 2 - offsetX) / zoom, (y - r.top - canvas.height / 3 - offsetY) / zoom);
      const t = findTerrainAt(tile.gx, tile.gy), host = document.getElementById('mf-visit-cover') || document.body;
      if (!t || !t.cultura) return;
      if (String(t.cultura.tipo) === 'morta') { renderVisitBar('Essa plantação já secou, não dá para fertilizar.'); return; }
      if (t.cultura.etapa === 2) { renderVisitBar('Essa já está pronta para colher!'); return; }
      if (t.cultura.fertilizada) { renderVisitBar('Essa plantação já foi fertilizada.'); return; }
      if (fertLeft === 0) { renderVisitBar(); return; }
      fertBusy = true; syncCursor();
      try {
        const res = await F.fertilize(owner, { gx: t.gx, gy: t.gy });
        const q = { x, y }; // despeja onde o jogador tocou
        await pourAt(q);
        fertLeft = res.left; if (res.resetIn) fertResetAt = Date.now() + res.resetIn;
        boost(t); sparkleAt(q.x, q.y, host);
        renderVisitBar(fertLeft ? `Fertilizada! +35% de crescimento` : undefined);
      } catch (e) { if (/fertilizantes nessa fazenda/.test(e?.message || '')) fertLeft = 0; renderVisitBar(e?.message || 'Não deu para fertilizar.'); }
      finally { fertBusy = false; syncCursor(); }
    },
  };

  // ================= CONFIGURAÇÕES =================
  function buildSettings() {
    const box = document.querySelector('#config-content h3')?.parentElement;
    if (!box || box.dataset.mfExtras) return;
    box.dataset.mfExtras = '1';
    const title = box.querySelector('h3');
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="mf-cfg-row"><label for="mf-cfg-nome">Nome da fazenda</label>
        <div class="mf-cfg-line"><input id="mf-cfg-nome" maxlength="12" autocomplete="off" placeholder="Até 12 letras"><button id="mf-cfg-salvar" type="button">Salvar</button></div>
        <div class="mf-cfg-ok" id="mf-cfg-ok"></div></div>
      <div class="mf-cfg-row"><label>Personagem</label><div class="mf-cfg-chars">
        <button type="button" data-k="menino"><img alt="" src="assets/b86748633e6ac8337f3b-personagem-de-frente.png">Menino</button>
        <button type="button" data-k="menina"><img alt="" src="assets/menina/frente.png">Menina</button></div></div>
      <div class="mf-cfg-row"><label>Som</label><div id="mf-cfg-audio"></div></div>`;
    title.after(...wrap.children);
    box.style.minWidth = '280px';
    // texto antigo sobre salvar no navegador
    box.querySelectorAll('p,small,div').forEach(el => { if (/salvo neste navegador/i.test(el.textContent) && !el.children.length) el.textContent = 'Seu progresso é salvo na sua conta.'; });
    const input = $('mf-cfg-nome'), ok = $('mf-cfg-ok');
    const save = () => {
      const clean = input.value.replace(/\s+/g, ' ').trim().slice(0, 12);
      if (!clean) { ok.style.color = '#ffb3a8'; ok.textContent = 'Digite um nome.'; return; }
      window.__farmName = clean; window.atualizarNomeFazenda?.(); updateHudId();
      try { window.MFHost?.changed?.('farm_name'); } catch (e) { }
      ok.style.color = ''; ok.textContent = 'Nome salvo!'; setTimeout(() => { ok.textContent = ''; }, 2000);
    };
    $('mf-cfg-salvar').addEventListener('click', e => { e.stopPropagation(); save(); });
    box.querySelectorAll('.mf-cfg-chars button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); chooseCharacter(b.dataset.k); }));
    input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') save(); });
    moveAudio();
  }
  function moveAudio() {
    const ui = $('mf-audio-player'), slot = $('mf-cfg-audio');
    if (ui && slot && ui.parentElement !== slot && !editing()) slot.appendChild(ui);
  }
  function hookSettingsOpen() {
    const btn = $('btn-config'); if (!btn || btn.dataset.mfCfg) return;
    btn.dataset.mfCfg = '1';
    btn.addEventListener('click', () => {
      buildSettings(); moveAudio();
      const input = $('mf-cfg-nome'); if (input) input.value = window.__farmName || '';
      document.querySelectorAll('.mf-cfg-chars button').forEach(b => b.classList.toggle('sel', b.dataset.k === (window.__mfCharacter || 'menino')));
    }, true);
  }

  // ================= INICIALIZAÇÃO =================
  function init() {
    if (visiting()) document.body.classList.add('mf-visit');
    hookShopButton(); buildHoe(); hookSpawn(); buildSettings(); hookSettingsOpen(); buildMenu(); hookFriends();
    try { window.updateXPUI?.(); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  setTimeout(init, 300); // o bootstrap do projeto roda em setTimeout(0)
  // o som é criado depois; move assim que aparecer
  let tries = 0; const iv = setInterval(() => { moveAudio(); if ($('mf-audio-player')?.parentElement?.id === 'mf-cfg-audio' || ++tries > 40) clearInterval(iv); }, 250);
})();
