# Álbum de Coleções e Conquistas — próxima atualização

Implementação na branch de testes; não publicar isoladamente.

O botão 🏆 Conquistas abre o álbum, com seis cartões por página e duas abas. As coleções registram descobertas permanentes de cultivos, produtos e objetos existentes no mapa, inventário ou MiniBaú. Nenhum item é consumido e a aba Coleções não concede moedas.

| Conquista | Meta | Moedas |
|---|---|---|
| A Primeira a Gente Nunca Esquece I | Primeira plantação colhida | 50 |
| II | 1.000 plantações colhidas | 200 |
| III | 3.000 plantações colhidas | 500 |
| IV | 5.000 plantações colhidas | 1.000 |
| Ovos de Ouro I / II / III | Produzir 1 / 10 / 50 ovos de ouro | 50 / 200 / 1.000 |
| Ovos de Diamante I / II / III | Produzir 1 / 10 / 50 ovos de diamante | 50 / 200 / 1.000 |
| Criador de Galinhas | Ter 10 galinhas | 200 |
| Colheita Generosa | Colher 50 unidades de trigo | 300 |
| Comerciante | Vender 20 unidades de produtos | 250 |
| Construtor | Ter concluído 3 construções | 500 |
| Plantio Contínuo | Plantar 30 cultivos | 300 |
| Fazendeiro Experiente | Atingir nível 10 | 400 |

Colheitas contam por plantação; trigo conta as unidades produzidas. Vendas do inventário, ovos do Galinheiro, pedidos pagos do caminhão e produtos de árvores vendidos diretamente contam para Comerciante. Não conta venda de animais. Cada etapa deve ser resgatada individualmente. Resgates são privados e únicos, com reserva contra reentrada e reversão em caso de falha. Visitas não geram progresso nem recompensas.

Não existe histórico confiável de colheitas e vendas nos saves antigos: as contagens começam com esta implementação. Galinhas, construções concluídas e nível já existentes são reconhecidos, conservando o maior progresso observado. Conta-se Celeiro pronto, Chiqueiro e Galinheiro a 100%; guardar ou recolocar não multiplica a contagem.

## Beta Tester: ação obrigatória ao preparar o lançamento

O usuário definiu a coorte como **contas criadas até o lançamento desta atualização**. Antes de publicar, definir `MFAchievementsCore.BETA_CUTOFF` em `public/achievements-core.js` para o instante UTC do lançamento, em milissegundos. Definir uma única vez e não atualizar esse valor em lançamentos futuros. Atualmente `null` mantém aberta a coorte na branch de testes.

A elegibilidade consulta a data de criação da conta Firebase Auth exposta pelo host (`accountCreatedAt`), em vez da data do último save ou do dispositivo. Contas anteriores ao corte podem resgatar mesmo retornando depois. O save conserva a elegibilidade já reconhecida. O sistema segue o modelo de confiança client-side das demais recompensas do jogo; não é uma concessão validada por Cloud Function.

O prêmio é um objeto exclusivo no MiniBaú, sem moedas: Troféu Beta Tester, área 1×1, duas orientações com textos legíveis, colocável, movível e guardável. A orientação é um campo primitivo preservado pelos snapshots existentes do mapa e MiniBaú. O troféu não está à venda na loja.

## Arte e validação

A moldura utiliza a referência fornecida, com cartões HTML opacos cobrindo os exemplos impressos. O troféu foi derivado da referência, removendo fundo por ImageGen e separando os dois quadros em WebP com alpha.

Prompt: “Keep the TWO supplied golden BETA TESTER trophies exactly as they are; preserve the two distinct isometric directions, do not mirror the letters. Remove dark backdrop and glowing halos; genuine transparent alpha; left trophy in left half and right trophy in right half; transparent margins; no extra objects.”

Testes automatizados cobrem as quatro recompensas, restauração, duplicidade, reentrada, falhas, corte beta, elegibilidade tardia, estoque, rotação, visitas e reconhecimento dos bens existentes. A validação visual interativa em navegador continua pendente no ambiente atual.

As conquistas de ovos raros observam os contadores vitalícios do Galinheiro, não o estoque nem a quantidade vendida. Vender, guardar e recolocar não apaga nem multiplica o progresso.
