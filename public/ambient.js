/*
  Mini Fazenda · Ambientação em volta da fazenda
  Rio com cachoeira, ponte na estrada do caminhão, estrada de terra,
  montanhas, floresta, arbustos, pedras e flores.

  Cenário procedural com sprites PNG locais para o túnel e a cascata, em coordenadas
  de mundo, dentro do cache do fundo (MFAdapter.cache). Acompanha zoom,
  arrasto e expansão da fazenda (COLS/ROWS).

  Desligar: project.world.ambient = false
*/
(function () {
  'use strict';
  const HW = 48, HH = 24;               // metade de TILE_W / TILE_H
  const SPR = 2;                        // resolução dos sprites (2x)
  const iso = (gx, gy) => ({ x: (gx - gy) * HW, y: (gx + gy) * HH });

  // URLs relativas a este script: funciona no teste local e em subpastas do GitHub Pages.
  const assetBase = new URL('./assets/ambiente/', document.currentScript.src);
  const scenery = {};
  let sceneryRevision = 0;
  for (const [key, file] of [['fall', 'cascata.png'], ['tunnel', 'tunel.png']]) {
    const img = new Image();
    scenery[key] = img;
    img.onload = () => { sceneryRevision++; window.MFAdapter?.flush?.(); };
    img.onerror = () => console.warn('[MF] Não foi possível carregar', file);
    img.src = new URL(file, assetBase).href;
  }
  const ready = img => img?.complete && img.naturalWidth > 0;
  function fallAssetRect(L) {
    const f=fallGeom(L),h=Math.max(250,(f.bot-f.top)/.74),w=h*1156/1360;
    // A saída de água do PNG, não o centro da queda, encosta no começo do rio.
    return {x:L.fallTop.x-w*.23,y:L.fallTop.y-h*.92,w,h};
  }
  function tunnelAssetRect(L) {
    const t=iso(L.tunnelGx,L.roadGy),w=400,h=w*1024/1536;
    return {x:t.x-w*.535,y:t.y-h*.67,w,h};
  }
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- aleatório com semente (sempre o mesmo cenário) ----------
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const noise2 = (x, y) => Math.sin(x * 0.37 + Math.sin(y * 0.21) * 2.1) * 0.5 + Math.sin(y * 0.29 - x * 0.13 + 1.7) * 0.5;

  // ---------- sprites ----------
  function sprite(w, h, ax, ay, paint) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * SPR); c.height = Math.ceil(h * SPR);
    const g = c.getContext('2d'); g.scale(SPR, SPR); paint(g, w, h);
    return { c, w, h, ax, ay };
  }
  function blob(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
  function radial(g, x, y, r, c0, c1) { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; }

  // Copa alongada, com pontas de folhas e galhos aparentes, sem bolhas brilhantes.
  function leafyTree(seed,pal){
    const r=rng(seed),W=112,H=170;
    return sprite(W,H,W/2,H-6,g=>{
      const x=W/2,y=H-6;g.fillStyle='#806044';g.beginPath();g.moveTo(x-6,y);g.lineTo(x-3,53);g.lineTo(x+4,53);g.lineTo(x+7,y);g.fill();
      g.strokeStyle='#6c5036';g.lineWidth=4;for(const sign of [-1,1]){g.beginPath();g.moveTo(x,y-47);g.lineTo(x+sign*23,y-89);g.stroke();}
      const outline=(dx,dy)=>{g.beginPath();g.moveTo(x+dx,12+dy);g.bezierCurveTo(x-12+dx,27+dy,x-36+dx,32+dy,x-28+dx,48+dy);g.lineTo(x-43+dx,65+dy);g.lineTo(x-34+dx,72+dy);g.quadraticCurveTo(x-54+dx,94+dy,x-31+dx,105+dy);g.lineTo(x-36+dx,116+dy);g.quadraticCurveTo(x+dx,135+dy,x+36+dx,113+dy);g.lineTo(x+31+dx,102+dy);g.quadraticCurveTo(x+54+dx,88+dy,x+35+dx,69+dy);g.lineTo(x+44+dx,62+dy);g.quadraticCurveTo(x+31+dx,36+dy,x+22+dx,43+dy);g.quadraticCurveTo(x+20+dx,23+dy,x+dx,12+dy);g.closePath();};
      outline(0,3);g.fillStyle='#1f5438';g.fill();outline(-2,0);const gr=g.createLinearGradient(20,20,90,120);gr.addColorStop(0,'#5e9c4c');gr.addColorStop(.45,'#367d43');gr.addColorStop(1,'#245b39');g.fillStyle=gr;g.fill();
      g.strokeStyle='#78b35d';g.lineWidth=2;for(let n=0;n<13;n++){const xx=29+r()*45,yy=37+r()*65;g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+7,yy-4);g.stroke();}
    });
  }
  // pinheiro
  function pineTree(seed) {
    const r = rng(seed), W = 80, H = 165;
    return sprite(W, H, W / 2, H - 6, g => {
      const cx = W / 2, base = H - 6;
      g.fillStyle = '#5b3b20'; g.fillRect(cx - 5, base - 28, 10, 28);
      const layers = 4 + (r() * 2 | 0);
      for (let i = 0; i < layers; i++) {
        const t = i / layers, y0 = base - 22 - t * 112, hw = 34 - t * 22, hh = 40;
        const gr = g.createLinearGradient(cx - hw, 0, cx + hw, 0); gr.addColorStop(0, '#3f8a3a'); gr.addColorStop(0.55, '#2c6e2f'); gr.addColorStop(1, '#1d5224');
        g.fillStyle = gr; g.beginPath(); g.moveTo(cx, y0 - hh); g.quadraticCurveTo(cx - hw * 0.5, y0 - hh * 0.35, cx - hw, y0); g.quadraticCurveTo(cx, y0 + 7, cx + hw, y0); g.quadraticCurveTo(cx + hw * 0.5, y0 - hh * 0.35, cx, y0 - hh); g.fill();
        g.fillStyle = 'rgba(160,220,120,0.25)'; g.beginPath(); g.moveTo(cx, y0 - hh + 4); g.quadraticCurveTo(cx - hw * 0.45, y0 - hh * 0.35, cx - hw + 6, y0 - 2); g.lineTo(cx - 4, y0 - 6); g.fill();
      }
    });
  }
  // Coqueiro de tronco alto e folhas compridas, abertas e arqueadas.
  function palmTree(seed){
    const r=rng(seed),W=200,H=230,lean=(r()-.5)*28;
    return sprite(W,H,W/2,H-6,g=>{
      const cx=W/2,base=H-6,tx=cx+lean,ty=74;
      const trunk=g.createLinearGradient(cx-8,0,cx+8,0);trunk.addColorStop(0,'#947149');trunk.addColorStop(.45,'#d6b67b');trunk.addColorStop(1,'#a27c51');
      g.beginPath();g.moveTo(cx-10,base);g.quadraticCurveTo(cx+lean*.55,base-80,tx-5,ty);g.lineTo(tx+5,ty);g.quadraticCurveTo(cx+lean*.55+9,base-80,cx+10,base);g.closePath();g.fillStyle=trunk;g.fill();
      g.strokeStyle='#91704a';g.lineWidth=1.7;for(let n=1;n<12;n++){const t=n/12,x=cx+lean*t,y=base-(base-ty)*t;g.beginPath();g.moveTo(x-7+t*3,y);g.quadraticCurveTo(x,y+4,x+7-t*3,y-1);g.stroke();}
      const tips=[[-86,24],[-88,-15],[-52,-47],[-8,-66],[45,-54],[85,-21],[89,26],[41,55],[-37,54]];
      for(let n=0;n<tips.length;n++){const [dx,dy]=tips[n],ex=tx+dx,ey=ty+dy,mx=tx+dx*.55,my=ty+dy*.3-24;
        g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(mx-10,my-14,ex,ey);g.quadraticCurveTo(mx+12,my+16,tx,ty+4);g.closePath();g.fillStyle=['#236a3d','#32874a','#499b4b'][n%3];g.fill();
        g.strokeStyle=n%2?'#72b857':'#568e48';g.lineWidth=1.3;g.beginPath();g.moveTo(tx,ty+2);g.quadraticCurveTo(mx,my,ex,ey);g.stroke();
        for(let j=2;j<8;j++){const t=j/9,x=(1-t)*(1-t)*tx+2*(1-t)*t*mx+t*t*ex,y=(1-t)*(1-t)*ty+2*(1-t)*t*my+t*t*ey;g.beginPath();g.moveTo(x-3,y-3);g.lineTo(x+Math.sign(dx)*5,y+5);g.stroke();}
      }
      for(const [dx,dy]of [[-5,5],[3,8],[8,2]])blob(g,tx+dx,ty+dy,4.5,'#74613b');
    });
  }
  // Arbustos baixos e compactos, com folhas, sem esferas de plástico.
  function bush(seed,flower){
    const r=rng(seed),W=70,H=40;return sprite(W,H,W/2,H-5,g=>{
      g.fillStyle='#205334';g.beginPath();g.moveTo(4,32);g.lineTo(11,20);g.lineTo(18,22);g.lineTo(22,12);g.lineTo(32,16);g.lineTo(40,8);g.lineTo(45,15);g.lineTo(55,14);g.lineTo(59,23);g.lineTo(66,24);g.lineTo(65,33);g.quadraticCurveTo(34,41,4,32);g.fill();
      for(let n=0;n<22;n++){const x=13+r()*44,y=17+r()*13;g.beginPath();g.moveTo(x-4,y);g.quadraticCurveTo(x-2,y-8,x+6,y-5);g.quadraticCurveTo(x+5,y+2,x-4,y);g.fillStyle=n%3?'#357442':'#4d8b45';g.fill();}
      if(flower)for(let n=0;n<4;n++){const x=18+r()*35,y=16+r()*13;blob(g,x,y,2.3,flower);blob(g,x,y,1,'#ffeab1');}
    });
  }
  function rock(seed, big) {
    const r = rng(seed), W = big ? 70 : 38, H = big ? 50 : 28;
    return sprite(W, H, W / 2, H - 5, g => {
      const cx = W / 2, base = H - 5, rw = W * 0.42, rh = H * 0.62;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(cx + 3, base, rw, rh * 0.25, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(cx - rw, base); g.quadraticCurveTo(cx - rw * 0.9, base - rh * 0.9, cx - rw * 0.1, base - rh); g.quadraticCurveTo(cx + rw * 0.8, base - rh * (0.8 + r() * 0.2), cx + rw, base); g.closePath();
      const gr = g.createLinearGradient(cx - rw, base - rh, cx + rw, base); gr.addColorStop(0, '#c9c4b8'); gr.addColorStop(0.6, '#8f8a80'); gr.addColorStop(1, '#6a665e'); g.fillStyle = gr; g.fill();
      g.fillStyle = 'rgba(90,150,60,0.55)'; g.beginPath(); g.ellipse(cx - rw * 0.3, base - rh * 0.85, rw * 0.35, rh * 0.15, -0.2, 0, 7); g.fill();
    });
  }
  function tuft(seed) {
    const r = rng(seed), W = 26, H = 18;
    return sprite(W, H, W / 2, H - 2, g => {
      g.strokeStyle = r() < 0.5 ? '#3d8a2e' : '#4f9e35'; g.lineWidth = 1.6; g.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const x = 5 + r() * 16; g.beginPath(); g.moveTo(x, H - 2); g.quadraticCurveTo(x + (r() - 0.5) * 6, H - 9, x + (r() - 0.5) * 10, H - 10 - r() * 6); g.stroke(); }
    });
  }
  function flowers(seed) {
    const r = rng(seed), W = 30, H = 16, cols = ['#ffffff', '#ffd84a', '#ff8fb8', '#c69bff'];
    const col = cols[(r() * cols.length) | 0];
    return sprite(W, H, W / 2, H - 2, g => { for (let i = 0; i < 5; i++) { const x = 4 + r() * 22, y = 4 + r() * 9; g.strokeStyle = '#3c8a2c'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x, H - 2); g.stroke(); blob(g, x, y, 2.4, col); blob(g, x, y, 0.9, '#ffe27a'); } });
  }

  let SPRITES = null;
  function buildSprites() {
    const pals = [
      ['#1f5a23', '#2f7d2c', '#6cc24a', '#93dc66'],
      ['#245e1e', '#3b8a2a', '#86d04f', '#b2ea7a'],
      ['#1b4f2c', '#2a6f3c', '#5fb35a', '#8fd27c'],
      ['#2d5a1a', '#4a8b26', '#9ad04a', '#c4ea7a', '#ff9cc6'], // florida (rosa)
      ['#2a5a1a', '#4a8b26', '#9ad04a', '#c4ea7a', '#ffffff'], // florida (branca)
    ];
    SPRITES = {
      leafy: Array.from({ length: 6 }, (_, i) => leafyTree(101 + i * 7, pals[i % 3])),
      blossom: [leafyTree(301, pals[3]), leafyTree(317, pals[4])],
      pine: Array.from({ length: 3 }, (_, i) => pineTree(401 + i * 13)),
      palm: Array.from({ length: 3 }, (_, i) => palmTree(501 + i * 11)),
      bush: [bush(601, null), bush(613, null), bush(627, '#ff7fae'), bush(641, '#ffffff'), bush(653, '#ffd84a')],
      rock: [rock(701, true), rock(709, false), rock(717, false)],
      tuft: Array.from({ length: 4 }, (_, i) => tuft(801 + i)),
      flower: Array.from({ length: 6 }, (_, i) => flowers(901 + i * 3)),
    };
    // Atlas local recortado da folha enviada; o procedural continua como fallback.
    const art=window.MFNatureAssets;
    const use=(kind,names,height)=>{const list=names.map(name=>art?.sprite(name,height));if(list.every(Boolean))SPRITES[kind]=list;};
    use('leafy',['oak','dark','apple','orange','gold','oak'],170);
    use('blossom',['apple','orange'],170);
    use('pine',['pine','pine','pine'],180);
    use('palm',['palm','palms','palm'],220);
    use('bush',['bush','bushLight','bushFlowers','bushFlowers','bush'],43);
    use('rock',['rockFlowers','rock','rock'],42);
    use('tuft',['tuft','tuft','tuft','tuft'],19);
    use('flower',['flower','flowerPink','flower','flowerPink','flower','flowerPink'],19);
  }

  // ---------- layout do cenário ----------
  let LAYOUT = null, LAYOUT_SIG = '';
  function farmInfo() {
    const p = window.MFAdapter?.project || {};
    const truck = p.truck || {};
    const roadGy = (Number.isFinite(+truck.stopY) ? +truck.stopY : (Number.isFinite(+truck.laneGy) ? +truck.laneGy : 5)) + 1;
    const truckFar = Math.min(Number.isFinite(+truck.stopX) ? +truck.stopX : -10, Number.isFinite(+truck.startX) ? +truck.startX : -4) + 1;
    return { cols: COLS, rows: ROWS, roadGy, truckFar };
  }

  function build(info) {
    const { cols, rows, roadGy, truckFar } = info;
    let R = rng(7); // sementes fixas: expandir não embaralha o cenário
    // rio: corre do pé da montanha (alto) para baixo-esquerda, depois do ponto onde o caminhão para
    const riverBase = Math.min(-11.5, truckFar - 3.8);
    const riverC = gy => riverBase - 0.9 * Math.sin(gy * 0.33) - 0.35 * Math.sin(gy * 0.9 + 1);
    const RIVER_W = 1.25, BANK_W = 1.75;
    const gyEnd = rows + 26;
    // montanha: linha da base em coordenada de tela (acima da borda de cima)
    const mountBase = x => {
      const edge = x >= 0 ? -HH + x / 2 : -HH - x / 2;       // bordas de cima do losango
      return Math.min(edge - 250, -300 + Math.sin(x * 0.004) * 30) + Math.sin(x * 0.011) * 14;
    };
    let gyTop = -30; // o rio nasce no pé da montanha
    while (gyTop < 0) { const p = iso(riverC(gyTop), gyTop); if (p.y > mountBase(p.x) - 6) break; gyTop += 0.25; }
    const fallTop = iso(riverC(gyTop), gyTop);   // onde o rio nasce (cachoeira)
    const mtnX0 = -9000, mtnX1 = 9000;

    // polígonos de água/margem
    function bandPoly(halfW) {
      const L = [], Rr = [];
      for (let gy = gyTop; gy <= gyEnd; gy += 0.25) { const c = riverC(gy); const taper=Math.min(1,Math.max(0,(gy-gyTop)/2.4)); L.push(iso(c - halfW*taper, gy)); Rr.push(iso(c + halfW*taper, gy)); }
      const p = new Path2D(); p.moveTo(L[0].x, L[0].y); for (const q of L) p.lineTo(q.x, q.y); for (let i = Rr.length - 1; i >= 0; i--) p.lineTo(Rr[i].x, Rr[i].y); p.closePath(); return p;
    }
    const bank = bandPoly(BANK_W), water = bandPoly(RIVER_W), deep = bandPoly(RIVER_W * 0.45);
    R = rng(11);
    const ripples = [];
    for (let gy = gyTop + 1; gy < gyEnd; gy += 0.9 + R() * 0.8) { const c = riverC(gy) + (R() - 0.5) * RIVER_W * 1.2; ripples.push({ ...iso(c, gy), w: 10 + R() * 16 }); }

    // estrada de terra: atravessa a ponte e entra num túnel no pé da montanha
    let tunnelGx = riverC(roadGy) - BANK_W - 3;
    while (tunnelGx > -80) { const p = iso(tunnelGx, roadGy); if (p.y < mountBase(p.x) + 26) break; tunnelGx -= 0.25; }
    const roadEnd = tunnelGx;
    const road = new Path2D(), roadEdge = new Path2D();
    const roadPts = (off) => { const pts = []; const end = roadEnd; for (let gx = 0.2; gx >= end; gx -= 0.5) { const taper = 1; pts.push(iso(gx, roadGy + (off * (0.35 + 0.65 * taper)) + Math.sin(gx * 1.7) * 0.04)); } return pts; };
    const A = roadPts(-0.62), B = roadPts(0.62);
    road.moveTo(A[0].x, A[0].y); for (const q of A) road.lineTo(q.x, q.y); for (let i = B.length - 1; i >= 0; i--) road.lineTo(B[i].x, B[i].y); road.closePath();
    const A2 = roadPts(-0.78), B2 = roadPts(0.78);
    roadEdge.moveTo(A2[0].x, A2[0].y); for (const q of A2) roadEdge.lineTo(q.x, q.y); for (let i = B2.length - 1; i >= 0; i--) roadEdge.lineTo(B2[i].x, B2[i].y); roadEdge.closePath();
    R = rng(13);
    const pebbles = []; for (let gx = -0.5; gx > roadEnd + 1; gx -= 0.35) if (R() < 0.6) pebbles.push({ ...iso(gx, roadGy + (R() - 0.5) * 1.0), r: 1.2 + R() * 1.6 });
    const bridgeC = riverC(roadGy);

    R = rng(17);
    // montanhas: duas camadas de serra contínua atrás da fazenda
    const ridge = (x, layer) => {
      const k = layer ? 1 : 0.8;
      const big = Math.exp(-Math.pow((x - 420) / 520, 2)) * (layer ? 230 : 120); // morro principal
      return mountBase(x) - big - (layer ? 120 : 260) * k
        - Math.abs(Math.sin(x * 0.0042 + layer * 2.1)) * 190 * k
        - Math.abs(Math.sin(x * 0.0113 + 0.7 + layer)) * 70 * k
        - Math.sin(x * 0.031 + layer * 3) * 12 - (R() - 0.5) * 6;
    };
    const mountains = [0, 1].map(layer => {
      const pts = []; for (let x = mtnX0; x <= mtnX1; x += 22) pts.push({ x, y: ridge(x, layer) });
      return { layer, pts };
    });
    const cliffs = []; for (let x = mtnX0; x < mtnX1; x += 70 + R() * 90) cliffs.push({ x, len: 30 + R() * 70, off: R() });
    const foothill = [];
    for (let x = mtnX0; x <= mtnX1; x += 40) foothill.push({ x, y: mountBase(x) - 22 - Math.abs(Math.sin(x * 0.02)) * 26 });
    // ocupação: o que pode ter árvore
    const inFarm = (gx, gy, m) => gx > -m && gx < cols + m && gy > -m && gy < rows + m;
    const nearRiver = (gx, gy, m) => gy > gyTop - 1 && Math.abs(gx - riverC(gy)) < BANK_W + m;
    const nearRoad = (gx, gy, m) => gx < 1 && gx > roadEnd - m && Math.abs(gy - roadGy) < 0.8 + m;
    const inLabelBand = (gx, gy) => (gx > -6 && gx < 0 && gy > -1 && gy < rows + 1) || (gx > cols && gx < cols + 5.5 && gy > -1 && gy < rows + 1);
    const nearTunnel = (gx, gy, m) => Math.hypot(gx - tunnelGx, gy - roadGy) < 3 + m;
    const okTall = (gx, gy) => {
      if (nearTunnel(gx, gy, 0.5)) return false;
      if (inFarm(gx, gy, 1.2)) return false;
      if (nearRiver(gx, gy, 0.5) || nearRoad(gx, gy, 0.5) || inLabelBand(gx, gy)) return false;
      // copas não podem invadir o losango da fazenda (bordas de baixo)
      if (gy > rows && gx > -1 && gx < cols + 4 && gy < rows + 3.2) return false;
      if (gx > cols && gy > -1 && gy < rows + 4 && gx < cols + 3.2) return false;
      const p = iso(gx, gy); if (p.y < mountBase(p.x) + 40) return false;
      return true;
    };
    const okLow = (gx, gy) => !nearTunnel(gx, gy, 0) && !inFarm(gx, gy, 0.4) && !nearRiver(gx, gy, 0.1) && !nearRoad(gx, gy, 0.05) && iso(gx, gy).y > mountBase(iso(gx, gy).x) + 10;

    const sceneryLayout = { fallTop, mountains, tunnelGx, roadGy };
    const clearAreas = [fallAssetRect(sceneryLayout), tunnelAssetRect(sceneryLayout)]
      .map(r => ({ x: r.x - 18, y: r.y - 12, w: r.w + 36, h: r.h + 30 }));
    function clearProp(it) {
      const s = it.s, k = it.k;
      const bounds = { x: it.x - s.ax * k, y: it.y - s.ay * k, w: s.w * k, h: s.h * k };
      if (clearAreas.some(r => overlaps(bounds, r))) return false;
      // Check the full visual footprint against road, bridge and river.
      for (let x = bounds.x; x <= bounds.x + bounds.w; x += 18) {
        for (let y = bounds.y; y <= bounds.y + bounds.h; y += 18) {
          const gx = (x / HW + y / HH) / 2, gy = (y / HH - x / HW) / 2;
          if (inFarm(gx,gy,.15) || nearRiver(gx, gy, 0.2) || nearRoad(gx, gy, 0.25)) return false;
        }
      }
      return true;
    }
    const props = [], low = [];
    const ST = 2.3, I0 = Math.floor(-(rows + 28) / ST), I1 = Math.ceil((cols + 26) / ST), J0 = Math.floor(-26 / ST), J1 = Math.ceil((rows + 26) / ST);
    for (let j = J0; j < J1; j++) for (let i = I0; i < I1; i++) {
      R = rng(((i * 73856093) ^ (j * 19349663) ^ 0x5bd1e995) >>> 0); // cada célula tem a sua semente
      const gx = i * ST, gy = j * ST, jx = gx + R() * 0.9, jy = gy + R() * 0.9;
      const n = noise2(jx, jy); // clareiras e bosques
      const dist = Math.max(-jx, -jy, jx - cols, jy - rows);  // distância da fazenda
      const density = (dist < 3 ? 0.02 : dist < 6 ? 0.10 : dist < 10 ? 0.15 : 0.20) * (1 + n * 0.35);
      if (okTall(jx, jy) && R() < density) {
        const p = iso(jx, jy), roll = R();
        let kind;
        if (roll < 0.43) kind = 'palm';
        else if (roll < 0.72) kind = 'pine';
        else kind = 'leafy';
        const list = SPRITES[kind];
        props.push({ kind, s: list[(R() * list.length) | 0], x: p.x, y: p.y, k: kind === 'palm' ? 1.12 + R() * 0.20 : 0.95 + R() * 0.30, flip: R() < 0.5, shadow: true });
      } else if (okLow(jx, jy) && R() < 0.20) {
        const p = iso(jx, jy), roll = R();
        if (roll < 0.28 && !inLabelBand(jx, jy)) props.push({ s: SPRITES.bush[(R() * 5) | 0], x: p.x, y: p.y, k: 0.85 + R() * 0.5, flip: R() < 0.5, shadow: true });
        else if (roll < 0.36) props.push({ s: SPRITES.rock[(R() * 3) | 0], x: p.x, y: p.y, k: 0.7 + R() * 0.5, flip: R() < 0.5 });
        else if (roll < 0.6) low.push({ s: SPRITES.flower[(R() * 6) | 0], x: p.x, y: p.y, k: 1, flip: false });
        else low.push({ s: SPRITES.tuft[(R() * 4) | 0], x: p.x, y: p.y, k: 1 + R() * 0.4, flip: R() < 0.5 });
      }
    }
    // Pequenos grupos de arbustos nas laterais, separados por clareiras.
    for(const [gx,gy]of [[-4,rows*.25],[-3.5,rows*.75],[cols+4,rows*.35],[cols+4.5,rows*.82],[cols*.4,rows+4.4]]){if(!okLow(gx,gy))continue;const p=iso(gx,gy);for(const [dx,dy,k]of [[0,0,1.1],[25,8,.75]])props.push({kind:'bush',s:SPRITES.bush[0],x:p.x+dx,y:p.y+dy,k,shadow:true});}
    // Coqueiros maiores no primeiro plano, longe dos canteiros.
    for(const [gx,gy,k]of [[cols*.15,rows+8.7,1.25],[cols*.56,rows+9.4,1.5],[cols+8.6,rows*.2,1.25],[cols+9.2,rows*.65,1.5],[cols+7,rows+7,1.65]]){const p=iso(gx,gy);props.push({kind:'palm',s:SPRITES.palm[(Math.floor(gx+gy)%3)],x:p.x,y:p.y,k,flip:gx>cols,shadow:true});}
    // coqueiros perto da ponte
    R = rng(23);
    for (const [dx, dy] of [[-2.4, -1.6], [2.4, 1.9], [-2.6, 2.2]]) { const gx = bridgeC + dx, gy = roadGy + dy; if (!inFarm(gx, gy, 1) && !nearRoad(gx, gy, 0.2)) { const p = iso(gx, gy); props.push({ s: SPRITES.palm[(R() * 3) | 0], x: p.x, y: p.y, k: 1, flip: R() < 0.5, shadow: true }); } }
    // Aplica a mesma exclusão também aos coqueiros fixos e arbustos das margens.
    for (let i = props.length - 1; i >= 0; i--) if (!clearProp(props[i])) props.splice(i, 1);
    // Pedras nas duas margens: entram depois da exclusão das copas, pois pertencem à beira d'água.
    R=rng(19);for(let gy=gyTop+2.8;gy<gyEnd;gy+=.8+R()*.35){if(Math.abs(gy-roadGy)<1.35)continue;for(const side of [-1,1]){if(R()<.12)continue;const p=iso(riverC(gy)+side*(BANK_W-.12),gy);const it={kind:'bankRock',s:SPRITES.rock[1+(R()<.5?0:1)],x:p.x,y:p.y,k:.55+R()*.3,flip:side<0};const bounds={x:p.x-it.s.ax*it.k,y:p.y-it.s.ay*it.k,w:it.s.w*it.k,h:it.s.h*it.k};if(!clearAreas.some(r=>overlaps(bounds,r)))props.push(it);}}
    props.sort((a, b) => a.y - b.y);
    low.sort((a, b) => a.y - b.y);

    return { tunnelGx, gyEnd, riverC, RIVER_W, BANK_W, gyTop, bank, water, deep, ripples, road, roadEdge, pebbles, roadGy, bridgeC, mountains, cliffs, foothill, fallTop, props, low, mountBase, mtnX0, mtnX1 };
  }

  // ---------- desenho ----------
  function drawSprite(b, it, view) {
    const s = it.s, w = s.w * it.k, h = s.h * it.k, x = it.x - s.ax * it.k, y = it.y - s.ay * it.k;
    if (x > view.r || x + w < view.l || y > view.b || y + h < view.t) return;
    if (it.flip) { b.save(); b.translate(it.x, 0); b.scale(-1, 1); b.drawImage(s.c, -s.ax * it.k, y, w, h); b.restore(); }
    else b.drawImage(s.c, x, y, w, h);
  }

  function drawMountains(b, L, view) {
    for (const m of L.mountains) {
      const pts = m.pts, front = m.layer === 1;
      b.beginPath(); for (let i = 0; i < pts.length; i++) i ? b.lineTo(pts[i].x, pts[i].y) : b.moveTo(pts[i].x, pts[i].y); for (let i = pts.length - 1; i >= 0; i--) b.lineTo(pts[i].x, L.mountBase(pts[i].x) + 12); b.closePath();
      const gr = b.createLinearGradient(0, -1100, 0, -150);
      if (front) { gr.addColorStop(0, '#bb9267'); gr.addColorStop(0.5, '#a1764e'); gr.addColorStop(1, '#815e40'); }
      else { gr.addColorStop(0, '#8fae86'); gr.addColorStop(1, '#6f9364'); }
      b.fillStyle = gr; b.fill();
      // grama no topo da serra
      b.save(); b.clip();
      b.beginPath(); b.moveTo(pts[0].x, pts[0].y); for (const q of pts) b.lineTo(q.x, q.y); for (let i = pts.length - 1; i >= 0; i--) b.lineTo(pts[i].x, pts[i].y + (front ? 22 : 14) + Math.sin(pts[i].x * 0.05) * 6);
      b.closePath(); b.fillStyle = front ? '#5d9a3a' : '#7da86a'; b.fill();
      if (front) {
        // paredões de pedra
        for (const c of L.cliffs) {
          if (c.x < view.l - 40 || c.x > view.r + 40) continue;
          const i = Math.max(0, Math.min(pts.length - 1, Math.round((c.x - pts[0].x) / 22))), y0 = pts[i].y + 26;
          b.fillStyle = c.off < 0.6 ? 'rgba(60,38,22,0.28)' : 'rgba(255,225,180,0.18)';
          b.beginPath(); b.moveTo(c.x - 7, y0); b.lineTo(c.x + 7, y0); b.lineTo(c.x + (c.off - 0.5) * 16, y0 + c.len); b.closePath(); b.fill();
        }
        // faixas horizontais (camadas de rocha)
        b.strokeStyle = 'rgba(70,45,25,0.25)'; b.lineWidth = 2;
        for (let k = 1; k < 3; k++) { b.beginPath(); for (let i = 0; i < pts.length; i++) { const q = pts[i], y = q.y + 30 + k * 38 + Math.sin(q.x * 0.013 + k) * 8; i ? b.lineTo(q.x, y) : b.moveTo(q.x, y); } b.stroke(); }
      }
      b.restore();
    }
    // mata no pé da montanha
    const f = L.foothill, mb = L.mountBase;
    b.beginPath(); b.moveTo(f[0].x, mb(f[0].x) + 14);
    for (const q of f) b.lineTo(q.x, q.y);
    for (let i = f.length - 1; i >= 0; i--) b.lineTo(f[i].x, mb(f[i].x) + 14);
    b.closePath(); b.fillStyle = '#2f7329'; b.fill();
    // Uma faixa baixa e irregular substitui a fileira de círculos verdes.
    b.fillStyle='#3c7040';b.beginPath();for(let i=0;i<f.length;i++){const q=f[i];if(i===0)b.moveTo(q.x,mb(q.x)+12);b.lineTo(q.x,mb(q.x)-5-(i%3)*5);}for(let i=f.length-1;i>=0;i--)b.lineTo(f[i].x,mb(f[i].x)+12);b.closePath();b.fill();
  }

  function fallGeom(L) {
    const t = L.fallTop, fp = L.mountains[1].pts, fi = Math.max(0, Math.min(fp.length - 1, Math.round((t.x - fp[0].x) / 22)));
    return { x: t.x, top: fp[fi].y + 16, bot: t.y + 6, wTop: 46, wBot: 78 };
  }
  function drawWaterfall(b, L) {
    if (ready(scenery.fall)) {
      const r = fallAssetRect(L);
      b.drawImage(scenery.fall, r.x, r.y, r.w, r.h);
      return;
    }
    const g = fallGeom(L); if (g.bot - g.top < 20) return;
    const { x, top, bot, wTop, wBot } = g;
    // água
    const body = new Path2D(); body.moveTo(x - wTop / 2, top); body.quadraticCurveTo(x, top - 8, x + wTop / 2, top);
    body.quadraticCurveTo(x + wTop / 2 + 6, (top + bot) / 2, x + wBot / 2, bot); body.lineTo(x - wBot / 2, bot); body.quadraticCurveTo(x - wTop / 2 - 6, (top + bot) / 2, x - wTop / 2, top); body.closePath();
    const gr = b.createLinearGradient(x - wBot / 2, 0, x + wBot / 2, 0); gr.addColorStop(0, '#4fb0e6'); gr.addColorStop(0.35, '#bfe9ff'); gr.addColorStop(0.55, '#e9f9ff'); gr.addColorStop(1, '#3f9fd8');
    b.fillStyle = gr; b.fill(body);
    // pedras nas beiradas e no topo
    const rocks = [[-wTop / 2 - 10, top + 4, 15], [wTop / 2 + 9, top + 2, 13], [-wBot / 2 - 8, bot - 18, 14], [wBot / 2 + 10, bot - 22, 16], [-wTop / 2 - 14, (top + bot) / 2, 11], [wTop / 2 + 14, (top + bot) / 2 + 6, 12]];
    for (const [dx, y, r] of rocks) { blob(b, x + dx, y + 3, r, '#5f554b'); blob(b, x + dx - 2, y, r * 0.92, radial(b, x + dx - 2, y, r, '#b8afa3', '#7d7368')); }
    b.fillStyle = 'rgba(255,255,255,0.85)'; b.beginPath(); b.ellipse(x, top + 1, wTop / 2, 4, 0, 0, 7); b.fill();
    // poço embaixo
    b.fillStyle = '#3aa3dc'; b.beginPath(); b.ellipse(x, bot + 4, wBot * 0.75, 16, 0, 0, 7); b.fill();
    b.fillStyle = 'rgba(255,255,255,0.35)'; b.beginPath(); b.ellipse(x, bot + 2, wBot * 0.55, 9, 0, 0, 7); b.fill();
  }

  // Túnel no fim da estrada (o caminhão entra e sai por aqui)
  function drawTunnel(b, L) {
    if (ready(scenery.tunnel)) {
      const r = tunnelAssetRect(L);
      const t=iso(L.tunnelGx,L.roadGy);b.save();b.translate(t.x,t.y);b.transform(1,.08,0,1,0,0);
      // Recorte de composição elimina o halo da imagem fora do morro e da estrada.
      b.beginPath();const contour=[[.07,.65],[.14,.46],[.27,.26],[.46,.17],[.64,.04],[.73,.14],[.86,.37],[.93,.63],[.88,.70],[.72,.74],[.91,.86],[.92,.92],[.84,.96],[.54,.84],[.35,.82],[.13,.82]];for(let i=0;i<contour.length;i++){const [x,y]=contour[i];i?b.lineTo((x-.535)*r.w,(y-.67)*r.h):b.moveTo((x-.535)*r.w,(y-.67)*r.h);}b.closePath();b.clip();
      b.drawImage(scenery.tunnel,-r.w*.535,-r.h*.67,r.w,r.h);b.restore();
      return;
    }
    const T = iso(L.tunnelGx, L.roadGy);
    const P = (u, v) => [T.x - HW * u, T.y + HH * u - v]; // u: tiles no sentido da largura da estrada, v: altura em px
    const path = cmds => { const p = new Path2D(); for (const [op, ...a] of cmds) { const pts = []; for (let k = 0; k < a.length; k += 2) pts.push(...P(a[k], a[k + 1])); p[op](...pts); } return p; };
    const arch = (w, h, top) => path([['moveTo', -w, 0], ['lineTo', -w, h], ['bezierCurveTo', -w, top, w, top, w, h], ['lineTo', w, 0], ['closePath']]);
    // morro de pedra em volta da entrada
    const hill = path([['moveTo', -2.7, -8], ['bezierCurveTo', -2.8, 95, -1.2, 156, 0.2, 158], ['bezierCurveTo', 1.6, 156, 2.9, 100, 2.7, -8], ['closePath']]);
    const hg = b.createLinearGradient(0, T.y - 150, 0, T.y); hg.addColorStop(0, '#6b5642'); hg.addColorStop(1, '#8e7558'); b.fillStyle = hg; b.fill(hill);
    b.fillStyle = '#5d9a3a'; b.fill(path([['moveTo', -1.7, 128], ['bezierCurveTo', -0.9, 162, 1.1, 164, 1.9, 126], ['bezierCurveTo', 0.8, 144, -0.6, 142, -1.7, 128], ['closePath']]));
    // moldura de pedra
    const outer = arch(1.4, 60, 122), inner = arch(1.0, 48, 100);
    const sg = b.createLinearGradient(0, T.y - 110, 0, T.y); sg.addColorStop(0, '#8d8a84'); sg.addColorStop(1, '#c2beb5'); b.fillStyle = sg; b.fill(outer);
    b.strokeStyle = 'rgba(60,55,50,0.55)'; b.lineWidth = 2;
    for (let k = 0; k <= 8; k++) { const a = Math.PI * (k / 8), c = Math.cos(a), sn = Math.sin(a); const [x1, y1] = P(-c * 1.0, 48 + sn * 45), [x2, y2] = P(-c * 1.4, 60 + sn * 54); b.beginPath(); b.moveTo(x1, y1); b.lineTo(x2, y2); b.stroke(); }
    for (const v of [14, 30, 46]) for (const side of [-1, 1]) { const [x1, y1] = P(side * 1.0, v), [x2, y2] = P(side * 1.4, v); b.beginPath(); b.moveTo(x1, y1); b.lineTo(x2, y2); b.stroke(); }
    b.lineWidth = 3; b.strokeStyle = '#5f5a52'; b.stroke(outer);
    // boca escura
    const dg = b.createLinearGradient(0, T.y - 96, 0, T.y); dg.addColorStop(0, '#0b0908'); dg.addColorStop(1, '#2a1e14'); b.fillStyle = dg; b.fill(inner);
  }

  function drawRiver(b, L, view) {
    b.fillStyle = '#c8ad74'; b.fill(L.bank);
    b.save(); b.clip(L.bank); b.strokeStyle = 'rgba(120,90,50,0.35)'; b.lineWidth = 10; b.stroke(L.water); b.restore();
    const gw = b.createLinearGradient(-400, -400, 400, 400); gw.addColorStop(0, '#35b9e9'); gw.addColorStop(1, '#319ed5'); b.fillStyle = gw; b.fill(L.water);
    b.fillStyle = 'rgba(25,100,170,0.35)'; b.fill(L.deep);
    b.strokeStyle = 'rgba(255,255,255,0.55)'; b.lineWidth = 2; b.lineCap = 'round';
    for (const r of L.ripples) { if (r.x < view.l || r.x > view.r || r.y < view.t || r.y > view.b) continue; b.beginPath(); b.moveTo(r.x - r.w / 2, r.y); b.quadraticCurveTo(r.x, r.y - 3, r.x + r.w / 2, r.y); b.stroke(); }
  }

  function drawRoad(b, L) {
    b.fillStyle = 'rgba(110,80,40,0.35)'; b.fill(L.roadEdge);
    const gr = b.createLinearGradient(0, -300, 0, 300); gr.addColorStop(0, '#d9b47c'); gr.addColorStop(1, '#c49a62'); b.fillStyle = gr; b.fill(L.road);
    b.fillStyle = 'rgba(120,85,45,0.45)'; for (const p of L.pebbles) { b.beginPath(); b.ellipse(p.x, p.y, p.r * 1.6, p.r, 0, 0, 7); b.fill(); }
  }

  // Ponte em arco: as pontas encostam na estrada, o meio sobe sobre o rio.
  function bridgeSpan(L) {
    const c = L.bridgeC, gxa = c + L.BANK_W + 0.9, gxb = c - L.BANK_W - 0.9;
    return { gxa, gxb, gy0: L.roadGy - 0.68, gy1: L.roadGy + 0.68, H: 24 };
  }
  function bridgeLiftAt(L, gx) {
    const S = bridgeSpan(L); if (gx > S.gxa || gx < S.gxb) return 0;
    const t = (S.gxa - gx) / (S.gxa - S.gxb); return S.H * Math.pow(Math.sin(Math.PI * t), 0.75);
  }
  function drawBridge(b, L) {
    const S = bridgeSpan(L), { gxa, gxb, gy0, gy1 } = S, lift = gx => bridgeLiftAt(L, gx);
    const P = (gx, gy, up = 0) => { const p = iso(gx, gy); return { x: p.x, y: p.y - up }; };
    const N = 22, xs = []; for (let k = 0; k <= N; k++) xs.push(gxa + (gxb - gxa) * k / N);
    const line = (gy, off) => { b.beginPath(); xs.forEach((gx, k) => { const q = P(gx, gy, lift(gx) + off); k ? b.lineTo(q.x, q.y) : b.moveTo(q.x, q.y); }); };
    // sombra na água
    b.fillStyle = 'rgba(0,40,70,0.25)'; b.beginPath();
    let q = P(gxa - 0.8, gy0 + 0.35); b.moveTo(q.x, q.y); q = P(gxb + 0.8, gy0 + 0.35); b.lineTo(q.x, q.y); q = P(gxb + 0.8, gy1 + 0.55); b.lineTo(q.x, q.y); q = P(gxa - 0.8, gy1 + 0.55); b.lineTo(q.x, q.y); b.fill();
    // cabeceiras de pedra nas duas margens
    for (const gx of [gxa - 0.35, gxb + 0.35]) for (const gy of [gy0 - 0.05, gy1 + 0.05]) {
      const p = P(gx, gy); blob(b, p.x, p.y + 2, 9, '#6f655b'); blob(b, p.x - 1, p.y, 8, radial(b, p.x - 1, p.y, 8, '#c8c0b4', '#8a8076'));
    }
    // corrimão de trás
    const rail = (gy, front) => {
      b.lineCap = 'round';
      const posts = 7; for (let k = 0; k <= posts; k++) { const gx = gxa + (gxb - gxa) * k / posts, a = P(gx, gy, lift(gx)), t = P(gx, gy, lift(gx) + 22);
        b.strokeStyle = '#4e2f16'; b.lineWidth = 5; b.beginPath(); b.moveTo(a.x, a.y); b.lineTo(t.x, t.y); b.stroke();
        b.strokeStyle = '#8a5a2e'; b.lineWidth = 2.5; b.beginPath(); b.moveTo(a.x - 1, a.y); b.lineTo(t.x - 1, t.y + 1); b.stroke(); }
      b.strokeStyle = '#5a361a'; b.lineWidth = 6; line(gy, 21); b.stroke();
      b.strokeStyle = front ? '#a56d38' : '#8a5a2e'; b.lineWidth = 3.5; line(gy, 21); b.stroke();
      b.strokeStyle = '#7a4c25'; b.lineWidth = 3; line(gy, 11); b.stroke();
    };
    rail(gy0, false);
    // viga de baixo (arco) do lado da frente
    b.fillStyle = '#5c3a1d'; b.beginPath();
    xs.forEach((gx, k) => { const p = P(gx, gy1, lift(gx)); k ? b.lineTo(p.x, p.y) : b.moveTo(p.x, p.y); });
    for (let k = N; k >= 0; k--) { const gx = xs[k], p = P(gx, gy1, Math.max(0, lift(gx) - 9)); b.lineTo(p.x, p.y); }
    b.closePath(); b.fill();
    b.strokeStyle = '#3f2611'; b.lineWidth = 4; b.beginPath();
    xs.forEach((gx, k) => { const p = P(gx, gy1, Math.max(0, lift(gx) * 0.55 - 6)); k ? b.lineTo(p.x, p.y) : b.moveTo(p.x, p.y); }); b.stroke();
    // tábuas acompanhando o arco
    const step = 0.26; let i = 0;
    for (let gx = gxa; gx > gxb + 0.01; gx -= step, i++) {
      const g2 = Math.max(gxb, gx - step + 0.035), u1 = lift(gx), u2 = lift(g2);
      b.fillStyle = i % 3 === 0 ? '#b07a45' : i % 3 === 1 ? '#c08850' : '#a9723f';
      b.beginPath(); q = P(gx, gy0, u1); b.moveTo(q.x, q.y); q = P(g2, gy0, u2); b.lineTo(q.x, q.y); q = P(g2, gy1, u2); b.lineTo(q.x, q.y); q = P(gx, gy1, u1); b.lineTo(q.x, q.y); b.closePath(); b.fill();
      b.strokeStyle = 'rgba(70,40,20,0.4)'; b.lineWidth = 1; b.stroke();
    }
    // borda da frente do tabuleiro
    b.strokeStyle = '#6b4424'; b.lineWidth = 3; line(gy1, 0); b.stroke();
    rail(gy1, true);
  }

  function viewRect() {
    const l = (-MFViewport.width / 2 - offsetX) / zoom, t = (-MFViewport.height / 3 - offsetY) / zoom;
    return { l: l - 60, t: t - 60, r: l + MFViewport.width / zoom + 60, b: t + MFViewport.height / zoom + 200 };
  }


  // ================= ÁGUA ANIMADA =================
  let fxCanvas = null, fxCtx = null, fxParts = null, fxLast = 0;
  function ensureFx() {
    if (fxCanvas || typeof canvas === 'undefined') return;
    fxCanvas = document.createElement('canvas'); fxCanvas.id = 'mf-water-fx';
    Object.assign(fxCanvas.style, { position: 'fixed', inset: '0', zIndex: '0', pointerEvents: 'none' });
    canvas.after(fxCanvas); fxCtx = fxCanvas.getContext('2d');
    requestAnimationFrame(fxLoop);
  }
  function makeParts(L) {
    const r = rng(77), parts = [];
    const span = L.gyEnd - L.gyTop;
    for (let i = 0; i < Math.round(span * 3.2); i++) parts.push({ s: r() * span, u: (r() - 0.5) * 1.5, k: 0.6 + r() * 0.8, v: 0.45 + r() * 0.35, w: r() < 0.25 });
    return parts;
  }
  function fxLoop(now) {
    requestAnimationFrame(fxLoop);
    if (document.hidden || !enabled() || !LAYOUT) { if (fxCtx && fxCanvas.width) fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); return; }
    if (now - fxLast < 33) return; // ~30 quadros por segundo
    const dt = Math.min(0.1, (now - (fxLast || now)) / 1000); fxLast = now;
    const L = LAYOUT, g = fxCtx;
    MFViewport.resize(fxCanvas);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    g.setTransform(zoom*MFViewport.ratio, 0, 0, zoom*MFViewport.ratio, (MFViewport.width / 2 + offsetX)*MFViewport.ratio, (MFViewport.height / 3 + offsetY)*MFViewport.ratio);
    const view = viewRect(), t = now / 1000;
    // rio: espuminhas descendo
    if (!fxParts) fxParts = makeParts(L);
    const span = L.gyEnd - L.gyTop;
    g.save(); g.clip(L.water);
    for (const p of fxParts) {
      p.s = (p.s + p.v * dt) % span;
      const gy = L.gyTop + p.s, q = iso(L.riverC(gy) + p.u * L.RIVER_W * 0.62, gy);
      if (Math.abs(gy - L.roadGy) < 1.15) continue; // debaixo da ponte
      if (q.x < view.l || q.x > view.r || q.y < view.t || q.y > view.b) continue;
      const fade = Math.min(1, p.s / 1.5, (span - p.s) / 1.5);
      if (p.w) { g.strokeStyle = `rgba(255,255,255,${0.55 * fade})`; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x - 9 * p.k, q.y); g.quadraticCurveTo(q.x, q.y - 3, q.x + 9 * p.k, q.y); g.stroke(); }
      else { g.fillStyle = `rgba(255,255,255,${0.75 * fade})`; g.beginPath(); g.ellipse(q.x, q.y, 6 * p.k, 2.6 * p.k, -0.46, 0, 7); g.fill(); g.beginPath(); g.ellipse(q.x + 5 * p.k, q.y - 1, 3.5 * p.k, 1.8 * p.k, -0.46, 0, 7); g.fill(); }
    }
    g.restore();
    // cachoeira: faixas descendo + espuma no pé
    const f = fallGeom(L);
    if (ready(scenery.fall)) {
      const r = fallAssetRect(L);
      f.x = r.x + r.w * 0.60; f.top = r.y + r.h * 0.18;
      f.bot = r.y + r.h * 0.71; f.wTop = r.w * 0.12; f.wBot = r.w * 0.17;
    }
    if (f.bot - f.top > 20 && f.x > view.l - 100 && f.x < view.r + 100) {
      const lerp = (a, b2, k) => a + (b2 - a) * k;
      g.save(); g.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const k = (i + 0.5) / 7 - 0.5;
        g.strokeStyle = i % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(210,240,255,0.65)'; g.lineWidth = i % 2 ? 2.5 : 3.5;
        g.setLineDash([10 + (i % 3) * 5, 14 + (i % 2) * 8]); g.lineDashOffset = -(t * (150 + i * 12)) % 1000;
        g.beginPath(); g.moveTo(f.x + k * f.wTop * 0.85, f.top + 4); g.lineTo(f.x + k * f.wBot * 0.85, f.bot - 4); g.stroke();
      }
      g.setLineDash([]);
      for (let i = 0; i < 9; i++) { // nuvenzinhas de espuma
        const ph = (t * 0.9 + i / 9) % 1, ang = (i / 9) * Math.PI * 2;
        const px = f.x + Math.cos(ang) * f.wBot * 0.32 * (0.6 + ph), py = f.bot + Math.sin(ang) * 5 - ph * 10;
        g.fillStyle = `rgba(255,255,255,${0.85 * (1 - ph)})`; g.beginPath(); g.arc(px, py, 6 + ph * 12, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(f.x, f.bot, f.wBot * 0.6 + Math.sin(t * 3) * 3, 8, 0, 0, 7); g.fill();
      g.restore();
    }
  }

  function enabled() { return window.MFAdapter?.project?.world?.ambient !== false; }

  function draw(b) {
    if (!enabled()) return;
    if (!SPRITES) buildSprites();
    const info = farmInfo(), sig = JSON.stringify(info);
    if (sig !== LAYOUT_SIG) { LAYOUT = build(info); LAYOUT_SIG = sig; fxParts = null; }
    if (!fxCanvas) ensureFx();
    const L = LAYOUT, view = viewRect();
    window.MFNatureAssets?.ground(b,view);
    drawMountains(b, L, view);
    for (const it of L.low) drawSprite(b, it, view);
    drawRoad(b, L);
    drawTunnel(b, L);
    drawRiver(b, L, view);
    drawWaterfall(b, L);
    drawBridge(b, L);
    // sombras de tudo antes dos objetos
    b.fillStyle = 'rgba(20,50,10,0.22)';
    for (const it of L.props) if (it.shadow && it.x > view.l && it.x < view.r && it.y > view.t && it.y < view.b) { b.beginPath(); b.ellipse(it.x + 6 * it.k, it.y, 30 * it.k, 11 * it.k, 0, 0, 7); b.fill(); }
    for (const it of L.props) drawSprite(b, it, view);
  }

  function layout() { if (!enabled()) return null; if (!SPRITES) buildSprites(); const info = farmInfo(), sig = JSON.stringify(info); if (sig !== LAYOUT_SIG) { LAYOUT = build(info); LAYOUT_SIG = sig; fxParts = null; } return LAYOUT; }
  // ponto do túnel (em tiles) para o caminhão entrar e sair
  function tunnel() { const L = layout(); return L ? { gx: L.tunnelGx, gy: L.roadGy } : null; }
  // altura da ponte num ponto da estrada (o caminhão sobe e desce junto)
  function bridgeLift(gx, gy) { const L = layout(); if (!L || Math.abs(gy - L.roadGy) > 1.2) return 0; return bridgeLiftAt(L, gx); }
  window.MFAmbient = { draw, enabled, tunnel, bridgeLift, groundReady:()=>enabled()&&!!window.MFNatureAssets?.groundReady(),refreshSprites(){SPRITES=null;LAYOUT_SIG='';},inspect(){const L=layout(),r=fallAssetRect(L);return {trees:L.props.filter(p=>['palm','pine','leafy'].includes(p.kind)).length,palms:L.props.filter(p=>p.kind==='palm').length,bankRocks:L.props.filter(p=>p.kind==='bankRock').length,riverStart:L.fallTop,waterOutlet:{x:r.x+r.w*.23,y:r.y+r.h*.92}};}, version: 5, signature: () => (enabled() ? 'amb5:' + COLS + 'x' + ROWS + ':' + sceneryRevision+':'+window.MFNatureAssets?.signature() : 'off') };
})();
