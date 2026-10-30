// Mini Fazenda · Amizades (lado do Firebase)
// Caminhos no Realtime Database:
//   codes/$codigo            -> uid dono do #ID
//   userCodes/$uid           -> #ID do jogador
//   profiles/$uid            -> {name, level, xp, code, updatedAt} (público para quem está logado)
//   friendRequests/$para/$de -> {name, code, level, at}
//   friends/$uid/$amigo      -> timestamp
// A interface (barra e janela) fica dentro do jogo e usa window.MFOnline.friends.

const MAX_FRIENDS = 200;
export const FERT_PER_DAY = 5, FERT_BOOST = 0.35, DAY = 24 * 60 * 60 * 1000;
let ctx = null, myCode = '', myName = '', listeners = new Set(), stops = [];
let data = { friends: [], requests: [], sent: [] };
const profilesCache = new Map();

function emit() { for (const cb of listeners) { try { cb(snapshot()); } catch (e) { console.warn(e); } } }
function snapshot() { return { code: myCode, friends: data.friends.slice(), requests: data.requests.slice(), sent: data.sent.slice(), ready: !!ctx } }
const cleanCode = v => String(v || '').replace(/\D/g, '').slice(0, 6);
const score = p => (Number(p?.level) || 1) * 1e7 + (Number(p?.xp) || 0);

async function ensureCode() {
  const { sdk, db, uid } = ctx;
  const mine = (await sdk.get(sdk.ref(db, `userCodes/${uid}`))).val();
  if (mine) return String(mine);
  for (let i = 0; i < 12; i++) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const r = await sdk.runTransaction(sdk.ref(db, `codes/${code}`), cur => (cur ? undefined : uid), { applyLocally: false });
    if (r.committed && r.snapshot.val() === uid) { await sdk.set(sdk.ref(db, `userCodes/${uid}`), code); return code; }
  }
  throw new Error('Não foi possível criar o seu ID. Tente de novo mais tarde.');
}

async function profile(uid, fresh = false) {
  if (!fresh && profilesCache.has(uid)) return profilesCache.get(uid);
  const { sdk, db } = ctx;
  let p = null;
  try { p = (await sdk.get(sdk.ref(db, `profiles/${uid}`))).val(); } catch (e) { }
  const out = { uid, name: p?.name || 'Fazenda', level: Number(p?.level) || 1, xp: Number(p?.xp) || 0, code: p?.code || '' };
  profilesCache.set(uid, out); return out;
}

let friendIds = [];
async function refreshProfiles() {
  if (!ctx) return;
  const list = await Promise.all(friendIds.map(id => profile(id, true)));
  data.friends = list.sort((a, b) => score(b) - score(a));
  emit();
}
function watch() {
  const { sdk, db, uid } = ctx;
  stops.push(sdk.onValue(sdk.ref(db, `friends/${uid}`), snap => {
    friendIds = Object.keys(snap.val() || {}).slice(0, MAX_FRIENDS);
    void refreshProfiles();
  }, e => console.warn('[amigos]', e)));
  // nomes, níveis e XP dos amigos mudam: atualiza a cada minuto
  const timer = setInterval(() => void refreshProfiles(), 60000);
  stops.push(() => clearInterval(timer));
  stops.push(sdk.onValue(sdk.ref(db, `fertilize/${uid}`), snap => {
    const list = [];
    for (const [from, items] of Object.entries(snap.val() || {})) for (const [id, it] of Object.entries(items || {})) list.push({ from, id, gx: Number(it?.gx), gy: Number(it?.gy), name: it?.name || 'Amigo', at: it?.at || 0,key:it?.key||'' });
    if (list.length) void deliverFertilize(list);
  }, e => console.warn('[amigos] fertilizar', e)));
  stops.push(sdk.onValue(sdk.ref(db, `friendRequests/${uid}`), snap => {
    data.requests = Object.entries(snap.val() || {}).map(([from, r]) => ({ uid: from, name: r?.name || 'Fazenda', code: r?.code || '', level: Number(r?.level) || 1, at: r?.at || 0 }))
      .sort((a, b) => b.at - a.at);
    emit();
  }, e => console.warn('[amigos]', e)));
}

