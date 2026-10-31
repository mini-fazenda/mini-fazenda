# Chiqueiro

Configuração principal: `public/pigsty-core.js`, objeto `CONFIG`.

| Nível | Nível do jogador | Vagas | Custo | Área lógica |
|---|---|---|---|---|
| 1 | 1 | 3 | 2.000 | 4 × 4 |
| 2 | 12 | 6 | 5.000 | 6 × 6 |
| 3 | 25 | 10 | 12.000 | 8 × 8 |

Um por fazenda. As melhorias exigem área livre; a orientação B é espelhada.

Porco: compra 2.000; começa com 20 kg; ganha 100 kg em 90 minutos (66,6667 kg/h); limite 120 kg. Venda = `floor(peso × 5000 / 120)`, até 5.000 moedas, sem XP. A venda usa o peso contínuo, não o estágio visual. Crescimento por data absoluta continua offline e no MiniBaú.

Os porcos soltos existentes são transferidos automaticamente quando existe vaga no Chiqueiro, preservando `pigBornAt` ou `startTime`; excedentes continuam no mapa e entram quando vagas forem liberadas. Nenhum porco é apagado na migração. Novas compras entram diretamente no cercado e respeitam a capacidade.

O estado `pigsty` fica no objeto do terreno: nível, orientação, porcos com ID/data de nascimento e avisos já exibidos. Captura, restauração, MiniBaú e projeção pública preservam esse estado. Posições de caminhada são transitórias e não alteram o relógio de crescimento.

Artes extraídas do anexo original transparente; sem redesenho.
