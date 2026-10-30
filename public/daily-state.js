/* Um resgate por dia de Brasília. A sequência não se perde ao faltar um dia. */
(function(root){
 const dayKey=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 class DailyState {
  constructor(saved={}){this.restore(saved)}
  restore(s={}){this.data={claimed:Math.max(0,Math.min(6,Math.floor(Number(s.claimed)||0))),lastDay:typeof s.lastDay==='string'?s.lastDay:''}}
  capture(){return {...this.data}}
  available(now=Date.now()){return this.data.claimed<6&&this.data.lastDay!==dayKey(now)}
  claim(grant,now=Date.now()){
   if(!this.available(now))return false;
   grant(this.data.claimed);this.data.claimed++;this.data.lastDay=dayKey(now);return true;
  }
 }
 root.MFRewardState=DailyState;
})(globalThis);
