/* Sorteio de duas opções sem repetição; valores de controle não aparecem na UI. */
(function(root){
 const rows=[
 ['cenoura',20,1800],['trigo',20,1400],['milho',10,1000],['espinafre',5,850],['morango',5,600],['cana',1,100],['feijao',1,50],['abacaxi',3,250],['melancia',3,200],['girassol',1,200],['beterraba',3,150],['cafe',2,150],['soja',1,30],['cebola',1,20],['arroz',1,20],['limao',5,100],['maca',4,80],['laranja',3,60],['acerola',2,40],['leite',5,150],['la',3,120]
 ];
 const pool=rows.map(([id,qty,weight])=>({id,kind:'product',qty,weight}));
 for(const [id,qty,weight]of [['madeira',2,250],['telha',1,180],['feno',2,180]])pool.push({id,kind:'material',qty,weight});
 for(const [qty,weight]of [[500,350],[1000,150],[2000,50]])pool.push({id:'coins-'+qty,kind:'coins',qty,weight});
 for(const [id,weight]of [['arvore-limao',35],['arvore-maca',25],['arvore-laranja',15],['arvore-acerola',10],['vaca',45],['ovelha',55],['porco',30],['cavalo',20],['bodejunino',10],['celeiro',40]])pool.push({id,kind:'object',qty:1,weight});
 for(const [id,weight]of [['flowers',120],['wire',90],['white',50]])pool.push({id,kind:'fence',qty:5,weight});
 const bonus=level=>100+200*Math.floor((Math.max(2,level)-1)/5);
 const clone=x=>JSON.parse(JSON.stringify(x));
 function draw(rng=Math.random){const available=pool.slice(),out=[];while(out.length<2){let n=Math.max(0,Math.min(.999999999,rng()))*available.reduce((s,r)=>s+r.weight,0),i=0;while(i<available.length-1&&n>=available[i].weight)n-=available[i++].weight;out.push({...available.splice(i,1)[0]});}return out;}
 function create(){let state={version:1,highest:1,pending:[]};return {
  capture:()=>clone(state),
  restore(saved,level=1){state={version:1,highest:Math.max(1,Number(level)||1,Number(saved?.highest)||1),pending:Array.isArray(saved?.pending)?clone(saved.pending):[]};},
  earned(level,rng){if(!Number.isSafeInteger(level)||level<=state.highest)return false;state.highest=level;state.pending.push({level,bonus:bonus(level),options:draw(rng)});return true;},
  current:()=>state.pending[0]?clone(state.pending[0]):null,
  claim(level,index,grant){const entry=state.pending[0];if(!entry||entry.level!==level||![0,1].includes(index))return false;grant(clone(entry.options[index]),entry.bonus);state.pending.shift();return true;}
 };}
 root.MFLevelRewardCore={pool,bonus,draw,create};
})(globalThis);
