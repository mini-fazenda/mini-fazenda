import test from 'node:test';import assert from 'node:assert/strict';import '../public/growth-time.js';
const {normalize}=MFGrowthTime,now=1800000000000,savedAt=now-12*3600000,totalTime=8*3600000;
test('preserva o instante real de plantio e converte Unix em segundos',()=>{
 for(const startTime of [savedAt,String(savedAt),savedAt/1000]){const c={startTime,etapa:0};assert.equal(normalize(c,{now,savedAt,totalTime}),savedAt);assert.equal(normalize(c,{now:now+1000,savedAt:now,totalTime}),savedAt);}
});
test('horário relativo legado usa último save e progresso conhecido, sem reiniciar a cada login',()=>{
 for(const [etapa,ratio]of [[0,0],[1,.5],[2,1]]){const c={startTime:12345,etapa};const start=normalize(c,{now,savedAt,totalTime,firstRatio:.5});assert.equal(start,savedAt-totalTime*ratio);assert.equal(normalize(c,{now:now+1000,savedAt:now,totalTime}),start);}
});
test('horário inválido ou futuro não prende o cultivo em zero',()=>{
 for(const startTime of [undefined,NaN,now+86400000])assert.equal(normalize({startTime,etapa:0},{now,savedAt,totalTime}),savedAt);
 assert.equal(normalize({startTime:NaN,etapa:0},{now,totalTime}),now);
});
