/* Peso contínuo; os cinco desenhos representam faixas visuais. */
(function(root){
 const TIME=90*60000,PRICE=2000,MAX=120;
 const is=t=>t?.animal?.tipo==='porco';
 function state(t,now=Date.now()){if(!is(t))return null;const born=Number(t.animal.pigBornAt??t.animal.startTime);const ratio=Math.max(0,Math.min(1,(now-(Number.isFinite(born)?born:now))/TIME)),weight=20+100*ratio;const stage=weight>=120?120:weight>=100?100:weight>=70?70:weight>=40?40:20;return {weight,ratio,stage,coins:Math.min(5000,Math.floor(weight*5000/MAX)),remaining:Math.max(0,TIME*(1-ratio))};}
 function start(t,now=Date.now()){if(!is(t))return;t.animal.pigBornAt=now;t.animal.startTime=now;t.animal.totalTime=TIME;t.animal.etapa=2;sync(t,now);}
 function sync(t,now=Date.now()){const s=state(t,now);if(!s)return null;if(!Number.isFinite(t.animal.pigBornAt))t.animal.pigBornAt=Number(t.animal.startTime)||now;t.animal.etapa=2;t.imgSrc=`assets/porco-peso/${s.stage}.webp`;return s;}
 function sell(t,now=Date.now()){if(root.MFHost?.isVisiting?.()||!terrenos.includes(t))return false;const s=state(t,now);if(!s)return false;terrenos.splice(terrenos.indexOf(t),1);(t._timers||[]).forEach(clearTimeout);moedas+=s.coins;if(typeof moedasSpan!=='undefined'&&moedasSpan)moedasSpan.textContent=moedas;root.MFHost?.changed?.('pig-sale');requestRedraw();return s.coins;}
 root.MFPigWeight={TIME,PRICE,is,state,start,sync,sell};
})(globalThis);