// Entrega as fertilizações para o jogo do dono e apaga do servidor.
let delivering = false;
async function deliverFertilize(list) {
  if (delivering || !ctx) return; delivering = true;
  try {
    let tries = 0;
    while (ctx && !ctx.applyFertilize?.(list) && tries++ < 120) await new Promise(r => setTimeout(r, 1000)); // espera o jogo abrir
    if (!ctx) return;
    const { sdk, db, uid } = ctx, del = {};
    for (const e of list) del[`fertilize/${uid}/${e.from}/${e.id}`] = null;
    await sdk.update(sdk.ref(db), del);
  } catch (e) { console.warn('[amigos] fertilizar', e); } finally { delivering = false; }
}
export async function startFriends(context) {
  stopFriends();
  ctx = context;
  try { myCode = await ensureCode(); } catch (e) { console.warn('[amigos] ID', e); myCode = ''; }
  emit();
  try { watch(); } catch (e) { console.warn('[amigos]', e); }
  return myCode;
}
export function stopFriends() { for (const s of stops) { try { s(); } catch (e) { } } stops = []; ctx = null; data = { friends: [], requests: [], sent: [] }; }
export function getMyCode() { return myCode; }

// Atualiza o cartão público usado pela barra de amigos dos outros jogadores.
export async function publishProfile(state) {
  if (!ctx || !myCode) return;
  const { sdk, db, uid } = ctx;
  myName = String(state?.farmName || 'Fazenda').slice(0, 12);
  try {
    await sdk.set(sdk.ref(db, `profiles/${uid}`), {
      name: String(state?.farmName || 'Fazenda').slice(0, 12), level: Math.max(1, Number(state?.playerLevel) || 1),
      xp: Math.max(0, Math.floor(Number(state?.playerXP) || 0)), code: myCode, updatedAt: sdk.serverTimestamp(),
    });
  } catch (e) { console.warn('[amigos] perfil', e); }
}

function friendly(e) {
  if (e?.code === 'PERMISSION_DENIED' || /permission/i.test(e?.message || '')) return 'As amizades ainda não foram ativadas no servidor.';
  return e?.message || 'Algo deu errado. Tente de novo.';
}

function fertilizeError(e, stage) {
  if(e?.code==='PERMISSION_DENIED'||/permission/i.test(e?.message||'')){
    console.warn('[fertilizar] permissão negada:',stage,e);
    return new Error('O Firebase bloqueou '+stage+' da fertilização. É preciso conferir as regras do banco no servidor.');
  }
  return new Error(e?.message||'Não foi possível fertilizar. Tente novamente.');
}

