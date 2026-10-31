import test from 'node:test';import assert from 'node:assert/strict';
import {isDevUser,validateGrant,parseAmount,parseTarget,parseCommand,LIMITS} from '../public/dev-grants.js';

test('só o e-mail do dev, verificado, vira conta de desenvolvedor',()=>{
 assert.equal(isDevUser({email:'bielz09.lulu@gmail.com',emailVerified:true}),true);
 assert.equal(isDevUser({email:'Bielz09.Lulu@gmail.com',emailVerified:true}),true);
 assert.equal(isDevUser({email:'bielz09.lulu@gmail.com',emailVerified:false}),false);
 assert.equal(isDevUser({email:'outra@gmail.com',emailVerified:true}),false);
 assert.equal(isDevUser(null),false);
});
test('validateGrant aceita só tipos conhecidos e quantidades dentro do limite',()=>{
 assert.deepEqual(validateGrant({type:'moedas',amount:5000,from:'Recanto'}),{type:'moedas',amount:5000,from:'Recanto'});
 assert.deepEqual(validateGrant({type:'fertilizar',from:'Dev'}),{type:'fertilizar',from:'Dev'});
 assert.equal(validateGrant({type:'moedas',amount:0,from:'x'}),null);
 assert.equal(validateGrant({type:'moedas',amount:-5,from:'x'}),null);
 assert.equal(validateGrant({type:'moedas',amount:LIMITS.moedas+1,from:'x'}),null);
 assert.equal(validateGrant({type:'xp',amount:LIMITS.xp+1,from:'x'}),null);
 assert.equal(validateGrant({type:'moedas',from:'x'}),null);
 assert.equal(validateGrant({type:'apagar-tudo',from:'x'}),null);
 assert.equal(validateGrant(null),null);
 assert.equal(validateGrant({type:'moedas',amount:10,from:'NomeMuitoGrandeDemais'}).from.length,12);
});
test('parseAmount entende 5k, 1,5k, 2m, 1.000.000 e rejeita lixo',()=>{
 assert.equal(parseAmount('5000'),5000);assert.equal(parseAmount('5k'),5000);assert.equal(parseAmount('1,5k'),1500);
 assert.equal(parseAmount('2m'),2000000);assert.equal(parseAmount('1.000.000'),1000000);
 for(const bad of ['0','-3','abc','','1e9','5kk',undefined])assert.equal(parseAmount(bad),null,String(bad));
});
test('parseTarget aceita eu, ID de 6 dígitos e UID',()=>{
 assert.deepEqual(parseTarget('eu'),{kind:'self'});assert.deepEqual(parseTarget(''),{kind:'self'});
 assert.deepEqual(parseTarget('#123456'),{kind:'code',code:'123456'});assert.deepEqual(parseTarget('123456'),{kind:'code',code:'123456'});
 assert.deepEqual(parseTarget('abcDEF1234567890abcdEFGH12'),{kind:'uid',uid:'abcDEF1234567890abcdEFGH12'});
 assert.equal(parseTarget('12'),null);assert.equal(parseTarget('a/b'),null);
});
test('parseCommand resolve apelidos e marca comandos desconhecidos',()=>{
 assert.deepEqual(parseCommand('/moedas #123456 5k'),{cmd:'moedas',args:['#123456','5k'],known:true});
 assert.equal(parseCommand('fertinf eu on').cmd,'infinito');
 assert.equal(parseCommand('/xyz').known,false);
 assert.equal(parseCommand('').cmd,'');
});
