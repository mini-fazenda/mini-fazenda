// Mini Fazenda · Fazendeiro Mod (lado do host/Firebase).
//
// Caminhos no Realtime Database:
//   adminInbox/$uidAlvo/$id -> {type, amount?, from, at}   (só o dev cria; o alvo lê e apaga)
//   adminLog/$id            -> {to, toName, by, type, amount?, at}   (só o dev lê e cria)
//
// Fluxo: o dev grava um comando na caixa de entrada do alvo. O cliente do próprio alvo
// (que é quem tem o direito de gravar a fazenda) aplica e confirma o save antes de apagar o comando.
// Se o alvo estiver offline, o comando espera no banco e é entregue assim que ele entrar.

import { isDevUser, validateGrant, parseCommand, parseTarget, parseAmount, HELP } from './dev-grants.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ───────────── Caixa de entrada (todos os jogadores) ───────────── */
let inbox = null;

export function startInbox(ctx) {
  stopInbox();
  const state = { ctx, stops: [], queue: [], seen: new Set(), running: false, dead: false };
  inbox = state;
  const { sdk, db, uid } = ctx;
  state.stops.push(sdk.onChildAdded(sdk.ref(db, `adminInbox/${uid}`), snap => {
    if (state.dead || state.seen.has(snap.key)) return;
    state.seen.add(snap.key);
    state.queue.push({ id: snap.key, raw: snap.val(), tries: 0 });
    void drain(state);
  }, e => console.warn('[dev] caixa de entrada', e)));
}

export function stopInbox() {
  if (!inbox) return;
  inbox.dead = true;
  for (const s of inbox.stops) { try { s(); } catch { } }
  inbox = null;
}

async function drain(state) {
  if (state.running) return;
  state.running = true;
  try {
    while (!state.dead && state.queue.length) {
      const item = state.queue[0], { sdk, db, uid } = state.ctx;
      // Só entrega com a própria fazenda aberta e o jogo pronto (não durante visita).
      while (!state.dead && !state.ctx.gameReady()) await sleep(1000);
      if (state.dead) return;
      const grant = validateGrant(item.raw);
      if (!grant) { console.warn('[dev] comando inválido preservado', item.id); state.queue.shift(); continue; }
      try {
        // Efeito + recibo entram no MESMO save. Só apague após confirmação.
        // Uma queda entre save e remoção repete a entrega, mas o recibo evita duplicação.
        const saved = await state.ctx.applyGrant(grant, item.id);
        if (state.dead) return;
        if (!saved) { await sleep(1000); continue; }
        await sdk.remove(sdk.ref(db, `adminInbox/${uid}/${item.id}`));
        state.queue.shift();
      } catch (e) {
        console.warn('[dev] entrega pendente; será tentada novamente', e);
        await sleep(4000);
        continue;
      }
      await sleep(2800); // dá tempo de ler a notificação antes da próxima
    }
  } finally {
    state.running = false;
    if (!state.dead && state.queue.length) void drain(state);
  }
}

/* ───────────── Console do dev (só aparece para e-mail de desenvolvedor) ───────────── */
let cx = null, ui = null;

export { isDevUser };

export function stopConsole() {
  if (ui) { document.removeEventListener('keydown', ui.onKey, true); ui.root.remove(); ui.button.remove(); }
  if (window.MFOnline) delete window.MFOnline.devToggle;
  ui = null; cx = null;
}

