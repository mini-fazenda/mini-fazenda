/* Base da arte projetada no canteiro lógico; nenhuma plantação é movida. */
(function(root){
 const bases={"girassol-quase.png":{"left":[167,462.0],"front":[295.0,542],"right":[588,391.5]},"melancia-inicio-v3.webp":{"left":[2,379.0],"front":[303.5,546],"right":[596,379.0]},"espinafre-final.png":{"left":[9,391.0],"front":[298.0,539],"right":[590,390.0]},"espinafre-inicio-v3.png":{"left":[2,379.0],"front":[301.0,547],"right":[597,378.5]},"melancia-final-v3.webp":{"left":[2,377.0],"front":[303.0,548],"right":[596,377.0]},"melancia-quase-v3.webp":{"left":[3,378.0],"front":[304.0,547],"right":[597,377.5]},"espinafre-final-v3.png":{"left":[2,373.0],"front":[304.0,547],"right":[597,374.0]},"girassol-final.png":{"left":[10,391.0],"front":[293.0,542],"right":[587,394.0]},"cenoura-final.png":{"left":[11,392.0],"front":[296.5,542],"right":[590,395.0]},"espinafre-quase-v3.png":{"left":[2,379.5],"front":[303.0,547],"right":[597,379.0]},"trigo-quase.png":{"left":[9,387.5],"front":[300.5,543],"right":[593,383.0]},"cenoura-quase.png":{"left":[11,390.0],"front":[299.0,542],"right":[586,394.0]},"cenoura-inicio.png":{"left":[11,390.0],"front":[308.5,542],"right":[589,391.0]},"girassol-inicio.png":{"left":[11,391.5],"front":[302.0,543],"right":[589,390.5]},"trigo-inicio.png":{"left":[9,393.0],"front":[299.5,543],"right":[591,387.0]}};
 function geometry(t,anchor,src){
  const foot=bases[String(src||'').split('/').pop().split('?')[0]];if(!foot)return null;
  const w=t.w||2,h=t.h||2,front={x:anchor.x+(w-h)*24,y:anchor.y+(w+h)*12};
  const left={x:front.x-w*48,y:front.y-w*24},right={x:front.x+h*48,y:front.y-h*24};
  const [fx,fy]=foot.front,d=(w+h)*24/(2*fy-foot.left[1]-foot.right[1]);
  const segments=[['left',left],['right',right]].map(([side,target])=>{
   const [px,py]=foot[side],a=(target.x-front.x)/(px-fx),b=(target.y-front.y-d*(py-fy))/(px-fx);
   return {a,b,d,e:front.x-a*fx,f:front.y-b*fx-d*fy,side};
  });
  function project(x,y){const m=segments[x<fx?0:1];return {x:m.a*x+m.e,y:m.b*x+m.d*y+m.f};}
  function unproject(x,y){const m=segments[x<front.x?0:1],ix=(x-m.e)/m.a;return {x:ix,y:(y-m.b*ix-m.f)/m.d};}
  return {segments,foot,front,left,right,project,unproject};
 }
 function drawSprite(g,t,anchor,img){const m=geometry(t,anchor,img.src||t.imgSrc);if(!m)return false;
  for(const s of m.segments){g.save();g.transform(s.a,s.b,0,s.d,s.e,s.f);g.beginPath();const overlap=1/Math.abs(s.a),x=s.side==='left'?0:m.foot.front[0]-overlap,w=s.side==='left'?m.foot.front[0]+overlap:img.naturalWidth-x;g.rect(x,0,w,img.naturalHeight);g.clip();g.drawImage(img,0,0);g.restore();}return true;
 }
 let hitCanvas,hitContext;
 function hit(t,img,x,y,anchor){const m=geometry(t,anchor,img.src||t.imgSrc);if(!m)return null;const p=m.unproject(x,y);
  if(p.x<0||p.y<0||p.x>=img.naturalWidth||p.y>=img.naturalHeight)return false;
  if(!hitCanvas){hitCanvas=document.createElement('canvas');hitCanvas.width=hitCanvas.height=1;hitContext=hitCanvas.getContext('2d',{willReadFrequently:true});}
  hitContext.clearRect(0,0,1,1);hitContext.drawImage(img,p.x,p.y,1,1,0,0,1,1);return hitContext.getImageData(0,0,1,1).data[3]>40;
 }
 root.MFCropSprites={bases,geometry,drawSprite,hit};
})(globalThis);
