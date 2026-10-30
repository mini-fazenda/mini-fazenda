/* Mini Fazenda · Tutorial do primeiro login
   Começa depois da escolha do personagem e da recompensa diária.
   Passos: colher → arar → comprar e plantar → enxada (novo canteiro) → vender no celeiro → parabéns.
   O progresso fica salvo na conta (game-bridge: tutorial). Saves antigos não veem o tutorial. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const TOTAL = 5;
  let state = null;          // {step, done}
  let base = {};             // valores no começo de cada passo
  let ui = null, arrow = null, lastStep = null;

  // ---------- personagem: fazendeira (desenho próprio) ----------
  const LADY = `<svg viewBox="0 0 200 210" aria-hidden="true">
    <defs><radialGradient id="tl-bg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff6c8"/><stop offset="1" stop-color="#f3c454"/></radialGradient>
    <linearGradient id="tl-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d77a"/><stop offset="1" stop-color="#d49a2c"/></linearGradient></defs>
    <circle cx="100" cy="112" r="94" fill="url(#tl-bg)" stroke="#8a5a22" stroke-width="6"/>
    <!-- tranças -->
    <path d="M52 108 C40 140 46 168 58 186 C66 178 66 150 70 118 Z" fill="#7a4421" stroke="#3e200c" stroke-width="3"/>
    <path d="M148 108 C160 140 154 168 142 186 C134 178 134 150 130 118 Z" fill="#7a4421" stroke="#3e200c" stroke-width="3"/>
    <circle cx="58" cy="182" r="7" fill="#e8463c" stroke="#7a1b14" stroke-width="2"/><circle cx="142" cy="182" r="7" fill="#e8463c" stroke="#7a1b14" stroke-width="2"/>
    <!-- corpo: camisa xadrez e jardineira -->
    <path d="M40 210 C44 170 70 158 100 158 C130 158 156 170 160 210 Z" fill="#3fa35a" stroke="#1f5a2e" stroke-width="3"/>
    <path d="M58 182 L142 182 M66 170 L134 170 M78 160 L78 210 M100 158 L100 210 M122 160 L122 210" stroke="#2e7d44" stroke-width="3" opacity=".7"/>
    <path d="M72 210 L74 176 L126 176 L128 210 Z" fill="#3b78c4" stroke="#1d4577" stroke-width="3"/>
    <path d="M74 176 L68 160 M126 176 L132 160" stroke="#3b78c4" stroke-width="8" stroke-linecap="round"/>
    <circle cx="82" cy="184" r="4" fill="#ffd24a"/><circle cx="118" cy="184" r="4" fill="#ffd24a"/>
    <!-- rosto -->
    <ellipse cx="100" cy="112" rx="44" ry="48" fill="#ffd9b3" stroke="#7a4a2a" stroke-width="3"/>
    <path d="M58 100 C62 70 90 62 104 66 C122 70 140 82 142 104 C128 92 112 88 96 92 C84 95 70 98 58 100 Z" fill="#8a4d24" stroke="#3e200c" stroke-width="3"/>
    <ellipse cx="84" cy="114" rx="6" ry="8" fill="#3a2414"/><ellipse cx="116" cy="114" rx="6" ry="8" fill="#3a2414"/>
    <circle cx="86" cy="111" r="2.2" fill="#fff"/><circle cx="118" cy="111" r="2.2" fill="#fff"/>
    <path d="M76 101 Q84 97 91 101 M109 101 Q116 97 124 101" stroke="#5a3218" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="74" cy="130" r="7" fill="#ff9c8a" opacity=".55"/><circle cx="126" cy="130" r="7" fill="#ff9c8a" opacity=".55"/>
    <g fill="#c77a4a" opacity=".7"><circle cx="78" cy="124" r="1.6"/><circle cx="83" cy="127" r="1.6"/><circle cx="122" cy="124" r="1.6"/><circle cx="117" cy="127" r="1.6"/></g>
    <path d="M84 136 Q100 152 116 136 Q100 144 84 136 Z" fill="#b8323a" stroke="#6b1a1e" stroke-width="2.5"/>
    <!-- chapéu de palha -->
    <ellipse cx="100" cy="74" rx="78" ry="17" fill="url(#tl-hat)" stroke="#7a5212" stroke-width="3.5"/>
    <path d="M58 72 C60 38 80 26 100 26 C120 26 140 38 142 72 Z" fill="url(#tl-hat)" stroke="#7a5212" stroke-width="3.5"/>
    <path d="M60 64 C80 70 120 70 140 64 L141 72 C120 78 80 78 59 72 Z" fill="#e8463c" stroke="#7a1b14" stroke-width="2"/>
    <path d="M72 44 L76 60 M90 34 L92 58 M110 34 L108 58 M128 44 L124 60" stroke="#b9852c" stroke-width="2" opacity=".6"/>
    <circle cx="132" cy="64" r="7" fill="#ffe36b" stroke="#b58a12" stroke-width="2"/><circle cx="132" cy="64" r="2.5" fill="#e8a317"/>
  </svg>`;

  function css() {
    if ($('mf-tut-style')) return;
    const st = document.createElement('style'); st.id = 'mf-tut-style';
    st.textContent = `
    #mf-tut{position:fixed;left:max(10px,env(safe-area-inset-left));bottom:150px;z-index:2250;display:flex;align-items:flex-end;pointer-events:none;font-family:Amfost,Arial,sans-serif;transform-origin:left bottom;animation:mfTutIn .35s ease-out}
    #mf-tut[hidden]{display:none!important}
    #mf-tut.top{bottom:auto;top:max(8px,env(safe-area-inset-top));left:50%;translate:-50% 0;transform-origin:center top;animation:none}
    #mf-tut.top .lady{width:96px;height:100px}
    @keyframes mfTutIn{from{opacity:0;translate:-30px 0}to{opacity:1;translate:0 0}}
    #mf-tut .lady{width:150px;height:158px;flex:none;filter:drop-shadow(0 6px 8px #0006);z-index:2;margin-right:-26px;animation:mfTutBob 2.4s ease-in-out infinite}
    #mf-tut .lady svg{width:100%;height:100%}
    @keyframes mfTutBob{50%{translate:0 -4px}}
    #mf-tut .box{position:relative;min-width:250px;max-width:min(430px,62vw);background:linear-gradient(#fff6a8,#ffe266);border:4px solid #c98a1e;border-radius:18px;padding:12px 18px 12px 36px;
      box-shadow:0 6px 0 #8a5a12,0 10px 22px #0006;color:#5a3812;pointer-events:auto;margin-bottom:12px}
    #mf-tut h4{margin:0 0 3px;font-size:24px;font-weight:400;color:#fff;text-shadow:-2px -2px 0 #b06a10,2px -2px 0 #b06a10,-2px 2px 0 #b06a10,2px 2px 0 #b06a10,0 3px 0 #7a4a0a}
    #mf-tut p{margin:0;font:700 15px Arial,sans-serif;line-height:1.35}
    #mf-tut .row{display:flex;gap:8px;align-items:center;margin-top:8px}
    #mf-tut .ok{border:2px solid #2f6e1f;border-radius:10px;background:linear-gradient(#8ee05d,#4ea72e);color:#fff;font:400 17px Amfost,Arial,sans-serif;padding:5px 16px;cursor:pointer;
      text-shadow:-1px -1px 0 #2f6e1f,1px -1px 0 #2f6e1f,-1px 1px 0 #2f6e1f,1px 1px 0 #2f6e1f;animation:mfTutPulse 1.2s ease-in-out infinite}
    @keyframes mfTutPulse{50%{transform:scale(1.06)}}
    #mf-tut .skip{border:0;background:none;color:#8a5a22;font:700 12px Arial,sans-serif;text-decoration:underline;cursor:pointer;margin-left:auto;padding:2px}
    #mf-tut .star{position:absolute;right:-14px;top:-16px;font-size:30px;filter:drop-shadow(0 2px 2px #0005)}
    #mf-tut-arrow{position:fixed;z-index:2300;width:54px;height:62px;pointer-events:none;margin-left:-27px;margin-top:-62px;animation:mfTutArrow .8s ease-in-out infinite;filter:drop-shadow(0 4px 4px #0007)}
    #mf-tut-arrow[hidden]{display:none!important}
    @keyframes mfTutArrow{50%{translate:0 -12px}}
    @media (max-width:900px),(max-height:520px){
      #mf-tut,#mf-tut.top{bottom:auto;top:max(4px,env(safe-area-inset-top));left:50%;translate:-50% 0;transform:none;animation:none}
      #mf-tut .lady,#mf-tut.top .lady{width:64px;height:68px;margin-right:-16px}
      #mf-tut .box{min-width:0;max-width:min(380px,50vw);padding:6px 10px 6px 20px;border-width:3px;border-radius:13px;margin-bottom:4px;box-shadow:0 3px 0 #8a5a12,0 6px 12px #0006}
      #mf-tut h4{font-size:15px}#mf-tut p{font-size:11px;line-height:1.25}#mf-tut .row{margin-top:4px}#mf-tut .ok{font-size:14px;padding:3px 12px}
      #mf-tut .star{font-size:18px;right:-8px;top:-10px}#mf-tut-arrow{transform:scale(.8)}}
    `;
    document.head.appendChild(st);
  }
  function build() {
    if (ui) return;
    css();
    ui = document.createElement('div'); ui.id = 'mf-tut'; ui.hidden = true;
    ui.innerHTML = `<div class="lady">${LADY}</div><div class="box"><span class="star">⭐</span><h4 class="t"></h4><p class="m"></p>
      <div class="row"><button class="ok" type="button" hidden></button><button class="skip" type="button">Pular tutorial</button></div></div>`;
    document.body.appendChild(ui);
    ui.addEventListener('click', e => e.stopPropagation());
    ui.querySelector('.skip').addEventListener('click', () => finish());
    ui.querySelector('.ok').addEventListener('click', () => { if (state?.step === 'fim') finish(); });
    arrow = document.createElement('div'); arrow.id = 'mf-tut-arrow'; arrow.hidden = true;
    arrow.innerHTML = `<svg viewBox="0 0 54 62"><path d="M15 2 H39 V30 H52 L27 60 L2 30 H15 Z" fill="#ffd21f" stroke="#a86b00" stroke-width="3.5" stroke-linejoin="round"/><path d="M19 6 H27 V32 H14 Z" fill="#fff6a8" opacity=".7"/></svg>`;
    document.body.appendChild(arrow);
  }

  // ---------- ajudantes do jogo ----------
  const farm = () => (typeof terrenos !== 'undefined' ? terrenos.filter(t => t && !t.animal) : []);
  const ready = t => t.cultura && (t.cultura.etapa === 2 || String(t.cultura.tipo) === 'morta');
  const dry = t => !t.cultura && String(t.imgSrc).includes('terra-seca');
  const plowed = t => !t.cultura && String(t.imgSrc).includes('terra-arada');
  const growing = () => farm().filter(t => t.cultura && t.cultura.etapa < 2 && String(t.cultura.tipo) !== 'morta').length;
  const jobsBusy = () => !!(typeof player !== 'undefined' && player.acaoAtual) || (typeof filaAcoes !== 'undefined' && filaAcoes.length > 0);
  const invTotal = () => Object.values(window.__gameInventory?.map || {}).reduce((n, v) => n + (Number(v?.count) || 0), 0);
  const visible = el => !!el && el.offsetParent !== null && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const shopOpen = () => !!document.querySelector('#mf-shop.on');
  const barnOpen = () => { const o = $('overlay-bau'); return !!o && getComputedStyle(o).display !== 'none'; };
  const placingSeed = () => typeof modoColocar !== 'undefined' && modoColocar && placingItem?.tipo === 'dependente';
  const blocking = () => !!document.querySelector('#mf-char.on') || ($('mf-daily') && !$('mf-daily').hidden) || !!window.MFHost?.isVisiting?.() || document.body.classList.contains('mf-editing');

  function tileTop(t) {
    const r = canvas.getBoundingClientRect(), w = t.w || 1, h = t.h || 1;
    const p = gridToScreen(t.gx + (w - 1) / 2, t.gy + (h - 1) / 2);
    return { x: r.left + canvas.width / 2 + offsetX + p.x * zoom, y: r.top + canvas.height / 3 + offsetY + (p.y - TILE_H * 1.1) * zoom };
  }
  function pointAt(target) {
    if (!target) { arrow.hidden = true; return; }
    let x, y;
    if (target.nodeType === 1) { if (!visible(target)) { arrow.hidden = true; return; } const r = target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top - 4; }
    else ({ x, y } = tileTop(target));
    if (x < 0 || y < 40 || x > innerWidth || y > innerHeight + 40) { arrow.hidden = true; return; }
    arrow.style.left = x + 'px'; arrow.style.top = y + 'px'; arrow.hidden = false;
  }
  function nearest(list) {
    if (!list.length || typeof player === 'undefined') return list[0] || null;
    return list.slice().sort((a, b) => Math.hypot(a.gx - player.gx, a.gy - player.gy) - Math.hypot(b.gx - player.gx, b.gy - player.gy))[0];
  }
  function say(n, text, okText) {
    ui.querySelector('.t').textContent = n ? `Passo ${n} de ${TOTAL}:` : 'Parabéns!';
    ui.querySelector('.m').textContent = text;
    const ok = ui.querySelector('.ok'); ok.hidden = !okText; if (okText) ok.textContent = okText;
    ui.querySelector('.skip').hidden = !n;
    ui.hidden = false;
  }
  function go(step) {
    state.step = step; base = { growing: growing(), plots: farm().length, coins: typeof moedas !== 'undefined' ? moedas : 0, inv: invTotal() };
    try { window.MFHost?.changed?.('tutorial'); } catch (e) { }
  }
  function finish() {
    state = { step: 'fim', done: true };
    if (ui) ui.hidden = true; if (arrow) arrow.hidden = true;
    try { window.MFHost?.changed?.('tutorial'); } catch (e) { }
  }

  // ---------- passos ----------
  function tick() {
    if (!state || state.done || !ui) return;
    if (blocking()) { ui.hidden = true; arrow.hidden = true; return; }
    if (state.step !== lastStep) { lastStep = state.step; base = { growing: growing(), plots: farm().length, coins: typeof moedas !== 'undefined' ? moedas : 0, inv: invTotal(), ...base }; }
    const s = state.step;
    ui.classList.toggle('top', shopOpen() || barnOpen());
    if (s === 'colher') {
      const list = farm().filter(ready);
      if (!list.length && !jobsBusy()) return go('arar');
      say(1, 'Que bom te ver na fazenda! Suas plantações estão prontas. Toque em cada canteiro com a foice para colher. Pode tocar em vários: o personagem vai colhendo na ordem.');
      return pointAt(nearest(list.filter(t => !(typeof filaAcoes !== 'undefined' && filaAcoes.includes(t)) && player.acaoAtual?.alvo !== t)) || null);
    }
    if (s === 'arar') {
      const list = farm().filter(dry);
      if (!list.length && !jobsBusy()) return go('plantar');
      say(2, 'Depois de colher, a terra fica seca. Toque nos canteiros de terra seca para arar e deixar prontos para plantar.');
      return pointAt(nearest(list.filter(t => !(typeof filaAcoes !== 'undefined' && filaAcoes.includes(t)) && player.acaoAtual?.alvo !== t)) || null);
    }
    if (s === 'plantar') {
      if (growing() > (base.growing || 0) && !jobsBusy()) { try { window.MFCancelPlacing?.(); } catch (e) { } return go('enxada'); }
      if (placingSeed()) { say(3, 'Agora toque na terra arada para plantar a semente. Quando terminar, toque fora dos canteiros ou aperte Esc.'); return pointAt(nearest(farm().filter(plowed))); }
      if (shopOpen()) {
        const card = document.querySelector('.mfs-card[data-id="item-cenoura"] .mfs-buy') || document.querySelector('.mfs-card .mfs-buy');
        say(3, 'Esta é a Mini Loja. Compre a Cenoura Orgânica: ela fica pronta em 10 minutos!'); return pointAt(card);
      }
      if (jobsBusy()) { say(3, 'Muito bem! Espere o personagem terminar de plantar.'); return pointAt(null); }
      say(3, 'Hora de plantar! Toque na Loja para comprar sementes.'); return pointAt($('btn-loja'));
    }
    if (s === 'enxada') {
      if (farm().length > (base.plots || 0) && !jobsBusy()) { try { window.MFHoe?.stop?.(); window.MFCancelPlacing?.(); } catch (e) { } return go('celeiro'); }
      if (window.MFHoe?.active?.()) { say(4, 'Agora toque num espaço de grama vazio. O personagem vai até lá e ara um canteiro novo.'); return pointAt(null); }
      say(4, 'Quer mais espaço para plantar? Toque na enxada para criar um canteiro novo.'); return pointAt($('btn-enxada'));
    }
    if (s === 'celeiro') {
      const summary = $('mf-sale-summary');
      if ((invTotal() === 0 && moedas > (base.coins || 0)) || (summary && !summary.hidden)) return go('fim');
      if (invTotal() === 0) return go('fim');
      if (barnOpen()) {
        const btn = [...document.querySelectorAll('#mf-sales-actions button')].find(b => b.textContent.trim() === 'Vender tudo');
        say(5, 'Aqui ficam suas colheitas. Toque em Vender tudo para ganhar moedas!'); return pointAt(btn);
      }
      say(5, 'Tudo o que você colhe vai para o Mini Celeiro. Toque no celeiro para vender.'); return pointAt($('mf-btn-celeiro'));
    }
    if (s === 'fim') {
      say(0, 'Você completou o tutorial! Agora a fazenda é sua: plante, colha, venda e chame seus amigos.', 'Concluir');
      return pointAt(null);
    }
  }

  function loop() { try { tick(); } catch (e) { console.warn('[tutorial]', e); } }
  window.MFTutorial = {
    // novo jogador: começa do passo 1
    start() { build(); state = { step: 'colher', done: false }; base = {}; lastStep = null; },
    capture: () => (state ? { ...state } : null),
    // save existente sem tutorial = jogador antigo, não mostra
    restore(s, isNew) {
      build();
      if (s && typeof s === 'object') state = { step: String(s.step || 'colher'), done: !!s.done };
      else state = isNew ? { step: 'colher', done: false } : { step: 'fim', done: true };
      base = {}; lastStep = null;
    },
    finish, reset() { this.start(); },
  };
  setInterval(loop, 250);
  // seta acompanha a câmera sem atraso
  (function raf() { requestAnimationFrame(raf); if (state && !state.done && arrow && !arrow.hidden && ui && !ui.hidden && ['colher', 'arar', 'plantar'].includes(state.step) && !document.querySelector('#mf-shop.on')) loop(); })();
})();
