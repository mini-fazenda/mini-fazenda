/* Celeiro de produtos: moldura própria, independente da arte do MiniBaú. */
(()=>{
 const panel=document.getElementById('bau-content');if(!panel)return;
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','mf-barn-title');
 const roof=document.createElement('div');roof.className='mf-barn-roof';roof.setAttribute('aria-hidden','true');
 roof.innerHTML='<svg viewBox="0 0 700 110" preserveAspectRatio="none"><path d="M10 108L350 8L690 108" fill="#653c26" stroke="#f3d69d" stroke-width="12" stroke-linejoin="round"/><path d="M40 106L350 20L660 106" fill="#8d4831"/><path d="M350 30v64M180 76l170-46 170 46" fill="none" stroke="#ac6546" stroke-width="5"/><rect x="325" y="59" width="50" height="35" rx="5" fill="#f1d49b"/><path d="M350 62v29M329 76h42" stroke="#7c482f" stroke-width="5"/></svg>';
 const title=document.createElement('h2');title.id='mf-barn-title';title.textContent='Mini Celeiro';panel.prepend(roof,title);
 const style=document.createElement('style');style.textContent=`
 #overlay-bau{padding:12px!important;box-sizing:border-box!important}
 #overlay-bau #bg-bau{display:none!important}
 #overlay-bau #bau-content{position:relative!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;align-items:stretch!important;width:min(720px,94vw)!important;max-width:720px!important;height:auto!important;max-height:94vh!important;overflow:auto!important;transform:none!important;box-sizing:border-box!important;padding:116px 24px 20px!important;background:repeating-linear-gradient(90deg,#b34e33 0,#b34e33 57px,#9d402a 58px,#9d402a 61px)!important;border:5px solid #f1d29a!important;border-top:none!important;clip-path:polygon(50% 0,100% 96px,100% 100%,0 100%,0 96px)!important;border-radius:8px 8px 20px 20px!important;box-shadow:0 15px 60px #0008,inset 0 0 0 3px #6b3524!important}
 #bau-content .mf-barn-roof{position:absolute;inset:0 0 auto;height:100px;background:transparent;pointer-events:none}#bau-content .mf-barn-roof svg{width:100%;height:100%;display:block}
 #bau-content #mf-barn-title{font:clamp(28px,4vw,42px) Amfost,Arial!important;color:#ffe49a!important;text-shadow:2px 3px #63331c!important;text-align:center!important;position:relative!important;margin:-12px 40px 18px!important;line-height:1.15!important}
 #overlay-bau #bau-inventario{position:relative!important;inset:auto!important;transform:none!important;display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;grid-template-rows:repeat(4,auto)!important;gap:8px!important;width:100%!important;height:auto!important;box-sizing:border-box!important;padding:14px!important;background:#6d351f66!important;border:2px solid #e8bf7d!important;border-radius:14px!important;margin:0!important;overflow:visible!important}
 #bau-inventario .bau-slot{position:relative!important;width:100%!important;height:auto!important;aspect-ratio:1!important;min-width:0!important;box-sizing:border-box!important;background:#ffe0a51f!important;border:2px solid #efca8d!important;border-radius:10px!important;overflow:hidden!important}
 #bau-inventario .bau-slot>img{max-width:90%!important;max-height:90%!important;object-fit:contain!important}
 #overlay-bau #mf-sales-actions{position:relative!important;inset:auto!important;transform:none!important;justify-content:center!important;flex-wrap:wrap!important;white-space:normal!important;margin:22px 0 0!important;padding:10px!important;background:#77381f77!important;flex-shrink:0!important}
 #overlay-bau #mf-sales-msg{position:relative!important;inset:auto!important;margin:10px 0 0!important;min-height:16px!important}
 #bau-content .btn-fechar-overlay{position:absolute!important;top:98px!important;right:10px!important;width:40px!important;height:40px!important;z-index:25!important}
 @media(max-height:650px){#overlay-bau #bau-content{width:min(570px,94vw)!important;padding-top:83px!important;clip-path:polygon(50% 0,100% 68px,100% 100%,0 100%,0 68px)!important}.mf-barn-roof{height:70px!important}#bau-content .btn-fechar-overlay{top:68px!important}#bau-content #mf-barn-title{font-size:28px!important;margin-bottom:10px!important}#overlay-bau #bau-inventario{gap:5px!important;padding:8px!important}#overlay-bau #mf-sales-actions{margin-top:12px!important}}
 `;document.head.append(style);
})();
