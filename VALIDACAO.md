# Validação — 29/10/2026

- **5 testes unitários passaram:** primeiro acesso, recuperação offline, confirmação perdida, conflito de revisões e preservação de dados.
- **21 verificações no emulador real do Realtime Database passaram:** isolamento entre contas, rejeição de acesso anônimo, visitas autenticadas, bloqueio de escrita por visitantes, paginação limitada, revisão monotônica, troca de sessão, valores inválidos e repetição de transações já confirmadas.
- **Chromium, jogo real:** inicialização a partir do projeto fornecido; restauração de moedas, XP, nome, inventário, posição, pedidos do caminhão e produção de leite; visita protegida por camada de interação. Nenhum erro JavaScript não tratado. Solicitações abortadas pela troca de iframe durante os testes não representam recursos ausentes.
- **Chromium, host online com serviço simulado:** jogo não carregado antes do login; primeiro save; alterações enviadas automaticamente; recuperação de save local pendente depois de recarregar; publicação da fazenda; visita sem gravar no save próprio; retorno preservando moedas e inventário.
- **Recursos:** as URLs de imagens externas foram copiadas; todas as referências `assets/` do HTML correspondem a arquivos locais. O `worker.js` ausente no HTML original foi incluído. O tempo ativo usado para XP fica no save e não avança em visitas.
- **Correções ligadas ao save:** crédito do leite acontece no ato da coleta, com animação somente visual; prazo de retorno do caminhão persiste ao recarregar; o saldo usado nas vendas antigas e no novo save usa uma única variável.

## Limites dos testes

Login OAuth real do Google, integração com o projeto Firebase de produção, teste com duas contas Google reais e implantação HTTPS ainda não foram executados: a configuração pública foi fornecida depois dos testes e sua aceitação pelo serviço do Firebase foi confirmada. Falta conferir o fluxo no domínio publicado.

Uma tentativa anterior de gravação no GitHub foi recusada com HTTP 403. Depois de selecionar a conexão da conta `mini-fazenda`, a escrita funcionou. Os arquivos são enviados com verificação do hash Git de cada conteúdo.
