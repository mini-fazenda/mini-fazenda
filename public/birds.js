/* Pássaros decorativos: nenhum estoque, ocupação, clique ou alteração no save. */
(function(root){
 'use strict';
 const CELL_W=192,CELL_H=144,LEG_MS=24000,CYCLE_MS=LEG_MS*2;
 const frames=[],birds=[];let routeSignature='';
 const iso=(gx,gy)=>({x:(gx-gy)*48,y:(gx+gy)*24});
 const smooth=t=>t*t*(3-2*t);
 function occupied(p,objects){
  return objects.some(t=>p.gx>=t.gx-.45&&p.gx<=t.gx+(t.w||1)-.55&&p.gy>=t.gy-.45&&p.gy<=t.gy+(t.h||1)-.55);
 }
 function clearSpot(gx,gy,cols,rows,objects){
  for(let radius=0;radius<5;radius++)for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
   if(radius&&Math.max(Math.abs(x),Math.abs(y))!==radius)continue;
   const p={gx:gx+x,gy:gy+y};
   if(p.gx>=1&&p.gx<cols-1&&p.gy>=1&&p.gy<rows-1&&!occupied(p,objects))return p;
  }
  return {gx:cols+2,gy:Math.min(rows-1,Math.max(1,gy))};
 }
 function sample(now,bird){
  const clock=((now+bird.offset)%CYCLE_MS+CYCLE_MS)%CYCLE_MS,back=clock>=LEG_MS,t=clock%LEG_MS;
  const a=back?bird.b:bird.a,b=back?bird.a:bird.b;
  const u=Math.max(0,Math.min(1,(t-7000)/15000)),k=smooth(u),a2=iso(a.gx,a.gy),b2=iso(b.gx,b.gy);
  let state=t<7000||t>=22000?'chao':t<9000?'decolando':t<15000?'voando':t<19000?'planando':'pousando';
  const height=state==='chao'?0:Math.pow(Math.sin(Math.PI*u),.8)*110;
  let pose;
  if(state==='chao'){
   const seq=[0,0,1,2,3,0,bird.color?4:5,bird.color?4:5,6,0];pose=seq[Math.floor(t/500)%seq.length];
  }else if(state==='planando')pose=13+Math.floor(t/280)%4;
  else if(state==='decolando'||state==='pousando')pose=17+Math.floor(t/110)%6;
  else pose=7+Math.floor(t/125)%6;
  return {state,pose,color:bird.color,x:a2.x+(b2.x-a2.x)*k,y:a2.y+(b2.y-a2.y)*k,height,
   gx:a.gx+(b.gx-a.gx)*k,gy:a.gy+(b.gy-a.gy)*k,facing:b2.x>=a2.x?1:-1};
 }
 function routes(cols,rows,objects){
  return Array.from({length:4},(_,i)=>({color:i%2,offset:i*11300,
   a:clearSpot(2+i*3,rows*.68-i*2,cols,rows,objects),
   b:clearSpot(cols-3-i*2,3+i*3,cols,rows,objects)}));
 }
 function draw(g,now){
  if(!frames.length||root.MFAmbient?.enabled?.()===false)return;
  const objects=typeof terrenos==='undefined'?[]:terrenos,cols=typeof COLS==='undefined'?20:COLS,rows=typeof ROWS==='undefined'?20:ROWS;
  const sig=cols+'x'+rows;if(sig!==routeSignature){birds.splice(0,birds.length,...routes(cols,rows,objects));routeSignature=sig;}
  const view=root.MFAdapter;if(!view?.spritePlace)return;
  birds.forEach((bird,i)=>{
   const p=sample(now,bird);
   // Uma construção nova no pouso não é atravessada: o pássaro segue pairando.
   if(p.height<24&&occupied(p,objects)){p.height=24;p.state='voando';p.pose=17+Math.floor(now/110)%6;}
   const width=64,height=48;
   g.save();g.fillStyle='rgba(25,50,12,.15)';g.beginPath();g.ellipse(p.x,p.y,8+p.height*.025,3,0,0,Math.PI*2);g.fill();g.restore();
   view.spritePlace('ambient-bird-'+i,frames[p.color*24+p.pose],p.x,p.y-p.height+5,width,height,p.facing,p.height>5?2000:p.y);
  });
 }
 root.MFBirds={draw,sample,routes,clearSpot,occupied,CYCLE_MS};
 if(typeof document==='undefined')return;
 const atlas=new Image();atlas.onload=()=>{
  for(let n=0;n<48;n++){
   const c=document.createElement('canvas');c.width=CELL_W;c.height=CELL_H;
   c.getContext('2d').drawImage(atlas,n%6*CELL_W,Math.floor(n/6)*CELL_H,CELL_W,CELL_H,0,0,CELL_W,CELL_H);
   frames[n]=c.toDataURL();
  }
  root.MFAdapter?.flush?.();
 };
 atlas.src=new URL('./assets/natureza/passaros.png',document.currentScript.src).href;
})(typeof window==='undefined'?globalThis:window);
