/* Contrato para presentes: receiveGift({id, materials:{madeira,telha,feno}}). */
(()=>{
 const model=MFMaterialsCore.create(),visiting=()=>!!window.MFHost?.isVisiting?.();
 const daily=[{madeira:2},{telha:1},{feno:1},{madeira:2},{telha:1},{feno:1}];
 function grant(bundle,receipt,options={}){if(visiting())return false;const ok=model.grant(bundle,receipt);if(ok&&!options.silent){window.MFHost?.changed?.('materials-granted');requestRedraw();}return ok;}
 window.MFMaterials={types:MFMaterialsCore.TYPES,daily,counts:()=>model.counts(),capture:()=>model.capture(),restore:s=>model.restore(s),canSpend:cost=>model.canSpend(cost),spend:cost=>!visiting()&&model.spend(cost),grant,
  receiveGift(gift){if(!gift||typeof gift.id!=='string')return false;return grant(gift.materials,'gift:'+gift.id);}
 };
})();
