(function(root){
 const ID='item-celeiro',TIME=300000;
 const is=t=>!!t&&(t.itemId===ID||t.id===ID||Number.isFinite(t.barnStartedAt));
 const layout=o=>({w:o?6:4,h:o?4:6,visualScale:o?5/6:5/4});
 function stage(t,now=Date.now()){return now>=t.barnReadyAt?3:(now-t.barnStartedAt)/TIME>=.75?2:(now-t.barnStartedAt)/TIME>=.35?1:0;}
 function art(t,now=Date.now()){const s=stage(t,now);return s===0?'assets/construcoes/fundacao.svg':s===1?'assets/construcoes/estrutura.svg':`assets/construcoes/celeiro-${t.barnOrientation?1:0}.png`;}
 function start(gx,gy,orientation,now=Date.now()){const t={gx,gy,itemId:ID,name:'Celeiro',barnOrientation:orientation?1:0,barnStartedAt:now,barnReadyAt:now+TIME,barnXPGranted:false,...layout(orientation)};t.imgSrc=art(t,now);return t;}
 function sync(t,now=Date.now(),award=true){if(!is(t))return {stars:0,changed:false};const src=art(t,now);let changed=t.imgSrc!==src;t.imgSrc=src;let stars=0;if(now>=t.barnReadyAt&&award&&!t.barnXPGranted){t.barnXPGranted=true;stars=5;changed=true;}return {stars,changed};}
 function fits(t,cols,rows,objects,ignore){return t.gx>=0&&t.gy>=0&&t.gx+t.w<=cols&&t.gy+t.h<=rows&&!objects.some(x=>x!==ignore&&t.gx<x.gx+(x.w||1)&&t.gx+t.w>x.gx&&t.gy<x.gy+(x.h||1)&&t.gy+t.h>x.gy);}
 function rotate(t,cols,rows,objects){const o=t.barnOrientation?0:1,next={...t,...layout(o),barnOrientation:o};next.gx=t.gx+(t.w-next.w)/2;next.gy=t.gy+(t.h-next.h)/2;if(!fits(next,cols,rows,objects,t))return false;Object.assign(t,next);t.imgSrc=art(t);return true;}
 // Os três pontos são os cantos visíveis da base, em pixels da arte 640x512.
 // Cada face recebe sua projeção; as paredes verticais continuam verticais.
 function geometry(t,anchor,src=''){
  const construction=/fundacao|estrutura/.test(src),o=t.barnOrientation?1:0;
  const foot=construction?{left:[30,355],front:[330,500],right:[610,355]}:o?{left:[10,333],front:[357,500],right:[629,362]}:{left:[10,360],front:[336,500],right:[630,367]};
  const w=t.w||layout(o).w,h=t.h||layout(o).h;
  const front={x:anchor.x+(w-h)*24,y:anchor.y+(w+h)*12};
  const left={x:front.x-w*48,y:front.y-w*24},right={x:front.x+h*48,y:front.y-h*24};
  const [fx,fy]=foot.front,d=(w+h)*24/(2*fy-foot.left[1]-foot.right[1]);
  const segments=[['left',left,0,fx],['right',right,fx,640]].map(([side,target,x0,x1])=>{
   const [px,py]=foot[side],a=(target.x-front.x)/(px-fx),b=(target.y-front.y-d*(py-fy))/(px-fx);
   return {a,b,d,e:front.x-a*fx,f:front.y-b*fx-d*fy,x0,x1};
  });
  function project(x,y){const m=segments[x<fx?0:1];return {x:m.a*x+m.e,y:m.b*x+m.d*y+m.f};}
  function unproject(x,y){const m=segments[x<front.x?0:1],ix=(x-m.e)/m.a;return {x:ix,y:(y-m.b*ix-m.f)/m.d};}
  return {segments,foot,front,left,right,project,unproject};
 }
 root.MFBarnCore={ID,TIME,is,layout,stage,art,start,sync,fits,rotate,geometry};
})(typeof window==='undefined'?globalThis:window);
