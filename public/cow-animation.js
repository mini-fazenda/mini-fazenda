/* Quadros do GIF original no canvas: animação e cercas compartilham a profundidade. */
(function(root){
 const durations=[70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70, 60, 70, 70],WIDTH=271,HEIGHT=232,COLUMNS=8,total=durations.reduce((a,b)=>a+b,0);let atlas;
 function frameIndex(now){let t=((now%total)+total)%total;for(let n=0;n<durations.length;n++){if(t<durations[n])return n;t-=durations[n];}return 0;}
 function draw(g,t,box,now){if(t?.animal?.tipo!=='vaca'||t.animal.etapa!==2||!atlas?.complete||!atlas.naturalWidth)return false;
  const n=frameIndex(now??performance.now());g.save();if(t.animal.flipped){g.translate(box.x+box.w,box.y);g.scale(-1,1);}else g.translate(box.x,box.y);
  g.drawImage(atlas,(n%COLUMNS)*WIDTH,Math.floor(n/COLUMNS)*HEIGHT,WIDTH,HEIGHT,0,0,box.w,box.h);g.restore();return true;
 }
 root.MFCowAnimation={frameIndex,draw,durations,total};
 if(typeof document==='undefined')return;atlas=new Image();atlas.onload=()=>root.requestRedraw?.();atlas.src=new URL('./assets/animais/vaca-atlas.webp',document.currentScript.src).href;
})(globalThis);
