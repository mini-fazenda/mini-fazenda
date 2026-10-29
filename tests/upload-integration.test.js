import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const host = read('public/index.html');
const game = read('public/game.html');
const ui = read('public/online-ui.js');

test('host preserva login Google, Firebase e controles de visita', () => {
  for (const id of ['gate','login','message','neighbors','home','logout','farms','farm-list','friends-content','friends-close','friends-title','friends-description']) {
    assert.ok(host.includes('id="' + id + '"'), 'controle ausente: ' + id);
  }
  for (const script of ['firebase-config.js', 'online.js?v=account-v2', 'online-ui.js']) {
    assert.ok(host.includes(script), 'script ausente: ' + script);
  }
});

test('jogo preserva a ponte de salvamento e os dados exportados', () => {
  assert.ok(game.includes('game-bridge.js?v=account-v2'), 'ponte de salvamento');
  const prefix = '<script id="mf-project-bootstrap">window.__MF_PROJECT = ';
  const start = game.indexOf(prefix);
  assert.ok(start >= 0, 'configuracao do projeto presente');
  const end = game.indexOf(';</script>', start + prefix.length);
  assert.ok(end > start, 'configuracao completa do projeto');
  const source = game.slice(start + prefix.length, end);
  const project = JSON.parse(source);
  assert.equal(project.version, 3);
  assert.ok(project.items['item-trigo']);
  assert.ok(project.game);
  assert.ok(project.feedback);
  assert.ok(project._assetManifest);
  assert.ok(!source.includes('data:image/png;base64'), 'recursos devem ficar em assets');
});

test('reutiliza imagens versionadas dos botoes', () => {
  for (const file of ['online-friends.png','online-home.png']) {
    assert.ok(existsSync(new URL('../public/assets/' + file, import.meta.url)), 'imagem ausente: ' + file);
    assert.ok(ui.includes('assets/' + file), 'referencia ausente: ' + file);
  }
  assert.ok(!ui.includes('data:image/png;base64'));
});

test('script de interface compila', () => {
  assert.doesNotThrow(() => new vm.Script(ui, {filename:'online-ui.js'}));
});
