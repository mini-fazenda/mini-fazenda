/* Dimensões da grade: o rio acompanha gx=0; a loja apresenta linhas × colunas. */
(function(root){
 const levels=[{id:1,price:20000,level:1,cols:32,rows:32,dx:6,dy:6,dc:12,dr:12,text:'+3 canteiros em todos os lados'}, {id:2,price:100000,level:25,cols:44,rows:44,dx:6,dy:6,dc:12,dr:12,text:'+3 canteiros em todos os lados'}, {id:3,price:300000,level:50,cols:54,rows:64,dx:0,dy:10,dc:10,dr:20,text:'+5 canteiros em 3 lados'}];
 function normalize(saved,cols=20,rows=20){
  const applied=new Set((Array.isArray(saved?.applied)?saved.applied:[]).filter(n=>[1,2,3].includes(n)));
  // Reconhecer espaço legado não desloca objetos nem cobra novamente.
  for(const e of levels)if((cols>=e.cols&&rows>=e.rows)||(e.id===3&&cols>=e.rows&&rows>=e.cols))for(let i=1;i<=e.id;i++)applied.add(i);
  const highest=Math.max(0,...applied);for(let i=1;i<=highest;i++)applied.add(i);
  return {version:1,applied:[...applied].sort(),shiftX:Math.max(0,Number(saved?.shiftX)||0),shiftY:Math.max(0,Number(saved?.shiftY)||0)};
 }
 function plan(saved,cols,rows,id,level,coins){
  const state=normalize(saved,cols,rows),e=levels.find(e=>e.id===id);
  if(!e)return {error:'Expansão inválida'};
  if(state.applied.includes(id))return {error:'Comprada ✓'};
  if(id>1&&!state.applied.includes(id-1))return {error:'Compre a expansão anterior'};
  if(level<e.level)return {error:'Libera no nível '+e.level};
  if(coins<e.price)return {error:'Moedas insuficientes'};
  if(cols+e.dc>100||rows+e.dr>100)return {error:'Limite de tamanho atingido'};
  return {e,cols:cols+e.dc,rows:rows+e.dr,coins:coins-e.price,state:{...state,applied:[...state.applied,id],shiftX:state.shiftX+e.dx,shiftY:state.shiftY+e.dy}};
 }
 root.MFExpansionCore={levels,normalize,plan};
})(globalThis);