export const api = {
  myCode: () => myCode,
  refresh: () => refreshProfiles(),
  subscribe(cb) { listeners.add(cb); cb(snapshot()); return () => listeners.delete(cb); },
  async sendInvite(rawCode, me) {
    if (!ctx) throw new Error('Entre na sua conta para adicionar amigos.');
    const code = cleanCode(rawCode);
    if (code.length !== 6) throw new Error('O ID tem 6 números.');
    if (code === myCode) throw new Error('Esse é o seu próprio ID 🙂');
    const { sdk, db, uid } = ctx;
    try {
      const to = (await sdk.get(sdk.ref(db, `codes/${code}`))).val();
      if (!to) throw new Error('Não achamos nenhuma fazenda com esse ID.');
      if (data.friends.some(f => f.uid === to)) throw new Error('Vocês já são amigos!');
      if (data.requests.some(r => r.uid === to)) { await api.accept(to); return 'Essa fazenda já tinha te convidado. Agora vocês são amigos!'; }
      await sdk.set(sdk.ref(db, `friendRequests/${to}/${uid}`), {
        name: String(me?.name || 'Fazenda').slice(0, 12), code: myCode, level: Math.max(1, Number(me?.level) || 1), at: sdk.serverTimestamp(),
      });
      data.sent = [...data.sent.filter(s => s.uid !== to), { uid: to, code }]; emit();
      return 'Convite enviado! Assim que aceitarem, a fazenda aparece na sua barra.';
    } catch (e) { throw new Error(friendly(e)); }
  },
  async accept(from) {
    const { sdk, db, uid } = ctx;
    try {
      await sdk.update(sdk.ref(db), { [`friends/${uid}/${from}`]: sdk.serverTimestamp(), [`friends/${from}/${uid}`]: sdk.serverTimestamp(), [`friendRequests/${uid}/${from}`]: null });
    } catch (e) { throw new Error(friendly(e)); }
  },
  async decline(from) {
    const { sdk, db, uid } = ctx;
    try { await sdk.set(sdk.ref(db, `friendRequests/${uid}/${from}`), null); } catch (e) { throw new Error(friendly(e)); }
  },
  async remove(other) {
    const { sdk, db, uid } = ctx;
    try { await sdk.update(sdk.ref(db), { [`friends/${uid}/${other}`]: null, [`friends/${other}/${uid}`]: null }); } catch (e) { throw new Error(friendly(e)); }
  },
  visit(other) { return ctx?.visit?.(other); },
  watchFertilized(owner,callback){
    if(!ctx)return ()=>{};const {sdk,db}=ctx;
    return sdk.onValue(sdk.ref(db,`fertilizedPlots/${owner}`),snap=>callback(Object.entries(snap.val()||{}).map(([key,e])=>({...e,key}))),e=>console.warn('[adubos compartilhados]',e));
  },
  // Quantos fertilizantes ainda restam para ESTE amigo nas últimas 24h (5 por amigo).
  async fertilizeLeft(owner) {
    if (!ctx || !owner) return { left: 0, resetIn: 0 };
    const { sdk, db, uid } = ctx;
    let u;try {u=(await sdk.get(sdk.ref(db, `fertUsage/${uid}/${owner}`))).val();}catch(e){throw fertilizeError(e,'a consulta do limite');}
    if (!u || Date.now() - (Number(u.start) || 0) >= DAY) return { left: FERT_PER_DAY, resetIn: 0 };
    return { left: Math.max(0, FERT_PER_DAY - (Number(u.n) || 0)), resetIn: Math.max(0, (Number(u.start) || 0) + DAY - Date.now()) };
  },
  // Visitante fertiliza uma plantação do amigo (o dono aplica quando abrir o jogo).
  async fertilize(owner, plot, me) {
    if (!ctx) throw new Error('Entre na sua conta para fertilizar.');
    const { sdk, db, uid } = ctx;
    if (owner === uid) throw new Error('Essa é a sua fazenda.');
    let stage='a verificação da amizade';
    try {
      const isFriend = (await sdk.get(sdk.ref(db, `friends/${uid}/${owner}`))).val();
      if (!isFriend) throw new Error('Só dá para fertilizar a fazenda de amigos.');
      stage='a consulta do limite';
      const u = (await sdk.get(sdk.ref(db, `fertUsage/${uid}/${owner}`))).val(), now = Date.now();
      let usage;
      if (!u || now - (Number(u.start) || 0) >= DAY) usage = { start: now, n: 1 };
      else if ((Number(u.n) || 0) < FERT_PER_DAY) usage = { start: Number(u.start), n: (Number(u.n) || 0) + 1 };
      else { const h = Math.ceil(((Number(u.start) || 0) + DAY - now) / 3600000); throw new Error(`Você já usou os ${FERT_PER_DAY} fertilizantes nessa fazenda. Volte em ${h}h.`); }
      if(!/^[a-zA-Z0-9_-]{1,180}$/.test(plot.key||''))throw new Error('Atualize o jogo antes de adubar.');
      stage='a consulta da plantação';
      const previous=(await sdk.get(sdk.ref(db,`fertilizedPlots/${owner}/${plot.key}`))).val();
      if(previous&&Number(previous.at)+12*3600000>now)throw new Error('Esse bloco já está adubado por 12 horas. Escolha outro.');
      stage='o envio';
      const id = now.toString(36) + Math.random().toString(36).slice(2, 7);
      await sdk.update(sdk.ref(db), {
        [`fertUsage/${uid}/${owner}`]: usage,
        [`fertilize/${owner}/${uid}/${id}`]: { gx: Math.floor(plot.gx), gy: Math.floor(plot.gy), at: sdk.serverTimestamp(), name: String(me?.name || myName || 'Amigo').slice(0, 12),key:plot.key },
        [`fertilizedPlots/${owner}/${plot.key}`]:{gx:Math.floor(plot.gx),gy:Math.floor(plot.gy),at:sdk.serverTimestamp(),name:String(me?.name||myName||'Amigo').slice(0,12),from:uid,event:id},
      });
      return { left: FERT_PER_DAY - usage.n, resetIn: usage.start + DAY - now,at:now };
    } catch (e) { throw fertilizeError(e,stage); }
  },
};
