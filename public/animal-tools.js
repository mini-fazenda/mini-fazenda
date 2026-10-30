/* Ferramentas desenhadas na camada do cursor, sem depender de URLs externas. */
(()=>{
 window.MFAnimalTools={draw(ctx,kind,x,y){ctx.save();ctx.translate(x-22,y-23);ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeStyle='#445563';
 if(kind==='bucket'){
  ctx.beginPath();ctx.ellipse(23,16,14,13,0,Math.PI,0);ctx.stroke();
  ctx.beginPath();ctx.moveTo(6,16);ctx.lineTo(11,43);ctx.quadraticCurveTo(23,49,35,43);ctx.lineTo(40,16);ctx.closePath();ctx.fillStyle='#a3cbdc';ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(23,16,17,5,0,0,Math.PI*2);ctx.fillStyle='#fffce7';ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(15,24);ctx.lineTo(18,38);ctx.strokeStyle='#e6f8ff';ctx.stroke();
 }else{
  ctx.beginPath();ctx.moveTo(18,26);ctx.lineTo(38,3);ctx.lineTo(30,30);ctx.lineTo(8,6);ctx.closePath();ctx.fillStyle='#dfeef1';ctx.fill();ctx.stroke();
  for(const [cx,cy] of [[13,36],[33,36]]){ctx.beginPath();ctx.ellipse(cx,cy,8,9,0,0,Math.PI*2);ctx.fillStyle='#65a642';ctx.fill();ctx.stroke();}
  ctx.beginPath();ctx.arc(23,25,3,0,Math.PI*2);ctx.fillStyle='#e8c166';ctx.fill();ctx.stroke();
 }ctx.restore();}};
 const style=document.createElement('style');style.textContent='@keyframes mf-sheep-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.015)}}.mf-sheep-idle{animation:mf-sheep-breathe 2.4s ease-in-out infinite;transform-origin:center bottom!important}@media(prefers-reduced-motion:reduce){.mf-sheep-idle{animation:none}}';document.head.append(style);
})();
