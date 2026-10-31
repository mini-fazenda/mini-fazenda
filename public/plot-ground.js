/* Escala visual dos canteiros; ocupação e seleção usam a geometria lógica inteira. */
(function(root){
 root.PLOT_VISUAL_SCALE = root.PLOT_VISUAL_SCALE ?? 0.92;
 const visualScale=()=>Math.max(.01,Math.min(1,Number(root.PLOT_VISUAL_SCALE)||.92));
 const isPlot=t=>!!t&&!t.animal&&!t.fruitTree&&(!!t.cultura||/terra-(?:seca|arada)/.test(t.imgSrc||''));
 function corners(t,project){
  const x=t.gx-.5,y=t.gy-.5,w=t.w||1,h=t.h||1;
  return [project(x,y),project(x+w,y),project(x+w,y+h),project(x,y+h)];
 }
 function visualCorners(t,project,scale=visualScale()){const points=corners(t,project),center={x:(points[0].x+points[2].x)/2,y:(points[0].y+points[2].y)/2};return points.map(p=>({x:center.x+(p.x-center.x)*scale,y:center.y+(p.y-center.y)*scale}));}
 function path(t,project,visual=false){const points=visual?visualCorners(t,project):corners(t,project),p=new Path2D();points.forEach((a,i)=>i?p.lineTo(a.x,a.y):p.moveTo(a.x,a.y));p.closePath();return p;}
 function draw(g,plots,project,ignore){
  g.save();g.fillStyle='#965d30';g.strokeStyle='#965d30';g.lineWidth=.65;g.lineJoin='round';
  for(const t of plots){if(t===ignore||!isPlot(t))continue;const p=path(t,project,true);g.fill(p);g.stroke(p);}
  g.restore();
 }
 // Only shared edges receive a soil bridge; isolated edges and corridors stay intact.
 function drawJoins(g,plots,project,ignore){
  if(visualScale()<1)return;
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
 function drawSprite(g,t,anchor,img){
  if(!isPlot(t))return false;
  const factor=visualScale();g.save();
  try{g.translate(anchor.x,anchor.y);g.scale(factor,factor);g.translate(-anchor.x,-anchor.y);
   if(root.MFCropSprites?.drawSprite(g,t,anchor,img))return true;
   const vs=root.MFAdapter?.scaleForStructure?.(t,Number(t.visualScale)||1)??(Number(t.visualScale)||1),w=TILE_W*(t.w||1)*vs,h=w*img.naturalHeight/img.naturalWidth,x=anchor.x-w/2,y=anchor.y-h+TILE_H*.9;
   // GIF sprites are positioned in screen space by the shared compositor.
   if(root.MFAdapter?.isGif(t.imgSrc)){const key='plot-'+(t._mfGifId||(t._mfGifId=++root.__mfGifSequence));if(root.MFAdapter.gifPlace(key,t.imgSrc,anchor.x,anchor.y+(y+h-anchor.y)*factor,w*factor,h*factor))return true;}
   g.drawImage(img,x,y,w,h);return true;
  }finally{g.restore();}
 }
 root.MFPlotGround={isPlot,corners,visualCorners,visualScale,path,draw,drawJoins,drawSprite};
})(globalThis);
