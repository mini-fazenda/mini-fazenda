import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const game=fs.readFileSync(new URL('../public/game.html',import.meta.url),'utf8');
test('audio runtime and farm action hooks survive the online build',()=>{
 assert.match(game,/id="mf-game-audio-runtime"/);
 for(const action of ['plow','plant','harvest','place'])assert.ok(game.includes("MFGameAudio?.event('"+action), 'missing sound hook '+action);
 assert.match(game,/game-bridge\.js/);
 assert.match(game,/window\.MFHost\?\.isFullscreen/);
});
test('all uploaded audio assets are externally available and wired into config',()=>{
 const m=game.match(/<script id="mf-project-bootstrap">window\.__MF_PROJECT = (\{[\s\S]*?\});<\/script>/);
 assert.ok(m,'project config not found');
 const project=JSON.parse(m[1]);
 assert.equal(project.online.enabled,true);
 assert.ok(project.audio?.assets);
 for(const [id,asset] of Object.entries(project.audio.assets)){
   assert.match(asset.src,/^assets\/audio\/aud[a-z0-9]+\.mp3$/);
   assert.equal(asset.src,'assets/audio/'+id+'.mp3');
   const p=new URL('../public/'+asset.src,import.meta.url);
   assert.ok(fs.statSync(p).size>=asset.size,'audio file missing/truncated: '+id);
 }
 for(const event of ['plow','plant','harvest']){
  const src=project.audio.global[event]?.src;
  assert.match(src,/^asset:aud[a-z0-9]+$/);
  assert.ok(project.audio.assets[src.slice(6)],'missing config '+event);
 }
 assert.doesNotMatch(game,/data:audio\/mpeg;base64,/);
});
