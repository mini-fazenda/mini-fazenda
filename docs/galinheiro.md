# Galinheiro — próxima atualização

Implementação na branch `proxima-atualizacao-galinheiro`. Não publicar nem mesclar na `main` até autorização do Guilherme.

## Regras

- Uma construção por conta, inclusive quando guardada no MiniBaú; área fixa de 6×6 quadradinhos em todas as etapas e capacidades.
- Compra: 10.000 moedas e 600 XP, com a estrutura inicial imediatamente no mapa.
- 0% → 60%: 4 madeiras, 2 telhas e 1 feno.
- 60% → 100%: mais 4 madeiras, 2 telhas e 2 fenos.
- Cada botão entrega todos os materiais daquela etapa de uma vez. Não há tempo de obra adicional. Repetições de uma etapa antiga não descontam novamente.
- Somente depois de 100% é possível comprar galinhas. A capacidade inicial de 10 vagas não inclui galinhas gratuitas.
- Galinha: 1.000 moedas e 5 XP. Produz o primeiro ovo depois de 30 minutos e continua a cada 30 minutos.
- Os ovos acumulam no galinheiro, inclusive offline. A venda em lote paga 40 moedas por ovo e mantém as galinhas. Frações de ciclo permanecem após vender, mover ou guardar.
- Nível 1: 10 vagas. Nível 2: 20 vagas, 30.000 moedas e jogador nível 15. Nível 3: 35 vagas, 70.000 moedas e jogador nível 25. Ampliações não consomem materiais.

## Materiais e integração com os presentes do sócio

Estoque privado no campo `state.constructionMaterials`, separado do inventário de produtos. Tipos estáveis: `madeira`, `telha`, `feno`.

O sistema de presentes deve validar o destinatário e a entrega com o servidor. Só depois deve chamar, na conta do destinatário:

```js
MFMaterials.receiveGift({
  id: 'id-unico-e-estavel-da-entrega',
  materials: { madeira: 4, telha: 2, feno: 1 }
});
```

Retorna `true` ao receber e `false` em visita, para payload inválido ou recibo já recebido. O mesmo ID não pode creditar duas vezes, mesmo após recarregar. A origem autenticada do presente continua sob responsabilidade da integração do sócio; esta API não é uma autorização de entrega pela rede.

Para prêmios internos, `MFMaterials.grant(bundle, receiptId, {silent:true})`; o fluxo chamador salva após concluir o resgate. `capture()` e `restore()` permitem rollback atômico.

- Recompensas diárias 1–6 mantêm os prêmios atuais e adicionam, respectivamente: 2 madeiras, 1 telha, 1 feno, 2 madeiras, 1 telha, 1 feno.
- Prêmios de nível incluem opções de 2 madeiras, 1 telha ou 2 fenos. São escolhas no sorteio existente, sem retirar as opções anteriores.

## Persistência e testes

`terreno.coop` guarda fase, nível, direção, galinhas, próximo instante de ovo de cada uma e quantidade acumulada. Snapshot, restauração e MiniBaú preservam esse objeto. Cada venda zera só os ovos. IDs de galinhas são únicos por galinheiro. Visitas não podem comprar, entregar, vender ou ampliar.

Testes: `tests/coop.test.js`, `tests/coop-ui.test.js`, `tests/materials.test.js`. Rodar também `npm test` antes de integrar.

## Artes

Sprites do projeto em `public/assets/galinheiro/`: `etapa-{0,60,100}-{0,1}.webp`, `galinha.webp`, `galinha-ninho.webp`, `ovo.webp`, `madeira.webp`, `telha.webp`, `feno.webp`.

Preparação com imagegen integrado, seguida apenas de recorte das células e codificação WebP. Referências fornecidas: `1003291644.png` (inicial), `1003291719.png` (60%), `1003291624.png` e `1003291623.png` (finais). As duas direções do sprite final foram ordenadas para acompanhar as etapas anteriores.

Prompts usados:

1. “Background-extraction, production game sprite atlas. Extract the supplied coops, remove dark background and halos, preserve designs, fences, colors, soil and camera. Transparent portrait atlas 1024×1536, 2 columns × 3 rows. Initial pair on top; 60% pair in middle; complete pair below. Six equal 512×512 cells, matching ground footprint, no text, no chickens, no background.”
2. “Transparent sprite atlas, Mini Fazenda hand-drawn cartoon style, flat 2–3 shades, brown outlines. 1536×1024, 3 columns × 2 rows: standing white hen, same hen sitting in straw nest, cream egg, tied wooden planks, terracotta roof tiles, golden hay bale. Six isolated cells, no text, no background or external shadows.”

## Validação desta etapa

204 testes automáticos passaram, incluindo comandos da interface em DOM simulado, relógio offline, recibos, rollback e snapshots reais do mapa e MiniBaú. Artes e encaixe foram conferidos por composição sobre o losango da grade. A revisão interativa no navegador permanece pendente antes do lançamento; não havia navegador de testes instalado neste ambiente.
