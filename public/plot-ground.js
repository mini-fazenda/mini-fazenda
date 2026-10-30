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
 function drawJoins(g,plots,project,ignore){
  const list=plots.filter(t=>t!==ignore&&isPlot(t));
  g.save();g.fillStyle='#965d30';
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const a=list[i],b=list[j],aw=a.w||1,ah=a.h||1,bw=b.w||1,bh=b.h||1;
   let start,end;
   if(a.gx+aw===b.gx||b.gx+bw===a.gx){
    const lo=Math.max(a.gy,b.gy),hi=Math.min(a.gy+ah,b.gy+bh);if(hi<=lo)continue;
    const x=(a.gx+aw===b.gx?b.gx:a.gx)-.5;start=project(x,lo-.5);end=project(x,hi-.5);
   }else if(a.gy+ah===b.gy||b.gy+bh===a.gy){
    const lo=Math.max(a.gx,b.gx),hi=Math.min(a.gx+aw,b.gx+bw);if(hi<=lo)continue;
    const y=(a.gy+ah===b.gy?b.gy:a.gy)-.5;start=project(lo-.5,y);end=project(hi-.5,y);
   }else continue;
   const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
   g.beginPath();g.moveTo(start.x+nx,start.y+ny);g.lineTo(end.x+nx,end.y+ny);
   g.lineTo(end.x-nx,end.y-ny);g.lineTo(start.x-nx,start.y-ny);g.closePath();g.fill();
  }g.restore();
 }
 root.MFPlotGround={isPlot,corners,path,draw,drawJoins};
})(globalThis);
