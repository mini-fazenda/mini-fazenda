import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const host = read('public/index.html');
const game = read('public/game.html');
const ui = read('public/online-ui.js');

test('host keeps login, Firebase and the farm visit controls', () => {
  for (const id of ['gate','login','message','neighbors','home','logout','farms','farm-list','friends-content','friends-close','friends-title','friends-description']) {
    assert.match(host, new RegExp('id="' + id + '"'), id);
  }
  assert.match(host, /firebase-config\\.js/);
  assert.match(host, /online\\.js\\?v=account-v2/);
  assert.match(host, /online-ui\\.js/);
});

test('game keeps the saving bridge and reads valid export configuration', () => {
  assert.match(game, /game-bridge\\.js\\?v=account-v2/);
  const source = game.match(/<script id="mf-project-bootstrap">window\\.__MF_PROJECT = (\\{[^\\n]*\\});<\\/script>/);
  assert.ok(source, 'project configuration present');
  const project = JSON.parse(source[1]);
  assert.equal(project.version, 3);
  assert.ok(project.items['item-trigo']);
  assert.ok(project.game);
  assert.ok(project.feedback);
  assert.ok(project._assetManifest);
  assert.doesNotMatch(source[1], /data:image\\/png;base64/);
});

test('assets are reused instead of embedding new copies', () => {
  assert.ok(existsSync(new URL('../public/assets/online-friends.png', import.meta.url)));
  assert.ok(existsSync(new URL('../public/assets/online-home.png', import.meta.url)));
  assert.match(ui, /assets\\/online-friends\\.png/);
  assert.match(ui, /assets\\/online-home\\.png/);
  assert.doesNotMatch(ui, /data:image\\/png;base64/);
});

test('new UI script parses without executing network-dependent functions', () => {
  assert.doesNotThrow(() => new vm.Script(ui, {filename:'online-ui.js'}));
});
