# Fazendeiro Mod

Acesso exclusivo à conta Google **bielz09.lulu@gmail.com**, com e-mail verificado.
A restrição de envio fica nas regras do Realtime Database; ocultar o painel não é a proteção.

## Instalação

1. Integre a alteração no GitHub; o workflow publica e versiona os arquivos.
2. No Firebase, abra **Realtime Database → Regras**, substitua TODO o conteúdo pelo arquivo `database.rules.json` desta alteração e clique em **Publicar**. Alternativa: `firebase deploy --only database --project SEU_PROJETO`.
3. Entre na conta autorizada. Use o botão 🛠 no canto inferior esquerdo, **F2**, crase ou F12. O navegador pode reservar F12 para DevTools; F2 e o botão são alternativas.

Não cole estas regras no Firestore. A publicação do GitHub Pages não publica as regras Firebase.

## Comandos

O alvo é `eu`, `#123456` (ID de seis dígitos) ou o UID Firebase.

| Comando | Efeito |
| --- | --- |
| `/moedas eu 5k` | Dá 5.000 moedas à própria conta |
| `/moedas #123456 10000` | Dá moedas à fazenda indicada (máximo de 1 bilhão por comando) |
| `/xp #123456 2000` | Dá XP, com os níveis e recompensas normais (máximo de 10 milhões por comando) |
| `/fertilizar #123456` | Fertiliza todos os terrenos por 12 horas, sem quota diária ou exigência de amizade |
| `/fertilizar-infinito #123456 on` | Ativa fertilizante permanente, inclusive nos terrenos novos |
| `/fertilizar-infinito #123456 off` | Desativa o fertilizante permanente |
| `/crescer #123456` | Amadurece os cultivos existentes |
| `/quem #123456` | Consulta nome, nível, XP, ID e UID |
| `/ir #123456` | Visita a fazenda |
| `/voltar` | Volta à própria fazenda |
| `/log` | Mostra os últimos dez comandos enviados |
| `/ajuda` | Lista os comandos |

A fertilização do console funciona para qualquer fazenda cadastrada. O botão comum de adubar nas visitas continua com as regras normais de amizade e quota.

## Entrega e segurança

- Os comandos e o histórico são enviados juntos, por atualização atômica em `adminInbox` e `adminLog`.
- O dono recebe um listener em tempo real; se estiver offline, o comando espera pelo próximo login. Durante visitas, espera até a própria fazenda estar aberta.
- O efeito e o recibo por ID são capturados no mesmo save da fazenda. A caixa só é apagada após confirmação do save; novas tentativas consultam o recibo e não repetem moedas ou XP.
- A notificação com o nome da fazenda remetente e a quantidade aparece depois da confirmação. Uma interrupção entre a confirmação e a notificação pode fazer o aviso aparecer no próximo login. Se a página fechar após o aviso e antes da remoção, o aviso pode reaparecer; a recompensa não duplica.
- Logout, troca de conta e perda de sessão encerram os listeners e o console.
- Recibos não são publicados na fazenda visitável. Eles ficam no save privado.
- Só o destinatário lê a própria caixa. Só o dev verificado cria comandos e lê o histórico. O nome do remetente é validado contra o save do dev; o UID também é validado.
- As regras existentes de sessão, revisão e publicação das visitas são preservadas.

Este recurso restringe os **comandos administrativos**. A economia atual ainda aceita progresso calculado no navegador; não torna todos os valores do jogo imunes a alterações via F12. Isso exigiria validação autoritativa das ações no servidor.

## Validação

Execute `npm test`, `npm run test:rules` e os testes `node tests/dev-mod-browser.cjs` / `node tests/dev-delivery-browser.cjs` (com o servidor local em 8080 e Playwright instalado). Os testes de regras usam somente o emulador, sem dados reais.
