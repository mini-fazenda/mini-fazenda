// Mini Fazenda · Fazendeiro Mod (lado do jogo).
// O host (dev-tools.js) entrega o comando já validado em window.MFDev.apply(grant).
// Também repassa F12 e ` do iframe para o console do dev, se a conta for de dev.
(function (root) {
  'use strict';
  const DAY = 86400000, FAR = 365 * DAY, HOURS12 = 12 * 3600000;
  const fmt = n => Number(n).toLocaleString('pt-BR');
  const core = () => root.MFFertilizerCore;
  const plots = () => {
    try { return (typeof terrenos !== 'undefined' ? terrenos : []).filter(t => root.MFPlotGround?.isPlot?.(t)); }
    catch { return []; }
  };
  const changed = () => { try { root.MFHost?.changed?.(); } catch { } };
  const redraw = () => { try { requestRedraw(); } catch { } };
  const regrow = t => { try { startGrowthTimer(t); } catch { } };
  const isFar = t => Number(t?.fertilizerUntil) - Date.now() > FAR;

  /* ── notificação (empilha até 3, some sozinha) ── */
  function notify(text) {
    let box = document.getElementById('mf-dev-notes');
    if (!box) {
      box = document.createElement('div'); box.id = 'mf-dev-notes';
      box.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:100001;display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none';
      document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'background:rgba(36,59,41,.95);color:#fff;border:2px solid #8be28f;border-radius:14px;padding:9px 16px;font:600 15px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;transition:opacity .25s';
    box.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    while (box.childElementCount > 3) box.firstChild.remove();
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 5200);
  }

  /* ── fertilizante infinito ── */
  let infinite = false, receipts = {}, notified = new Set();
  function makeInfinite(t) {
    if (isFar(t)) return false;
    // `at` precisa ser único: o motor ignora uma janela com o mesmo `at` de outra já registrada.
    const now = Date.now(), at = Math.max(now, Number(t.fertilizerAt || 0) + 1);
    // Fecha janelas já abertas para o bônus não contar em dobro.
    for (const w of t.cultura?.fertWindows || []) if (Number(w.until) > now) w.until = now;
    t.fertilizerAt = at; t.fertilizerUntil = now + 10 * 365 * DAY;
    core()?.bind(t); regrow(t); return true;
  }
  function clearInfinite(t) {
    const now = Date.now(); let did = false;
    if (isFar(t)) { t.fertilizerUntil = now; did = true; }
    for (const w of t.cultura?.fertWindows || []) if (Number(w.until) - now > FAR) { w.until = now; did = true; }
    if (did) regrow(t);
    return did;
  }
  function sweepInfinite() {
    let any = false;
    for (const t of plots()) if (makeInfinite(t)) any = true;
    if (any) { redraw(); changed(); }
  }
  // Mantém terrenos novos cobertos; detecta o modo ao carregar um save que já estava infinito.
  setInterval(() => {
    if (root.MFHost?.playing?.() && infinite) sweepInfinite();
  }, 1500);

  /* ── efeitos ── */
  function giveCoins(n) {
    moedas += n;
    try { if (typeof moedasSpan !== 'undefined' && moedasSpan) moedasSpan.textContent = moedas; } catch { }
    changed();
  }
  function giveXP(n) { if (typeof addXP === 'function') addXP(n); changed(); }
  function fertilizeAll() {
    const c = core(); if (!c) return 0;
    let n = 0;
    for (const t of plots()) { if (c.active(t)) continue; if (c.apply(t, { at: Date.now() })) { regrow(t); n++; } }
    redraw(); changed(); return n;
  }
  function growAll() {
    let n = 0;
    for (const t of plots()) {
      const crop = t.cultura;
      if (!crop || String(crop.tipo) === 'morta' || crop.etapa === 2) continue;
      crop.startTime = Date.now() - Math.max(1, Number(crop.totalTime) || 1); regrow(t); n++;
    }
    redraw(); changed(); return n;
  }

  const notes=new Map();
  root.MFDev = {
    apply(grant,id) {
      if (id && receipts[id] === true) return true;
      if (root.MFHost?.isVisiting?.()) return false;
      let note=''; const pendingNote=text=>{note=text};
      const who = String(grant.from || 'Alguém');
      switch (grant.type) {
        case 'moedas': giveCoins(grant.amount); pendingNote(`🪙 ${who} te deu ${fmt(grant.amount)} moedas`); break;
        case 'xp': giveXP(grant.amount); pendingNote(`⭐ ${who} te deu ${fmt(grant.amount)} de XP`); break;
        case 'fertilizar': { const n = fertilizeAll(); pendingNote(`🌱 ${who} fertilizou a sua fazenda (${n} ${n === 1 ? 'plantação' : 'plantações'})`); break; }
        case 'fertilizar_infinito': infinite = true; sweepInfinite(); pendingNote(`♾️ ${who} ativou o fertilizante infinito na sua fazenda`); break;
        case 'fertilizar_infinito_off': { infinite = false; let any = false; for (const t of plots()) if (clearInfinite(t)) any = true; if (any) { redraw(); changed(); } pendingNote(`${who} desativou o fertilizante infinito da sua fazenda`); break; }
        case 'crescer': { const n = growAll(); pendingNote(`🌾 ${who} fez ${n} ${n === 1 ? 'plantação crescer' : 'plantações crescerem'} na sua fazenda`); break; }
        default: return false;
      }
      if(id)receipts[id]=true;
      if(id)notes.set(id,note); else notify(note);
      changed();
      return true;
    },
    capture:()=>({infinite,receipts:{...receipts}}),
    restore(data){infinite=data?.infinite===true;receipts={...(data?.receipts||{})};},
    notifyGrant(grant,id){if(notified.has(id))return;notified.add(id);notify(notes.get(id)||`${grant.from} enviou ${grant.amount ? fmt(grant.amount)+' ' : ''}${grant.type}`);notes.delete(id);},
    infinite: () => infinite,
  };

  /* ── F12 e ` dentro do iframe abrem o console do dev (só existe para conta de dev) ── */
  root.addEventListener('keydown', e => {
    const toggle = root.MFHost?.devToggle;
    if (!toggle) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '');
    if (e.key === 'F2' || e.key === 'F12' || (e.code === 'Backquote' && !typing)) { e.preventDefault(); toggle(); }
  }, true);
})(window);
