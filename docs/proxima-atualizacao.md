# Atualização acumulada — ainda não publicada

Branch: `proxima-atualizacao-galinheiro`, baseada na publicação `9c305a5`.

- Galinheiro com artes em duas direções e construção por materiais em 0%, 60% e 100%.
- Galinhas com produção de ovos acumulada offline e venda em lote.
- Ampliações para 20 e 35 galinhas.
- Materiais de construção nos prêmios de nível e recompensas diárias.
- Contrato para receber materiais pelo sistema de presentes do sócio.

As notas da próxima versão estão preparadas em `public/release-notes-data.js`. A `main` e o jogo publicado permanecem na versão anterior. Acumular os próximos trabalhos nesta branch; publicar somente quando o Guilherme mandar lançar.

## Álbum de conquistas e coleções

- Dez conquistas, incluindo quatro etapas de colheitas e troféu Beta Tester exclusivo.
- Resgates únicos, descobertas permanentes e rotação/armazenamento do troféu.
- Preparação do lançamento: congelar `BETA_CUTOFF` uma única vez. Regras e validação em [conquistas.md](conquistas.md).
- Contadores de colheitas e vendas passam a registrar novas ações; dados históricos inexistentes não são estimados.

## Galinheiro: variedades e ovos raros

- Cinco cores, visíveis no mapa e na tela interna, com até 35 galinhas.
- Ovos tradicionais (97%, 40 moedas), ouro (2%, 400) e diamante (1%, 1.000), inclusive offline.
- Três estoques com arte própria; vender tudo ou apenas tipos/quantidades selecionados.
- Conquistas de produção de ouro e diamante, cada uma com metas 1/10/50 e prêmios 50/200/1.000 moedas.
- Mudanças acumuladas nesta branch, sem publicação em produção.

- Preço progressivo das galinhas: 300 moedas na primeira e +100 por nova galinha (mantém +5 XP).

## Aviso de nova versão (publicado separadamente)

O host consulta `release.json` a cada 60 segundos enquanto a página está visível e ao voltar à aba/conexão. Uma versão diferente abre aviso obrigatório com Atualizar jogo. O botão captura o progresso, pausa novas entradas e aguarda a confirmação Firebase antes de navegar para uma URL com parâmetro de atualização. Falha, pendência ou troca de sessão impede recarga e permite tentar novamente. Não atualiza sozinho. Quem ainda tem o código anterior precisa atualizar manualmente uma primeira vez para receber esta função.

## Login no iPhone — mitigação preparada

Removida a passagem automática de popup bloqueado para `signInWithRedirect`, incompatível com armazenamento de terceiros bloqueado em hospedagem externa sem proxy/helper no mesmo domínio. O popup é iniciado no próprio toque e erros recebem orientação legível para Safari/abrir fora do navegador interno. Leitura de retornos legados é mantida, sem iniciar novos redirecionamentos. Não limpa armazenamento, contas nem fazendas. A tela de erro hospedada pelo Firebase já aberta não pode ser modificada pelo jogo; o jogador precisa voltar ao endereço do jogo. Validar em iPhone real, especialmente Safari e abertura a partir do WhatsApp. Ref.: https://firebase.google.com/docs/auth/web/redirect-best-practices (opção 2).
