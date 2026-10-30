/* Coordenadas do jogo em pixels CSS; buffers em pixels físicos da tela. */
(function(root){
 const viewport={width:1,height:1,ratio:1};
 function measure(){
  viewport.width=Math.max(1,Math.round(root.innerWidth||1));
  viewport.height=Math.max(1,Math.round(root.innerHeight||1));
  // Limite de memória para o cenário, cache e água em aparelhos de alta densidade.
  viewport.ratio=Math.max(1,Math.min(Number(root.devicePixelRatio)||1,2,Math.sqrt(4000000/(viewport.width*viewport.height))));
 }
 function resize(surface){
  measure();
  const width=Math.round(viewport.width*viewport.ratio),height=Math.round(viewport.height*viewport.ratio);
  if(surface.width!==width)surface.width=width;
  if(surface.height!==height)surface.height=height;
  if(surface.style.width!==viewport.width+'px')surface.style.width=viewport.width+'px';
  if(surface.style.height!==viewport.height+'px')surface.style.height=viewport.height+'px';
  const g=surface.getContext('2d');
  g.setTransform(viewport.ratio,0,0,viewport.ratio,0,0);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 }
 measure();root.MFViewport=Object.assign(viewport,{measure,resize});
})(window);
