# Marcador de coleta pronta

Asset original fornecido: assets/ui/marcador-pronto.png. Pré-carregado pelo cache existente. Árvores100%, produção pronta dos animais e um único marcador por Chiqueiro com ao menos um porco120kg. Não aparece nas culturas.

Usa os relógios de produção existentes. Camada DOM z7, acima dos sprites do mapa e abaixo da interface. Posição pelo topo visível do sprite, com8px de folga e tamanho28px no zoom1, mínimo18px. Animação no loop de desenho existente: seno1200ms/amplitude5px, fase aleatória por objeto, entrada300ms e escala80→110→100%. Respeita preferência por movimento reduzido. Culling dos marcadores fora da tela. Sem intervalos ou loops por objeto.

Toque na gema entra na fila normal de coleta de árvore/animal. No Chiqueiro abre sua janela normal; venda continua exigindo confirmação individual. Visitantes veem gemas, mas não coletam. Marcadores desaparecem ao deixar de estar prontos ou remover o objeto. Os vistos de pronto individuais sobre porcos foram removidos do mapa.
