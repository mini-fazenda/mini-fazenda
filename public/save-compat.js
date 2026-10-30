// Compatibilidade na fronteira Firebase/engine. Nunca modifica o documento lido.
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function invalid(field) { throw new Error('save/incompatible: '+field+' — progresso preservado no Firebase'); }
function number(value, fallback, field, min=0, max=Number.MAX_SAFE_INTEGER) {
  if(value === undefined || value === null)return fallback;
  if(!['number','string'].includes(typeof value) || String(value).trim()==='')invalid(field);
  const n=Number(value);
  if(!Number.isFinite(n)||n<min||n>max)invalid(field);
  return n;
}
function list(value,field) {
  if(value==null)return [];
  // RTDB representa listas esparsas como objetos com chaves numéricas.
  if(!Array.isArray(value)&&(!object(value)||Object.keys(value).some(k=>!/^\d+$/.test(k))))invalid(field);
  const entries=Object.entries(value).sort(([a],[b])=>Number(a)-Number(b)).map(([,v])=>v).filter(v=>v!=null);
  if(entries.some(v=>!object(v)))invalid(field);
  return entries.map(v=>({...v}));
}
export function documentRevision(doc) {
  if(doc==null || doc.revision==null)return 0;
  // A revisão é protegida pelas regras: não reinicie nem converta valores ambíguos.
  if(!Number.isSafeInteger(doc.revision)||doc.revision<0)invalid('revision');
  return doc.revision;
}
export function normalizeSave(state) {
  if(state==null)return null;
  if(!object(state))invalid('state');
  const out={...state};
  out.moedas=number(state.moedas,undefined,'moedas');
  if(out.moedas===undefined)invalid('moedas ausentes');
  out.playerXP=number(state.playerXP,0,'playerXP');
  out.playerLevel=number(state.playerLevel,1,'playerLevel',1);
  for(const key of ['COLS','ROWS'])out[key]=number(state[key],20,key,3,100);
  out.version=number(state.version,2,'version');
  out.farmName=typeof state.farmName==='string'?state.farmName.slice(0,12):'';
  for(const key of ['terrenos','storedObjects','actionQueue','loot'])out[key]=list(state[key],key);
  for(const tile of out.terrenos)for(const key of ['gx','gy','w','h'])if(tile[key]!=null)tile[key]=number(tile[key],undefined,'terrenos.'+key,key==='gx'||key==='gy'?-100:0);
  for(const key of ['player','aradora']) {
    if(state[key]!=null&&!object(state[key]))invalid(key);
    const actor=out[key]={...state[key]};
    for(const axis of ['gx','gy'])actor[axis]=number(actor[axis],0,key+'.'+axis,-100);
    actor.path=list(actor.path,key+'.path');
    if(key==='aradora')actor.fila=list(actor.fila,'aradora.fila');
    if(actor.action&&!object(actor.action.alvo))invalid(key+'.action.alvo');
  }
  if(state.inventory!=null&&!object(state.inventory))invalid('inventory');
  out.inventory=Object.fromEntries(Object.entries(state.inventory||{}).map(([key,value])=>{
    const entry=object(value)?{...value}: {count:value};
    entry.count=number(entry.count,0,'inventory.'+key+'.count');
    return [key,entry];
  }));
  return out;
}
// savedAt muda em toda captura, mesmo sem nenhuma alteração de progresso.
export function progressText(state) {
  const {savedAt,activeSeconds,...progress}=state;
  return JSON.stringify(progress);
}
