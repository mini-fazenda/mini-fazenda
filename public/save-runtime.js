/* Progresso pertence à conta; regras e aparência vêm da versão atual do jogo. */
(function(root){
 const actorConfig=['speed','velocidade','scale','visualScale','spriteScale','w','h'];
 function actorProgress(actor){const out={...actor};for(const key of actorConfig)delete out[key];return out;}
 function refresh(saved,project){
  if(!saved)return saved;
  const data=JSON.parse(JSON.stringify(saved)),items=project?.items||{};
  for(const key of ['player','aradora'])if(data[key])data[key]=actorProgress(data[key]);
  // Uma janela aberta é estado de interface, não autorização permanente de entrega.
  if(data.truckOrder)data.truckOrder.aberto=false;
  for(const [type,entry]of Object.entries(data.inventory||{}))if(items['item-'+type]?.lootIcon)entry.imgSrc=items['item-'+type].lootIcon;
  for(const t of [...(data.terrenos||[]),...(data.storedObjects||[])]){
   if(t.cultura?.seedId&&items[t.cultura.seedId]?.growTime){
    t.cultura.tipo=t.cultura.seedId.replace(/^item-/,'');
   }
   if(t.cultura&&t.cultura.tipo!=='morta')t.itemId='item-'+t.cultura.tipo;
   const type=t.animal?.tipo||t.cultura?.tipo;
   const id=type?'item-'+type:(t.itemId||t.catalogId||(t.tipo?'item-'+t.tipo:''));
   const cfg=items[id];if(!cfg)continue;
   if(Number(cfg.visualScale)>0)t.visualScale=Number(cfg.visualScale);
   // Não redimensione construções já colocadas: pode sobrepor a fazenda do jogador.
   if(t.animal){
    const stage=Number(t.animal.etapa)||0;
    const src=stage>=2?(cfg.adultImg||cfg.stage2):(stage===1?(cfg.animalStage1||cfg.stage1):cfg.imgSrc);
    if(src)t.imgSrc=src;
   }else if(!t.coop&&!t.cultura&&!t.fruitTree&&id!=='item-celeiro'&&cfg.imgSrc)t.imgSrc=cfg.imgSrc;
  }
  data.runtimeVersion=1;
  return data;
 }
 root.MFSaveRuntime={actorProgress,refresh};
})(globalThis);
