(function(root){
 const crops={"cenoura": {"price": 50, "saleCoins": 14, "xp": 1, "yieldCount": 5}, "espinafre": {"price": 100, "saleCoins": 140, "xp": 2, "yieldCount": 1}, "trigo": {"price": 200, "saleCoins": 50, "xp": 4, "yieldCount": 6}, "milho": {"price": 350, "saleCoins": 100, "xp": 7, "yieldCount": 6}, "abacaxi": {"price": 500, "saleCoins": 170, "xp": 10, "yieldCount": 5}, "morango": {"price": 400, "saleCoins": 220, "xp": 10, "yieldCount": 3}, "beterraba": {"price": 750, "saleCoins": 375, "xp": 14, "yieldCount": 4}, "cafe": {"price": 1000, "saleCoins": 400, "xp": 14, "yieldCount": 5}, "melancia": {"price": 650, "saleCoins": 325, "xp": 14, "yieldCount": 4}, "cana": {"price": 1200, "saleCoins": 2400, "xp": 20, "yieldCount": 1}, "feijao": {"price": 2000, "saleCoins": 4400, "xp": 35, "yieldCount": 1}, "soja": {"price": 3500, "saleCoins": 8750, "xp": 60, "yieldCount": 1}, "cebola": {"price": 5000, "saleCoins": 12500, "xp": 80, "yieldCount": 1}, "arroz": {"price": 7000, "saleCoins": 10500, "xp": 100, "yieldCount": 1}, "girassol": {"price": 1000, "saleCoins": 1400, "xp": 50, "yieldCount": 1}};
 const plans=[{items:{cenoura:5,espinafre:5},bonus:200},{items:{cenoura:10,espinafre:10},bonus:300},{items:{cenoura:5,espinafre:5,trigo:1},bonus:300},{items:{cenoura:5,trigo:5},bonus:350},{items:{trigo:8},bonus:400}];
 const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()));
 let state={day:day(),index:0};
 root.MFFarmEconomy={crops,plans};
 root.MFMissions={capture:()=>({...state}),restore:s=>{state={day:typeof s?.day==='string'?s.day:day(),index:Math.max(0,Math.min(5,Math.floor(Number(s?.index)||0)))};},
 next(){if(state.day!==day())state={day:day(),index:0};const plan=plans[state.index];if(!plan)return null;
 const pedidos=Object.entries(plan.items).map(([tipo,qtd])=>({tipo,qtd,entregue:0}));
 const recompensaBase=pedidos.reduce((n,p)=>n+crops[p.tipo].saleCoins*p.qtd,0);
 return {schema:2,day:state.day,mission:state.index+1,pedidos,recompensaBase,bonusExtra:plan.bonus,recompensa:recompensaBase+plan.bonus,completo:false,aberto:false};},
 complete(order){if(!order||order.schema!==2||order.day!==state.day||order.mission!==state.index+1||!order.pedidos.every(p=>p.entregue>=p.qtd))return false;state.index++;return true;}
 };
})(globalThis);