export function startConsole(ctx) {
  stopConsole();
  if (!isDevUser(ctx.user)) return;
  cx = ctx;
  injectStyle();
  const root = document.createElement('div');
  root.id = 'mf-dev'; root.hidden = true;
  root.innerHTML = '<div class="bar"><b>🛠 Fazendeiro Mod</b><span>F2, F12 ou ` para fechar</span></div><div class="out" role="log"></div><div class="row"><span>›</span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="/ajuda"></div>';
  const button = document.createElement('button');
  button.id = 'mf-dev-btn'; button.type = 'button'; button.textContent = '🛠'; button.title = 'Console de desenvolvedor';
  document.body.append(root, button);
  const out = root.querySelector('.out'), input = root.querySelector('input');
  const history = []; let hIndex = 0;

  const print = (text, cls = '') => {
    const line = document.createElement('div'); line.className = cls; line.textContent = text; out.append(line);
    while (out.childElementCount > 200) out.firstChild.remove();
    out.scrollTop = out.scrollHeight;
  };
  const toggle = force => {
    const open = typeof force === 'boolean' ? force : root.hidden;
    root.hidden = !open;
    if (open) { input.focus(); if (!out.childElementCount) { print('Fazendeiro Mod ativo. Digite /ajuda.', 'ok'); } }
  };
  button.onclick = () => toggle();
  const onKey = e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '') && e.target !== input;
    if (e.key === 'F2' || e.key === 'F12' || (e.code === 'Backquote' && !typing)) { e.preventDefault(); e.stopPropagation(); toggle(); }
    else if (e.key === 'Escape' && !root.hidden) toggle(false);
  };
  document.addEventListener('keydown', onKey, true);
  if (window.MFOnline) window.MFOnline.devToggle = toggle; // o iframe do jogo repassa as teclas

  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const line = input.value.trim(); input.value = '';
      if (!line) return;
      history.push(line); hIndex = history.length;
      print('› ' + line, 'cmd'); void run(line, print, out);
    } else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIndex > 0) input.value = history[--hIndex]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); input.value = ++hIndex < history.length ? history[hIndex] : (hIndex = history.length, ''); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const m = /^\/?(\S*)$/.exec(input.value);
      if (m) { const hit = ['moedas', 'xp', 'fertilizar', 'fertilizar-infinito', 'crescer', 'quem', 'ir', 'voltar', 'log', 'limpar', 'ajuda'].find(c => c.startsWith(m[1].toLowerCase())); if (hit) input.value = '/' + hit + ' '; }
    }
  });
  ui = { root, button, onKey };
}

async function resolveTarget(text) {
  const t = parseTarget(text);
  if (!t) throw new Error('Alvo inválido. Use: eu, #123456 (ID da fazenda) ou UID.');
  const { sdk, db, uid } = cx;
  let target = t.kind === 'self' ? uid : t.uid;
  if (t.kind === 'code') {
    target = (await sdk.get(sdk.ref(db, `codes/${t.code}`))).val();
    if (!target) throw new Error(`Nenhuma fazenda com o ID #${t.code}.`);
  }
  const p = (await sdk.get(sdk.ref(db, `profiles/${target}`))).val();
  if (!p && target !== uid) throw new Error('Fazenda não encontrada (ela ainda não publicou o perfil).');
  return { uid: target, self: target === uid, name: p?.name || cx.farmName?.() || 'Fazenda', level: Number(p?.level) || 1, xp: Number(p?.xp) || 0, code: p?.code || '' };
}

async function send(target, type, amount) {
  const { sdk, db, uid } = cx;
  const key = sdk.push(sdk.ref(db, `adminInbox/${target.uid}`)).key;
  // Use o nome confirmado: uma edição local ainda pode estar salvando.
  const from = String((await sdk.get(sdk.ref(db, `farms/${uid}/state/farmName`))).val() || 'Dev').slice(0,12);
  const body = { type, from, by: uid, at: sdk.serverTimestamp() };
  const log = { to: target.uid, toName: String(target.name).slice(0, 12), by: uid, type, at: sdk.serverTimestamp() };
  if (amount != null) { body.amount = amount; log.amount = amount; }
  await sdk.update(sdk.ref(db), { [`adminInbox/${target.uid}/${key}`]: body, [`adminLog/${key}`]: log });
}

