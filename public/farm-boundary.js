/* Limite visual acompanha o terreno real, inclusive depois de expandir. */
(function(root){
 const corners=(cols,rows,tw=96,th=48)=>[
  {x:0,y:-th/2},{x:cols*tw/2,y:(cols-1)*th/2},
  {x:(cols-rows)*tw/2,y:(cols+rows-1)*th/2},{x:-rows*tw/2,y:(rows-1)*th/2}
 ];
 function draw(g,cols,rows,zoom=1){
  const points=corners(cols,rows),z=Math.max(.1,zoom);
  g.save();g.beginPath();points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();
  g.fillStyle='rgba(255,245,167,.10)';g.fill();
  g.lineJoin='round';g.strokeStyle='#356529';g.lineWidth=4/z;g.stroke();
  g.setLineDash([10/z,7/z]);g.strokeStyle='#fff0ad';g.lineWidth=2/z;g.stroke();g.restore();
 }
 root.MFFarmBoundary={draw,corners};
})(typeof window==='undefined'?globalThis:window);
