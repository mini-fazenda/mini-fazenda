# Árvores permanentes — balanceamento 2

| Árvore | Compra | Ciclo | Moedas/coleta | XP plantio | XP coleta |
|---|---:|---:|---:|---:|---:|
| Limoeiro | 3000 | 35 min | 150 | 140 | 20 |
| Cerejeira | 3500 | 45 min | 220 | 180 | 50 |
| Macieira | 4000 | 50 min | 290 | 180 | 40 |
| Bananeira | 4500 | 60 min | 380 | 220 | 80 |
| Laranjeira | 5000 | 75 min | 520 | 220 | 80 |
| Sakura | 5500 | 90 min | 690 | 280 | 120 |

Loja ordenada por preço. Novas árvores ocupam 2×2 e aguardam o primeiro ciclo completo; pagamento de moedas e XP é direto na coleta. Três estágios (0–49%, 50–99%, 100%). Coleta reinicia o relógio e mantém a árvore. Não acumula várias colheitas enquanto pronta. Crescimento continua offline por timestamp.

## Migração

fruitTree.balanceVersion=2 e cycleMs identificam o novo relógio. Migração aplica uma vez a fração já produzida do ciclo anterior (Limoeiro30min, Macieira40min, Laranjeira50min), inclusive tempo offline. Árvores prontas continuam prontas. Não modifica moedas, XP, posição ou dimensão ocupada. O novo lucro entra na próxima coleta. Árvores antigas menores que2×2 mantêm sua posição; mover exige uma área livre2×2 e só altera a dimensão após concluir com sucesso. Movimento cancelado/inválido preserva a área anterior. MiniBaú e saves preservam progresso.

As Aceroleiras fora desta tabela e frutas já guardadas continuam compatíveis. Nove sprites antigos de Limoeiro/Macieira/Laranjeira substituídos por nove PNGs transparentes extraídos das imagens fornecidas e alinhados à mesma plataforma das outras árvores.

## Arte sem plataforma

As sete espécies usam21sprites em assets/arvores-chao, com3estágios por espécie. As plataformas foram removidas por edição das artes; só permanece uma pequena mancha de terra ao redor das raízes. Sprites256×320 com ponto de apoio do tronco em(128,300). A geometria desenha esse ponto no centro dos blocos ocupados, em gridToScreen(gx+(w-1)/2,gy+(h-1)/2). Desenho, prévia, clique, indicadores e destaque usam a mesma posição. Nenhuma mudança nos relógios ou na economia.
