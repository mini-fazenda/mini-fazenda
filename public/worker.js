// Relógio de crescimento. O contador de atividade é controlado pelo host,
// para não conceder XP por tempo passado em uma visita ou sessão pausada.
let active=false;
self.onmessage=e=>{if(e.data?.type==='active')active=!!e.data.value};
setInterval(()=>{if(active)self.postMessage({type:'now',now:Date.now()})},1000);
