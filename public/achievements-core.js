/* Progresso privado, cumulativo e resgates únicos por etapa. */
(function(root){
 const DEFINITIONS=[
  {id:'beta',name:'Beta Tester',description:'Participou antes do lançamento.',icon:'🏆',metric:'beta',tiers:[[1,0]],trophy:true},
  {id:'harvest',name:'A Primeira a Gente Nunca Esquece',description:'Colha plantações.',icon:'🌱',metric:'harvests',tiers:[[1,50],[1000,200],[3000,500],[5000,1000]]},
  {id:'goldEggs',art:'assets/galinheiro/ovos/ovo-ouro.webp',name:'Ovos de Ouro',description:'Produza ovos de ouro no Galinheiro.',icon:'🥇',metric:'goldEggs',tiers:[[1,50],[10,200],[50,1000]]},
  {id:'diamondEggs',art:'assets/galinheiro/ovos/ovo-diamante.webp',name:'Ovos de Diamante',description:'Produza ovos de diamante no Galinheiro.',icon:'💎',metric:'diamondEggs',tiers:[[1,50],[10,200],[50,1000]]},
  {id:'hens',name:'Criador de Galinhas',description:'Tenha 10 galinhas no Galinheiro.',icon:'🐔',metric:'hens',tiers:[[10,200]]},
  {id:'wheat',name:'Colheita Generosa',description:'Colha 50 unidades de trigo.',icon:'🌾',metric:'wheat',tiers:[[50,300]]},
  {id:'merchant',name:'Comerciante',description:'Venda 20 unidades de produtos.',icon:'🪙',metric:'sold',tiers:[[20,250]]},
  {id:'builder',name:'Construtor',description:'Conclua 3 construções.',icon:'🏠',metric:'buildings',tiers:[[3,500]]},
  {id:'plant',name:'Plantio Contínuo',description:'Plante 30 cultivos.',icon:'🌿',metric:'plantings',tiers:[[30,300]]},
  {id:'level',name:'Fazendeiro Experiente',description:'Alcance o nível 10.',icon:'⭐',metric:'level',tiers:[[10,400]]}
 ];
 // Definir UMA VEZ na preparação do lançamento. Null mantém a inscrição beta aberta na branch de testes.
 const BETA_CUTOFF=null;
 const count=v=>Number.isSafeInteger(v)&&v>=0?v:0;
 function restore(raw={}){return {version:1,counters:Object.fromEntries(['goldEggs','diamondEggs','harvests','hens','wheat','sold','buildings','plantings','level'].map(k=>[k,count(raw?.counters?.[k])])),claimed:Object.fromEntries(DEFINITIONS.map(d=>[d.id,Math.min(d.tiers.length,count(raw?.claimed?.[d.id]))])),discoveries:[...new Set((Array.isArray(raw?.discoveries)?raw.discoveries:[]).filter(x=>typeof x==='string'&&x.length<150))],betaEligible:raw?.betaEligible===true};}
 function eligibility(s,createdAt,cutoff=BETA_CUTOFF){if(Number.isFinite(createdAt)&&createdAt>0&&(cutoff===null||createdAt<=cutoff))s.betaEligible=true;return s.betaEligible;}
 function discover(s,id){if(typeof id==='string'&&id&&!s.discoveries.includes(id))s.discoveries.push(id);}
 function record(s,event,qty=1,type='',units=0){qty=count(qty);if(event==='harvest'){s.counters.harvests=Math.min(Number.MAX_SAFE_INTEGER,s.counters.harvests+qty);if(type==='trigo')s.counters.wheat=Math.min(Number.MAX_SAFE_INTEGER,s.counters.wheat+count(units));discover(s,'crop:'+type);}else if(event==='plant'||event==='sale'){const k=event==='plant'?'plantings':'sold';s.counters[k]=Math.min(Number.MAX_SAFE_INTEGER,s.counters[k]+qty);if(type)discover(s,(event==='plant'?'crop:':'product:')+type);}}
 function status(s,d){const tier=s.claimed[d.id],done=tier>=d.tiers.length,[goal,reward]=d.tiers[Math.min(tier,d.tiers.length-1)],progress=d.metric==='beta'?Number(s.betaEligible):s.counters[d.metric];return {tier,done,goal,reward,progress,ready:!done&&progress>=goal};}
 function claim(s,id,grant){const d=DEFINITIONS.find(x=>x.id===id);if(!d)return false;const v=status(s,d);if(!v.ready)return false;
  // Reserva antes de conceder para impedir reentrada. Falhas liberam a mesma etapa.
  s.claimed[id]++;try{if(grant({id,tier:v.tier,reward:v.reward,trophy:!!d.trophy})===false){s.claimed[id]--;return false;}}catch(e){s.claimed[id]--;throw e;}return true;
 }
 root.MFAchievementsCore={DEFINITIONS,BETA_CUTOFF,restore,eligibility,discover,record,status,claim};
})(globalThis);
