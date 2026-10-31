import test from 'node:test';
import assert from 'node:assert/strict';
import {startInbox,stopInbox} from '../public/dev-tools.js';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('inbox só remove após save confirmado e repete entrega incerta',async()=>{
 let receive,attempts=0,removed=0,applied=0,receipt=false,resolveSaved;
 const saved=new Promise(r=>resolveSaved=r);
 const sdk={ref:(_db,path)=>path,onChildAdded:(_ref,cb)=>{receive=cb;return ()=>{}},remove:async()=>{assert.equal(receipt,true);removed++}};
 startInbox({sdk,db:{},uid:'owner',gameReady:()=>true,applyGrant:async(grant,id)=>{
  assert.equal(id,'one');attempts++;if(!receipt){applied+=grant.amount;receipt=true}
  if(attempts===1)return false;
  await saved;return true;
 }});
 try{
  receive({key:'one',val:()=>({type:'moedas',amount:5,from:'Dev'})});
  await wait(20);assert.equal(removed,0);assert.equal(applied,5);
  await wait(1050);assert.equal(attempts,2);assert.equal(removed,0);
  resolveSaved();await wait(20);assert.equal(removed,1);assert.equal(applied,5);
 }finally{stopInbox()}
});
test('sessão encerrada durante confirmação nunca remove o comando',async()=>{
 let receive,finish,removed=0;
 const saved=new Promise(r=>finish=r);
 const sdk={ref:(_db,path)=>path,onChildAdded:(_ref,cb)=>{receive=cb;return ()=>{}},remove:async()=>removed++};
 startInbox({sdk,db:{},uid:'owner',gameReady:()=>true,applyGrant:()=>saved});
 receive({key:'two',val:()=>({type:'xp',amount:5,from:'Dev'})});
 stopInbox();finish(true);await wait(20);assert.equal(removed,0);
});
