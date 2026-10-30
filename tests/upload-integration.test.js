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
  for (const script of ['firebase-config.js', 'online.js?v=', 'online-ui.js']) {
    assert.ok(host.includes(script), 'script ausente: ' + script);
  }
});

test('jogo preserva a ponte de salvamento e os dados exportados', () => {
  assert.ok(/game-bridge\.js\?v=[\w-]+/.test(game), 'ponte de salvamento');
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

test('modo tela cheia preserva a interface online sobre o jogo', () => {
  const hostScript=read('public/online.js');
  const hostCss=read('public/online.css');
  assert.ok(hostScript.includes('requestFullscreen:requestHostFullscreen'), 'host controla fullscreen');
  assert.ok(hostScript.includes('exitFullscreen:exitHostFullscreen'), 'host controla saída de fullscreen');
  assert.ok(/frame\.src='game\.html\?v=[\w-]+'/.test(hostScript), 'novo HTML sem cache antigo');
  assert.ok(game.includes('window.MFHost.requestFullscreen()'), 'jogo solicita fullscreen no host');
  assert.ok(game.includes('window.MFHost.exitFullscreen()'), 'jogo sai do fullscreen do host');
  assert.ok(hostCss.includes(':root:fullscreen #toolbar'), 'toolbar acima do iframe');
  assert.ok(hostCss.includes('safe-area-inset-right'), 'respeita recortes do celular');
  assert.ok(host.includes('mf-rotate-warning'), 'orientação horizontal sinalizada');
});
test('configurações mobile importadas e botões Amigos sempre acessíveis', () => {
  const prefix='<script id="mf-project-bootstrap">window.__MF_PROJECT = ';
  const a=game.indexOf(prefix)+prefix.length;
  const b=game.indexOf(';</script>',a);
  const project=JSON.parse(game.slice(a,b));
  assert.ok(project.mobileLayout?.elements?.['cards-grid']);
  // a tela de pedidos no celular é montada pelo ajustes-celular.js; posições fixas antigas quebravam o layout
  assert.equal(project.mobileLayout?.elements?.['caminhao-pedidos']?.position, undefined);
  assert.notEqual(project.mobileLayout?.elements?.neighbors?.visible,false, 'Amigos não pode desaparecer');
  assert.equal(project.onlineUI?.buttons?.friends?.image,'assets/online-friends.png');
  assert.equal(project.onlineUI?.buttons?.home?.image,'assets/online-home.png');
  assert.ok(!game.includes('window.__MF_GAME_HTML='));
});
