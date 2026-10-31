/* Estoque separado de produtos; recibos tornam presentes e prêmios idempotentes. */
(function(root){
 const TYPES={madeira:{name:'Madeira',icon:'assets/galinheiro/madeira.webp'},telha:{name:'Telha',icon:'assets/galinheiro/telha.webp'},feno:{name:'Feno',icon:'assets/galinheiro/feno.webp'}},MAX=1000000000;
 const clone=x=>JSON.parse(JSON.stringify(x));
 function bundle(value){if(!value||typeof value!=='object'||Array.isArray(value))return null;const entries=Object.entries(value);if(!entries.length||entries.some(([k,v])=>!Object.hasOwn(TYPES,k)||!Number.isSafeInteger(v)||v<1||v>MAX))return null;return Object.fromEntries(entries);}
 function create(saved){let items,receipts;const api={
  restore(s){items=Object.fromEntries(Object.keys(TYPES).map(k=>[k,Number.isSafeInteger(s?.items?.[k])&&s.items[k]>=0&&s.items[k]<=MAX?s.items[k]:0]));receipts=new Set((Array.isArray(s?.receipts)?s.receipts:[]).filter(x=>typeof x==='string'&&x.length<=160));},
  capture(){return {version:1,items:{...items},receipts:[...receipts]};},
  counts:()=>({...items}),
  grant(value,receipt){const b=bundle(value);if(!b||typeof receipt!=='string'||!receipt||receipt.length>160||receipts.has(receipt)||Object.entries(b).some(([k,v])=>items[k]+v>MAX))return false;for(const [k,v]of Object.entries(b))items[k]+=v;receipts.add(receipt);return true;},
  canSpend(cost){const b=bundle(cost);return !!b&&Object.entries(b).every(([k,v])=>items[k]>=v);},
  spend(cost){if(!this.canSpend(cost))return false;for(const [k,v]of Object.entries(cost))items[k]-=v;return true;}
 };api.restore(saved);return api;}
 root.MFMaterialsCore={TYPES,MAX,bundle,create};
})(globalThis);
