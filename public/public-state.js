// Somente a cena pública. Nunca publique inventário, tarefas, recibos ou backups.
export function publicState(state){
 const visual={};for(const key of ['version','savedAt','playerLevel','COLS','ROWS','terrenos','offsetX','offsetY','zoom','character','fences','runtimeVersion','expansions'])if(state[key]!==undefined)visual[key]=state[key];
 return {...visual,farmName:typeof state.farmName==='string'&&state.farmName.trim()?state.farmName.slice(0,12):'Fazenda',moedas:0,playerXP:Number(state.playerXP)||0,inventory:{},truckOrder:null,loot:[],actionQueue:[],storedObjects:[],player:{...state.player,path:[],action:null},aradora:{...state.aradora,path:[],fila:[],action:null}};
}
