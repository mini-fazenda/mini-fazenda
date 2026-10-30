/* O jogo só é carregado pelo host depois do login e da leitura do save. */
(() => {
  'use strict';
  if (parent === window || !parent.MFOnline) {
    location.replace('./');
    return;
  }
  const host = parent.MFOnline;
  window.MFHost = host;
  // Todo o jogo passa a usar a hora do servidor (plantações, recompensas, pedidos).
  if (typeof host.clockOffset === 'function') {
    const realNow = Date.now.bind(Date);
    Date.now = () => realNow() + (Number(host.clockOffset()) || 0);
  }
  // Unifique o saldo usado pelas vendas antigas e pelo save da engine.
  Object.defineProperty(window,'moedas',{configurable:true,get:()=>moedas,set:value=>{if(Number.isFinite(value))moedas=value}});
  const clone = value => JSON.parse(JSON.stringify(value));
  const simple = obj => Object.fromEntries(Object.entries(obj).filter(([k,v]) =>
    !k.startsWith('_') && (v === null || ['string','number','boolean'].includes(typeof v))));
  function actionState(actor){
    const a=actor.acaoAtual;
    if(!a?.alvo)return null;
    return {...simple(a),alvo:{gx:a.alvo.gx,gy:a.alvo.gy},elapsed:a.startTime?Math.max(0,performance.now()-a.startTime):0};
  }
  let activeSeconds=0;
  setInterval(()=>{if(host.playing())activeSeconds++},1000); // XP só vem das ações do jogador
  function capture() {
    const data = window.MFAdapter.captureState();
    data.terrenos.forEach((t,i)=>{
      if(terrenos[i]?.animal)t.animal=clone(terrenos[i].animal);
      if(terrenos[i]?.cultura)t.cultura=clone(terrenos[i].cultura);
    });
    Object.assign(data, { version: 2, offsetX, offsetY, zoom,activeSeconds,character:window.__mfCharacter||null,
      player: {...data.player, x:player.x,y:player.y,facing:player.facing,path:clone(player.path),action:actionState(player)},
      aradora: {...data.aradora,x:aradora.x,y:aradora.y,facing:aradora.facing,
        path:clone(aradora.path || []),action:actionState(aradora),fila:clone((aradora.fila || []).map(t=>({gx:t.gx,gy:t.gy})))},
      truck: simple(caminhaoVendas),nextTruckAt:window.__mfTruckDue || 0,
      aradoraWelcomeShown:!!window.__aradoraWelcomeShown,
      missions:window.MFMissions.capture(),
      storedObjects:window.MFObjects?.capture() || [],
      fences:window.MFFences?.capture() || {},
      dailyRewards:clone(window.MFDaily?.capture() || {}),
      tutorial:window.MFTutorial?.capture() || null,
      actionQueue:filaAcoes.map(t=>({gx:t.gx,gy:t.gy})),
      loot: lootParticles.map(p=>simple(p))
    });
    return clone(data);
  }
  function restore(data) {
    if (!data) return;
    data={...data,terrenos:data.terrenos || [],inventory:data.inventory || {}};
    activeSeconds=data.activeSeconds || 0;
    window.MFMissions.restore(data.missions || {});
    window.MFDaily?.restore(data.dailyRewards || {});
    window.MFObjects?.restore(data.storedObjects || []);
    window.MFFences?.restore(data.fences || {});
    window.MFTutorial?.restore(data.tutorial, false);
    // Cancele callbacks de objetos antigos antes de trocar o mapa.
    terrenos.forEach(t=>{(t._timers || []).forEach(clearTimeout);clearInterval(t._milkInterval)});
    window.MFAdapter.applyState(data);
    terrenos.forEach((t,i)=>{
      const saved=data.terrenos?.[i];
      if(saved?.animal){
        Object.assign(t.animal,clone(saved.animal));
        window.MFSheepAnimation?.normalize(t);
        if(t.animal.tipo==='vaca' && t.animal.etapa===2)window.__VacaMilk?.startVacaMilkLoop(t);
      }
    });
    for(const k of ['COLS','ROWS']) if(Number.isFinite(data[k])) {
      if(k==='COLS') COLS=Math.max(20,data[k]); else ROWS=Math.max(20,data[k]);
    }
    if(Number.isFinite(data.offsetX)) offsetX=data.offsetX;
    if(Number.isFinite(data.offsetY)) offsetY=data.offsetY;
    if(Number.isFinite(data.zoom)) zoom=data.zoom;
    window.__farmName = data.farmName || '';
    window.__mfCharacter = data.character || null;
    window.__aradoraWelcomeShown=!!data.aradoraWelcomeShown;
    window.atualizarNomeFazenda?.();
    for(const [actor,saved] of [[player,data.player],[aradora,data.aradora]]){
      actor.acaoAtual=null; actor.path=[];
      if(!saved)continue;
      for(const k of ['x','y','facing'])if(Number.isFinite(saved[k]))actor[k]=saved[k];
      actor.path=clone(saved.path || []);
      if(saved.action){
        const target=terrenos.find(t=>t.gx===saved.action.alvo.gx&&t.gy===saved.action.alvo.gy);
        if(target)actor.acaoAtual={...saved.action,alvo:target,startTime:performance.now()-(saved.action.elapsed || 0)};
      }
    }
    aradora.fila=(data.aradora?.fila || []).map(p=>terrenos.find(t=>t.gx===p.gx&&t.gy===p.gy)).filter(Boolean);
    window.__mfRestoredActor=true;
    if(data.truck){
      window.__mfRestoredTruck=true;
      Object.assign(caminhaoVendas,data.truck);
      caminhaoVendas.currentSprite=caminhaoVendas.state==='stopped'?truckSpriteStopped:truckSpriteMoving;
      const img=ensureTruckDomImg();
      img.src=caminhaoVendas.state==='stopped'?(window.MFAdapter.project.truck.stoppedGif || TRUCK_STOPPED_SRC):(window.MFAdapter.project.truck.movingGif || TRUCK_MOVING_SRC);
      img.style.display=caminhaoVendas.spawned?'':'none';
      updateTruckDomPosition();
    }
    window.__mfTruckDue=data.nextTruckAt || 0;
    if(window.__mfTruckDue && !caminhaoVendas.spawned && !host.isVisiting()){
      setTimeout(()=>{window.__mfTruckDue=0;gerarPedidoCaminhao();initTruck();if(truckDomImg)truckDomImg.style.display=''},Math.max(0,window.__mfTruckDue-Date.now()));
    }
    window.truckOrder=clone(data.truckOrder || null);
    lootParticles.length=0;
    // Partículas de recompensa pendentes são restauradas com a mesma origem.
    (data.loot || []).forEach(p=>lootParticles.push({...p,img:preload(LOOT_SPRITES[p.tipo] || window.MFAdapter?.project?.items?.['item-'+p.tipo]?.lootIcon || '')}));
    filaAcoes=(data.actionQueue || []).map(p=>terrenos.find(t=>t.gx===p.gx&&t.gy===p.gy)).filter(Boolean);
    arando=player.acaoAtual?.state==='ararando';
    if(arando)player.currentSprite=spriteArando;
    atualizarBloqueioTerrasPorNivel();
    requestRedraw();
  }
  // Início de jogo (só para conta nova, sem save): 3 plantações prontas,
  // 1 plantação morta e 2 crescendo, perto do personagem.
  const STARTER_PLOTS=[
    {gx:4,gy:4,tipo:'cenoura',estado:'pronta'},
    {gx:6,gy:4,tipo:'morango',estado:'pronta'},
    {gx:8,gy:4,tipo:'milho',estado:'pronta'},
    {gx:4,gy:6,tipo:'morta',estado:'morta'},
    {gx:6,gy:6,tipo:'trigo',estado:'crescendo',progresso:0.6},
    {gx:8,gy:6,tipo:'abacaxi',estado:'crescendo',progresso:0.3}
  ];
  const DEAD_CROP_SRC='assets/plantacao-morta.png';
  function seedStarterFarm(){
    try{
      if(terrenos.some(t=>t&&t.cultura))return;
      const now=Date.now();
      for(const p of STARTER_PLOTS){
        if(p.gx+2>COLS||p.gy+2>ROWS||terrenos.some(t=>t.gx<p.gx+2&&p.gx<t.gx+(t.w||1)&&t.gy<p.gy+2&&p.gy<t.gy+(t.h||1)))continue;
        const t={gx:p.gx,gy:p.gy,w:2,h:2,itemId:'item-terra',visualScale:1,imgSrc:TERRA_ARADA_SRC};
        if(p.estado==='morta'){
          t.imgSrc=DEAD_CROP_SRC;preload(DEAD_CROP_SRC);
          t.cultura={tipo:'morta',etapa:2,startTime:now,totalTime:1};
        }else{
          const stages=CROP_STAGE_TABLE[p.tipo];if(!stages)continue;
          const total=Number(window.MFAdapter?.project?.items?.['item-'+p.tipo]?.growTime)||CROP_TIME_TABLE[p.tipo]||20000;
          const done=p.estado==='pronta'?1.01:(p.progresso||0.5);
          t.cultura={tipo:p.tipo,etapa:0,startTime:now-Math.round(total*done),totalTime:total};
          t.imgSrc=stages[0];
        }
        terrenos.push(t);
        if(p.estado!=='morta')startGrowthTimer(t);
      }
      requestRedraw();
      queueMicrotask(()=>host.changed('starter'));
    }catch(e){console.warn('[MF] início de jogo',e)}
  }
  for(const type of ['click','pointerup','keyup'])window.addEventListener(type,()=>queueMicrotask(()=>host.changed(type)));
  // O bootstrap original aplica o projeto em setTimeout(0).
  setTimeout(() => {
    try {
      restore(host.bootState());
      if(!host.bootState() && !host.isVisiting()) { seedStarterFarm(); window.MFTutorial?.start(); }
      setTimeout(()=>window.MFCharacter?.init?.(),0);
      document.documentElement.style.visibility='visible';
      host.attach({capture, pan:(dx,dy)=>{offsetX+=dx;offsetY+=dy;updateTruckDomPosition();requestRedraw()}});
      if(host.isVisiting()){
        const cover=document.createElement('div');
        cover.style.cssText='position:fixed;inset:0;z-index:2147483647;touch-action:none';
        let p;
        let start=null;
        cover.onpointerdown=e=>{p={x:e.clientX,y:e.clientY};start={x:e.clientX,y:e.clientY};cover.setPointerCapture(e.pointerId)};
        cover.onpointermove=e=>{if(p){offsetX+=e.clientX-p.x;offsetY+=e.clientY-p.y;p={x:e.clientX,y:e.clientY};updateTruckDomPosition();requestRedraw()}};
        // toque sem arrastar = fertilizar a plantação do amigo
        cover.onpointerup=e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<8)window.MFVisit?.tap(e.clientX,e.clientY);p=null;start=null};
        cover.onpointercancel=()=>{p=null;start=null};
        cover.id='mf-visit-cover';
        setTimeout(()=>window.MFVisit?.init(cover),0);
        cover.onwheel=e=>{e.preventDefault();zoom=Math.max(.15,Math.min(2,zoom*(e.deltaY>0?.95:1.05)));updateTruckDomPosition();requestRedraw()};
        document.body.append(cover);
        window.addEventListener('keydown',e=>{e.preventDefault();e.stopImmediatePropagation()},true);
      }
    }catch(e){host.fail(e)}
  }, 50);
})();