const fmt = n => Number(n).toLocaleString('pt-BR');
const who = t => `${t.self ? 'você' : t.name}${t.code ? ` (#${t.code})` : ''}`;

async function run(line, print, out) {
  const { cmd, args, known } = parseCommand(line);
  if (!cmd) return;
  if (!known) return print(`Comando desconhecido: ${cmd}. Digite /ajuda.`, 'err');
  try {
    switch (cmd) {
      case 'ajuda': HELP.forEach(l => print(l, 'dim')); break;
      case 'limpar': out.replaceChildren(); break;
      case 'moedas': case 'xp': {
        const amount = parseAmount(args[1]);
        if (!amount || amount > (cmd === 'xp' ? 10_000_000 : 1_000_000_000)) throw new Error(`Uso: /${cmd} <alvo> <quantidade>   ex: /${cmd} eu 5k`);
        const t = await resolveTarget(args[0]);
        await send(t, cmd, amount);
        print(`✅ ${fmt(amount)} ${cmd === 'xp' ? 'XP' : 'moedas'} enviados para ${who(t)}.`, 'ok'); break;
      }
      case 'fertilizar': case 'crescer': {
        const t = await resolveTarget(args[0]);
        await send(t, cmd);
        print(`✅ ${cmd === 'crescer' ? 'Crescimento completo' : 'Fertilização'} enviado para ${who(t)}.`, 'ok'); break;
      }
      case 'infinito': {
        const mode = String(args[1] || 'on').toLowerCase();
        if (!['on', 'off'].includes(mode)) throw new Error('Uso: /fertilizar-infinito <alvo> on|off');
        const t = await resolveTarget(args[0]);
        await send(t, mode === 'on' ? 'fertilizar_infinito' : 'fertilizar_infinito_off');
        print(`✅ Fertilizante infinito ${mode === 'on' ? 'ATIVADO' : 'desativado'} para ${who(t)}.`, 'ok'); break;
      }
      case 'quem': {
        const t = await resolveTarget(args[0]);
        print(`${t.name} · nível ${t.level} · XP ${fmt(t.xp)} · ID #${t.code || '?'} · UID ${t.uid}`, 'dim'); break;
      }
      case 'ir': {
        const t = await resolveTarget(args[0]);
        if (t.self) throw new Error('Essa é a sua fazenda. Use /voltar.');
        print(`Abrindo a fazenda de ${who(t)}…`, 'dim');
        await cx.visit(t.uid); break;
      }
      case 'voltar': document.getElementById('home')?.click(); print('Voltando para a sua fazenda…', 'dim'); break;
      case 'log': {
        const { sdk, db } = cx;
        const snap = await sdk.get(sdk.query(sdk.ref(db, 'adminLog'), sdk.orderByKey(), sdk.limitToLast(10)));
        const rows = Object.values(snap.val() || {});
        if (!rows.length) print('Nenhum comando registrado ainda.', 'dim');
        for (const r of rows) print(`${new Date(Number(r.at) || 0).toLocaleString('pt-BR')} · ${r.type}${r.amount ? ' ' + fmt(r.amount) : ''} → ${r.toName || r.to}`, 'dim');
        break;
      }
    }
  } catch (e) {
    const denied = e?.code === 'PERMISSION_DENIED' || /permission/i.test(e?.message || '');
    print('❌ ' + (denied ? 'O Firebase recusou. Publique as regras novas (adminInbox/adminLog) e confira o e-mail verificado.' : (e?.message || e)), 'err');
  }
}

function injectStyle() {
  if (document.getElementById('mf-dev-style')) return;
  const s = document.createElement('style'); s.id = 'mf-dev-style';
  s.textContent = `
#mf-dev{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;max-height:46vh;display:flex;flex-direction:column;background:rgba(18,24,20,.96);color:#d7f5d0;font:13px/1.45 ui-monospace,Consolas,monospace;border-top:2px solid #6fbf73;box-shadow:0 -8px 24px rgba(0,0,0,.4)}
#mf-dev[hidden]{display:none}
#mf-dev .bar{display:flex;justify-content:space-between;padding:6px 12px;background:#243b29;color:#fff}
#mf-dev .bar span{opacity:.7}
#mf-dev .out{flex:1;min-height:90px;overflow:auto;padding:8px 12px;white-space:pre-wrap;word-break:break-word}
#mf-dev .cmd{color:#fff}#mf-dev .ok{color:#8be28f}#mf-dev .err{color:#ff8d8d}#mf-dev .dim{color:#a7bba7}
#mf-dev .row{display:flex;gap:8px;padding:8px 12px;border-top:1px solid #35523a}
#mf-dev input{flex:1;background:transparent;border:0;outline:0;color:#fff;font:inherit}
#mf-dev-btn{position:fixed;left:8px;bottom:8px;z-index:2147482999;width:34px;height:34px;border-radius:50%;border:2px solid #6fbf73;background:#243b29;color:#fff;cursor:pointer;opacity:.55}
#mf-dev-btn:hover{opacity:1}`;
  document.head.append(s);
}
