# Novidades do jogo

O painel usa `public/assets/ui/novidades.png`. Os tópicos são texto HTML sobre a imagem e podem mudar sem refazer a arte.

Ao anunciar uma atualização, edite `public/release-notes-data.js`:

1. Troque `id` por uma versão nova, por exemplo `2026-11-01-1`.
2. Atualize `features` e `fixes`: até quatro tópicos por seção, com frases curtas de até 60 caracteres.
3. Publique junto da atualização. O processo de publicação já versiona os scripts.

A leitura é salva em `state.releaseNotes.seenVersion` na conta. O painel aparece automaticamente uma vez por versão, após login e escolha do personagem, sem interromper tutorial ou recompensas abertas. Visitas não registram leitura. O botão **ÚLTIMAS NOVIDADES**, nas configurações, permite abrir o painel novamente.
