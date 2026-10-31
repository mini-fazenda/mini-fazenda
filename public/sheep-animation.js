/* Duas poses estáveis; transições curtas e mastigação discreta, sem alternar corpos diferentes. */
(function(root){
 const IDLE='assets/animais/ovelha-parada.png',ATLAS='assets/animais/ovelha-suave-atlas.png',CYCLE=20000;
 let frames=[];
 function frameIndex(now,seed=0){const t=((now+seed)%CYCLE+CYCLE)%CYCLE;
  if(t<13000)return 0;
  if(t<13600)return Math.min(20,Math.floor((t-13000)/600*21));
  if(t<19400)return [20,21,22,23,24,25,24,23,22,21][Math.floor((t-13600)/180)%10];
  return Math.max(0,20-Math.floor((t-19400)/600*21));
 }
 function normalize(t){if(t?.animal?.tipo!=='ovelha')return;t.w=2;t.h=1;t.visualScale=.45;if(t.animal.etapa===2)t.imgSrc=IDLE;}
 root.MFSheepAnimation={frameIndex,normalize,src(t,now){
  if(t?.animal?.tipo!=='ovelha'||t.animal.etapa!==2||!frames.length)return t?.imgSrc;
  const seed=((Number(t.gx)||0)*7+(Number(t.gy)||0)*11)%13*449;return frames[frameIndex(now??performance.now(),seed)];
 }};
 if(typeof document==='undefined')return;
 const atlas=new Image();atlas.onload=()=>{const ready=[];for(let n=0;n<26;n++){const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(atlas,(n%6)*256,Math.floor(n/6)*256,256,256,0,0,256,256);const src=c.toDataURL('image/png');ready.push(src);if(typeof preload==='function')preload(src);}frames=ready;if(typeof requestRedraw==='function')requestRedraw();};atlas.src=ATLAS;
})(globalThis);
