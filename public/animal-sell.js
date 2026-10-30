/* Mini Fazenda · Vender animal: toque no animal (sem produto pronto) e venda por 70% do preço de um novo. */
(function () {
  'use strict';
  const RATE = 0.7;
  const NAMES = { vaca: 'Vaca', ovelha: 'Ovelha', porco: 'Porco', cavalo: 'Cavalo', bodejunino: 'Bode junino' };
  const st = document.createElement('style');
  st.textContent = `#mf-animal-menu[hidden]{display:none!important}
  #mf-animal-menu{position:fixed;z-index:1500;transform:translate(-50%,-115%);background:#fff0bd;border:3px solid #86552b;border-radius:14px;padding:8px;display:flex;align-items:center;gap:6px;
    box-shadow:0 4px 15px #0006;color:#63401f;font:15px Amfost,Arial,sans-serif;white-space:nowrap}
  #mf-animal-menu b{font-weight:400;margin:0 4px}
  #mf-animal-menu button{font:16px Amfost,Arial,sans-serif;border-radius:8px;padding:6px 10px;color:#fff;cursor:pointer;background:linear-gradient(#ffcf5a,#e59a1c);border:2px solid #a8660f}
  #mf-animal-menu button.ok{background:linear-gradient(#ff8a6b,#d4452b);border-color:#93301c}
  #mf-animal-menu button.x{background:linear-gradient(#cfc2a6,#9a8a6a);border-color:#6e5f43;padding:6px 9px}
  #mf-animal-menu img{width:18px;height:18px;vertical-align:-3px}`;
  document.head.appendChild(st);
  const menu = document.createElement('div'); menu.id = 'mf-animal-menu'; menu.hidden = true; document.body.appendChild(menu);
  let target = null, confirm = false;
  const coin = () => document.querySelector('#hud-moedas img')?.src || '';
  function priceOf(t) {
    const tipo = String(t.animal.tipo || '').toLowerCase();
    const cfg = window.MFAdapter?.project?.items?.['item-' + tipo];
    const card = document.getElementById('item-' + tipo);
    return Math.max(0, Number(cfg?.price) || Number(card?.dataset.preco) || 0);
  }
  const value = t => Math.floor(priceOf(t) * RATE);
  function close() { menu.hidden = true; target = null; confirm = false; }
  function render() {
    if (!target) return;
    const name = NAMES[String(target.animal.tipo).toLowerCase()] || 'Animal', v = value(target);
    const prod = window.MFAnimalProduction?.sync?.(target.animal);
    const info = prod && !prod.ready ? ` · produto em ${Math.ceil(prod.remaining / 60000)} min` : '';
    menu.innerHTML = `<b>${name}${info}</b>` +
      (confirm ? `<button type="button" class="ok" data-sell>Confirmar venda?</button>` : `<button type="button" data-sell>Vender por <img alt="" src="${coin()}"> ${v}</button>`) +
      `<button type="button" class="x" data-close>✕</button>`;
  }
  function open(t, x, y) {
    if (!t?.animal || window.MFHost?.isVisiting?.() || modoMover || modoTrator || modoColocar) return;
    if (!priceOf(t)) return;
    target = t; confirm = false; render();
    menu.style.left = Math.max(150, Math.min(innerWidth - 150, x)) + 'px';
    menu.style.top = Math.max(70, y) + 'px';
    menu.hidden = false;
  }
  function sell() {
    const t = target; if (!t || !terrenos.includes(t)) { close(); return; }
    if (!confirm) { confirm = true; render(); return; }
    const v = value(t);
    try { (t._timers || []).forEach(id => { clearTimeout(id); clearInterval(id); }); clearInterval(t._milkInterval); } catch (e) { }
    const i = terrenos.indexOf(t); if (i >= 0) terrenos.splice(i, 1);
    window.MFValueSource?.tile?.(t, 'venda');
    moedas += v; const hud = document.getElementById('valor-moedas'); if (hud) hud.textContent = moedas;
    window.MFGameAudio?.event?.('sell');
    try { window.MFAdapter?.flush?.(); } catch (e) { }
    window.MFHost?.changed?.('animal-sold'); requestRedraw(); close();
  }
  menu.addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('[data-close]')) close();
    else if (e.target.closest('[data-sell]')) sell();
  });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest?.('#mf-animal-menu')) close(); }, true);
  window.MFAnimalSell = { open, close, rate: RATE };
})();
