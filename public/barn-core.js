(function(root){
 const ID='item-celeiro',TIME=300000;
 const is=t=>!!t&&(t.itemId===ID||Number.isFinite(t.barnStartedAt));
 const layout=o=>({w:o?6:4,h:o?4:6,visualScale:o?5/6:5/4});
 function stage(t,now=Date.now()){return now>=t.barnReadyAt?3:(now-t.barnStartedAt)/TIME>=.75?2:(now-t.barnStartedAt)/TIME>=.35?1:0;}
 function art(t,now=Date.now()){const s=stage(t,now);return s===0?'assets/construcoes/fundacao.svg':s===1?'assets/construcoes/estrutura.svg':`assets/construcoes/celeiro-${t.barnOrientation?1:0}.png`;}
 function start(gx,gy,orientation,now=Date.now()){const t={gx,gy,itemId:ID,name:'Celeiro',barnOrientation:orientation?1:0,barnStartedAt:now,barnReadyAt:now+TIME,barnXPGranted:false,...layout(orientation)};t.imgSrc=art(t,now);return t;}
 function sync(t,now=Date.now(),award=true){if(!is(t))return {stars:0,changed:false};const src=art(t,now);let changed=t.imgSrc!==src;t.imgSrc=src;let stars=0;if(now>=t.barnReadyAt&&award&&!t.barnXPGranted){t.barnXPGranted=true;stars=5;changed=true;}return {stars,changed};}
 function fits(t,cols,rows,objects,ignore){return t.gx>=0&&t.gy>=0&&t.gx+t.w<=cols&&t.gy+t.h<=rows&&!objects.some(x=>x!==ignore&&t.gx<x.gx+(x.w||1)&&t.gx+t.w>x.gx&&t.gy<x.gy+(x.h||1)&&t.gy+t.h>x.gy);}
 function rotate(t,cols,rows,objects){const o=t.barnOrientation?0:1,next={...t,...layout(o),barnOrientation:o};next.gx=t.gx+(t.w-next.w)/2;next.gy=t.gy+(t.h-next.h)/2;if(!fits(next,cols,rows,objects,t))return false;Object.assign(t,next);t.imgSrc=art(t);return true;}
 root.MFBarnCore={ID,TIME,is,layout,stage,art,start,sync,fits,rotate};
})(typeof window==='undefined'?globalThis:window);
