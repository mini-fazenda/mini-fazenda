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
 root.MFPlotGround={isPlot,corners,path,draw};
})(globalThis);
