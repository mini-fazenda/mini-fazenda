import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('música mantém o Audio e currentTime ao sair e voltar da aba',async()=>{
 const html=readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
 const script=html.match(/<script id="mf-game-audio-runtime">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'Runtime de música não encontrado no game.html');
 const handlers=new Map(),audios=[];
 let hidden=false;
 class FakeAudio{
  constructor(){this.volume=0;this.currentTime=0;this.paused=true;this.loop=false;this.playCalls=0;this.pauseCalls=0;audios.push(this);}
  addEventListener(){}
  play(){this.paused=false;this.playCalls++;return Promise.resolve()}
  pause(){this.paused=true;this.pauseCalls++}
  load(){}
  removeAttribute(){}
 }
 const document={
  readyState:'loading',body:{classList:{contains:()=>false}},
  hidden:false,get visibilityState(){return hidden?'hidden':'visible'},
  getElementById:()=>null,
  addEventListener:(event,fn)=>handlers.set('document:'+event,fn)
 };
 Object.defineProperty(document,'hidden',{get:()=>hidden});
 const window={
  __MF_PROJECT:{audio:{master:1,music:1,tracks:{farm:{src:'assets/audio/farm.mp3',loop:true,volume:1}}}},
  MFHost:{playing:()=>true},
  addEventListener:(event,fn)=>handlers.set('window:'+event,fn)
 };
 const context=vm.createContext({window,document,Audio:FakeAudio,performance:{now:()=>1000},
  localStorage:{getItem:()=>null,setItem(){}},
  requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  setInterval:()=>1,console});
 vm.runInContext(script,context);
 window.MFGameAudio.unlock();
 await Promise.resolve();
 assert.equal(audios.length,1);
 const audio=audios[0];
 audio.currentTime=42.5;
 hidden=true;
 handlers.get('document:visibilitychange')();
 assert.equal(audio.pauseCalls,0,'Ocultar a página não pode parar a música');
 assert.equal(audio.currentTime,42.5);
 hidden=false;
 handlers.get('document:visibilitychange')();
 assert.equal(audios.length,1,'Voltar à aba não deve criar outra faixa');
 assert.equal(audio.currentTime,42.5,'O tempo da música deve ser preservado');
 // iOS/Android podem suspender a reprodução por conta própria.
 audio.paused=true;
 handlers.get('window:pageshow')();
 assert.equal(audios.length,1);
 assert.equal(audio.paused,false,'A faixa deve ser retomada se o sistema a suspendeu');
 assert.equal(audio.currentTime,42.5);
 assert.equal(audio.playCalls,2,'A faixa existente deve receber play novamente');
});
