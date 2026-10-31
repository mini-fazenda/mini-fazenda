/* O chão ocupa o canteiro lógico inteiro, mesmo quando o PNG tem margens. */
(function(root){
 const isPlot=t=>!!t&&!t.animal&&!t.fruitTree&&(!!t.cultura||/terra-(?:seca|arada)/.test(t.imgSrc||''));
 function corners(t,project){
  const x=t.gx-.5,y=t.gy-.5,w=t.w||1,h=t.h||1;
  return [project(x,y),project(x+w,y),project(x+w,y+h),project(x,y+h)];
 }
 function path(t,project){const points=corners(t,project),p=new Path2D();points.forEach((a,i)=>i?p.lineTo(a.x,a.y):p.moveTo(a.x,a.y));p.closePath();return p;}
 function draw(g,plots,project,ignore){
  g.save();g.fillStyle='#965d30';g.strokeStyle='#965d30';g.lineWidth=.65;g.lineJoin='round';
  for(const t of plots){if(t===ignore||!isPlot(t))continue;const p=path(t,project);g.fill(p);g.stroke(p);}
  g.restore();
 }
 // Only shared edges receive a soil bridge; isolated edges and corridors stay intact.
 // Mantém a geometria em coordenadas do mundo. Mudanças na câmera não
 // invalidam os encontros dos canteiros: só posições/tamanhos ou modo mover.
 let lastSignature='',lastProject=null,lastSegments=[];
 function segmentsFor(list,project){
  const byStartX=new Map(),byEndX=new Map(),byStartY=new Map(),byEndY=new Map();
  function add(map,key,index){let ids=map.get(key);if(!ids)map.set(key,ids=[]);ids.push(index);}
  for(let i=0;i<list.length;i++){
   const t=list[i];add(byStartX,t.gx,i);add(byEndX,t.gx+(t.w||1),i);
   add(byStartY,t.gy,i);add(byEndY,t.gy+(t.h||1),i);
  }
  const segments=[];
  for(let i=0;i<list.length;i++){
   const a=list[i],aw=a.w||1,ah=a.h||1,candidates=new Set();
   for(const ids of [byStartX.get(a.gx+aw),byEndX.get(a.gx),byStartY.get(a.gy+ah),byEndY.get(a.gy)]){
    if(ids)for(const j of ids)if(j>i)candidates.add(j);
   }
   for(const j of [...candidates].sort((x,y)=>x-y)){
    const b=list[j],bw=b.w||1,bh=b.h||1;
    let start,end;
    if(a.gx+aw===b.gx||b.gx+bw===a.gx){
     const lo=Math.max(a.gy,b.gy),hi=Math.min(a.gy+ah,b.gy+bh);if(hi<=lo)continue;
     const x=(a.gx+aw===b.gx?b.gx:a.gx)-.5;start=project(x,lo-.5);end=project(x,hi-.5);
    }else if(a.gy+ah===b.gy||b.gy+bh===a.gy){
     const lo=Math.max(a.gx,b.gx),hi=Math.min(a.gx+aw,b.gx+bw);if(hi<=lo)continue;
     const y=(a.gy+ah===b.gy?b.gy:a.gy)-.5;start=project(lo-.5,y);end=project(hi-.5,y);
    }else continue;
    const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy);
    if(!len)continue;
    const nx=-dy/len,ny=dx/len;
    segments.push([start.x+nx,start.y+ny,end.x+nx,end.y+ny,end.x-nx,end.y-ny,start.x-nx,start.y-ny]);
   }
  }
  return segments;
 }
 function drawJoins(g,plots,project,ignore){
  const list=plots.filter(t=>t!==ignore&&isPlot(t));
  const signature=list.map(t=>[t.gx,t.gy,t.w||1,t.h||1].join(',')).join(';');
  if(signature!==lastSignature||lastProject!==project){
   lastSegments=segmentsFor(list,project);lastSignature=signature;lastProject=project;
  }
  g.save();g.fillStyle='#965d30';
  for(const p of lastSegments){
   g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[2],p[3]);
   g.lineTo(p[4],p[5]);g.lineTo(p[6],p[7]);g.closePath();g.fill();
  }
  g.restore();
 }

 root.MFPlotGround={isPlot,corners,path,draw,drawJoins};
})(globalThis);
