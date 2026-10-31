// Mini Fazenda · Ferramentas de desenvolvedor (parte pura, sem Firebase nem DOM).
// Usada pelo console do dev (dev-tools.js) e testada em tests/dev-grants.test.js.
//
// IMPORTANTE: a segurança real está em database.rules.json (adminInbox / adminLog).
// A checagem de e-mail aqui só decide se o console aparece na tela.

export const DEV_EMAILS = ['bielz09.lulu@gmail.com', 'fortekmarquez@gmail.com'];

export const LIMITS = { moedas: 1_000_000_000, xp: 10_000_000 };
export const TYPES = ['moedas', 'xp', 'fertilizar', 'fertilizar_infinito', 'fertilizar_infinito_off', 'crescer'];
const NEEDS_AMOUNT = new Set(['moedas', 'xp']);

export function isDevUser(user) {
  return !!user && user.emailVerified === true && DEV_EMAILS.includes(String(user.email || '').toLowerCase());
}

// Valida um comando recebido na caixa de entrada. Retorna o comando limpo ou null.
export function validateGrant(grant) {
  if (!grant || typeof grant !== 'object') return null;
  const type = String(grant.type || '');
  if (!TYPES.includes(type)) return null;
  const from = String(grant.from || 'Alguém').slice(0, 12) || 'Alguém';
  if (NEEDS_AMOUNT.has(type)) {
    const amount = Math.floor(Number(grant.amount));
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > LIMITS[type]) return null;
    return { type, amount, from };
  }
  return { type, from };
}

// "5000", "5k", "1,5k", "2m", "1.000.000" -> número inteiro. Inválido -> null.
export function parseAmount(text) {
  const s = String(text ?? '').trim().toLowerCase().replace(/_/g, '');
  let n = null;
  if (/^\d+$/.test(s)) n = Number(s);
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) n = Number(s.replace(/\./g, ''));
  else {
    const m = /^(\d+(?:[.,]\d+)?)([km])$/.exec(s);
    if (m) n = Math.floor(Number(m[1].replace(',', '.')) * (m[2] === 'k' ? 1e3 : 1e6));
  }
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// "eu" | "#123456" | "123456" | UID do Firebase.
export function parseTarget(text) {
  const s = String(text ?? '').trim();
  if (!s || /^(eu|me|mim)$/i.test(s)) return { kind: 'self' };
  const code = /^#?(\d{6})$/.exec(s);
  if (code) return { kind: 'code', code: code[1] };
  if (/^[A-Za-z0-9]{20,40}$/.test(s)) return { kind: 'uid', uid: s };
  return null;
}

const ALIASES = {
  moedas: 'moedas', moeda: 'moedas', coins: 'moedas', m: 'moedas',
  xp: 'xp', estrelas: 'xp',
  fertilizar: 'fertilizar', fert: 'fertilizar', adubar: 'fertilizar',
  'fertilizar-infinito': 'infinito', fertinf: 'infinito', infinito: 'infinito',
  crescer: 'crescer', grow: 'crescer', pronto: 'crescer',
  quem: 'quem', info: 'quem',
  ir: 'ir', visitar: 'ir', voltar: 'voltar',
  log: 'log', limpar: 'limpar', clear: 'limpar',
  ajuda: 'ajuda', help: 'ajuda', '?': 'ajuda',
};

export function parseCommand(line) {
  const parts = String(line || '').trim().replace(/^\//, '').split(/\s+/).filter(Boolean);
  if (!parts.length) return { cmd: '', args: [] };
  const raw = parts[0].toLowerCase();
  return { cmd: ALIASES[raw] || raw, args: parts.slice(1), known: raw in ALIASES };
}

export const HELP = [
  'Comandos (alvo = eu | #123456 | UID):',
  '  /moedas <alvo> <qtd>             ex: /moedas #123456 5k',
  '  /xp <alvo> <qtd>                 ex: /xp eu 2000',
  '  /fertilizar <alvo>               fertiliza todas as plantações agora (12h)',
  '  /fertilizar-infinito <alvo> [on|off]   fertilizante sem limite de tempo',
  '  /crescer <alvo>                  termina o crescimento de tudo que está plantado',
  '  /quem <alvo>                     mostra nome, nível e ID da fazenda',
  '  /ir <alvo>  ·  /voltar           visita uma fazenda (somente olhar) / volta para a sua',
  '  /log                             últimos 10 comandos enviados',
  '  /limpar                          limpa a tela do console',
  'Abrir/fechar: F2, F12 ou tecla ` (crase). Setas ↑↓ repetem comandos, Tab completa.',
];
