# Mini Fazenda Online

Jogo completo do HTML fornecido, com login Google obrigatório antes de carregar a fazenda, integração com Firebase Realtime Database e visitas em modo somente leitura.

## Configuração atual

A configuração pública do aplicativo Firebase foi aplicada e aceita pelo serviço do projeto `mini-fazenda-9b007`. O banco usa `https://mini-fazenda-9b007-default-rtdb.firebaseio.com`. O proprietário informou que publicou as regras do projeto.

O código está no repositório `mini-fazenda/mini-fazenda`. O envio de código não publica sozinho o site. O login Google completo e o primeiro save real devem ser conferidos no endereço publicado.

## Publicação pelo GitHub Pages

1. No repositório, abra **Settings → Pages** e selecione **GitHub Actions** como Source.
2. Execute o workflow **Publicar Mini Fazenda** na aba Actions, caso ainda não tenha executado com sucesso.
3. No Firebase Authentication → Settings → Authorized domains, adicione **mini-fazenda.github.io**.
4. O endereço esperado é **https://mini-fazenda.github.io/mini-fazenda/**, disponível depois do workflow terminar.

Também é possível publicar no Firebase Hosting usando os comandos abaixo. A pasta `public` é compartilhada pelas duas opções.

## Configurar o Firebase

1. Crie ou selecione um projeto no console Firebase e registre um aplicativo **Web**.
2. Envie ou copie o objeto `firebaseConfig` para `public/firebase-config.js`. São dados públicos: `apiKey`, `authDomain`, `projectId`, `databaseURL`, `storageBucket`, `messagingSenderId` e `appId`. Não envie senha, chave privada nem JSON de conta de serviço.
3. Em Authentication → Sign-in method, ative **Google** e escolha o email de suporte.
4. Em Authentication → Settings → Authorized domains, inclua o domínio usado pelo jogo. Para desenvolvimento, adicione `localhost` quando necessário.
5. Crie um **Realtime Database**. Este projeto usa Realtime Database, não Cloud Firestore. Copie o endereço exato da instância para `databaseURL`.
6. Publique `database.rules.json` na aba Rules do Realtime Database ou com o comando de implantação abaixo. Não use regras que liberem escrita para todos.
7. Ative Firebase Hosting e publique a pasta `public`.

Com Node.js instalado:

```sh
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only database,hosting
```

A implantação retorna o endereço HTTPS final. Adicione esse domínio aos domínios autorizados do Authentication, se ainda não estiver presente. O ambiente de teste local deve usar servidor HTTP; abrir `index.html` por duplo clique não é suportado.

## GitHub

Repositório solicitado: https://github.com/mini-fazenda/mini-fazenda

No GitHub, libere este repositório na instalação/conexão do aplicativo com permissão de escrita em Contents. A autorização verbal na conversa não muda as permissões técnicas do aplicativo.

Alternativa manual: clone o repositório, copie todos os arquivos deste pacote para a raiz dele, faça commit e envie. O jogo está em `public/game.html`; o ponto de entrada do site é `public/index.html`. O arquivo `Publicar-GitHub.ps1` automatiza o clone, a cópia e o push no Windows usando o seu Git autenticado. Não usa force-push.

O GitHub armazena o código; o Firebase Hosting publica o jogo. O site não fica acessível apenas por colocar os arquivos no repositório.

## O que é salvo

- Moedas, XP, nível, nome da fazenda e dimensões do mapa.
- Todas as estruturas, terras, plantações e animais, com posições e propriedades persistentes já reconhecidas pela engine.
- Inventário, quantidades e imagens dos itens.
- Tempos e etapas de crescimento, produção de leite e progresso do ciclo.
- Posição visual e na grade, orientação e caminho do jogador e da aradora.
- Ação de arar em andamento, fila de ações, estado e pedidos do caminhão, entregas parciais.
- Recompensas que ainda estão voando para o baú, evitando perder a colheita ao reabrir durante a animação.
- Posição da câmera e zoom.

O projeto visual da engine e os recursos ficam no repositório. Os dados da fazenda ficam vinculados ao UID do Google/Firebase. Não há migração automática dos saves antigos de outro navegador ou domínio para uma conta nova.

## Salvamento e recuperação

A engine faz checkpoints a cada 500 ms e nos eventos de salvamento originais. Cada checkpoint é gravado primeiro em armazenamento local, separado por projeto e UID, e depois sincronizado com a nuvem em lotes de aproximadamente 1,2 segundo. Também há checkpoint ao ocultar ou sair da página. IndexedDB mantém uma cópia adicional.

O indicador só informa “Salvo na nuvem” depois da confirmação do servidor. Sem internet, as alterações permanecem pendentes no dispositivo. A página impede sair da conta ou iniciar uma visita enquanto o envio não foi confirmado. O botão Backup exporta o checkpoint atual em JSON.

Revisões e um identificador exclusivo de gravação evitam reaplicar uma alteração cuja confirmação foi perdida. Uma sessão por conta pode escrever: entrar em outra aba/dispositivo pausa a anterior, e as regras do servidor recusam gravações da sessão antiga. Saves locais pendentes só são recuperados automaticamente quando a revisão da nuvem ainda é compatível. Em conflito, o usuário pode baixar sua cópia local e escolher a versão da nuvem; o checkpoint conflitante também é arquivado no IndexedDB.

**Não existe garantia absoluta de perda zero:** fechar o navegador à força antes do checkpoint, apagar dados do site, perder o dispositivo com mudanças ainda offline ou falhas do serviço podem impedir recuperação. Use o status de confirmação e backups. Se o navegador bloquear ou esgotar o armazenamento local, o jogo pausa com uma mensagem em vez de simular uma gravação bem-sucedida.

## Visitas e acesso

A lista de fazendas é paginada. Cada fazenda recebe uma projeção pública para usuários autenticados, atualizada após o save da conta. A visita é uma fotografia da última publicação; não é multiplayer simultâneo. Arraste para explorar e use “Voltar à minha fazenda” para retornar.

O jogo do visitante fica sem atualização da simulação principal e recebe uma camada que permite apenas câmera. O host nunca grava o estado visitado. As regras do banco impedem que visitantes alterem os dados do proprietário, mesmo se alguém modificar o JavaScript do navegador. Inventário, moedas e pedidos privados não são incluídos na projeção de visita; email, nome Google e tokens não são publicados.

O dono da conta continua sendo responsável pelos valores enviados pelo cliente. O sistema protege a separação entre contas, mas não oferece economia antitrapaça com validação autoritativa no servidor.

## Recursos

As 89 URLs de imagens externas encontradas no HTML foram copiadas para `public/assets`, junto com os recursos que estavam embutidos no arquivo. Os nomes originais usados em verificações da engine foram preservados. `asset-sources.json` registra as origens. Os recursos permanecem com suas condições de licença originais.

## Testes

```sh
npm test
npm run serve
```

O teste unitário cobre recuperação offline, conflito entre revisões, confirmação perdida e preservação dos dados no documento salvo. Para executar também os testes do navegador e das regras, instale as dependências opcionais:

```sh
npm install --no-save playwright@1.51.1 firebase@12.5.0 @firebase/rules-unit-testing@5.0.0 firebase-tools@14.22.0
npx playwright install chromium --only-shell
npm run test:rules
```

Com `npm run serve` aberto em outro terminal, execute `npm run test:browser`. Os testes do navegador usam um serviço simulado para a autenticação e a comunicação; o teste de regras usa o emulador real do Realtime Database.

Referências usadas: [login Google](https://firebase.google.com/docs/auth/web/google-signin), [gravações e transações](https://firebase.google.com/docs/database/web/read-and-write), [funcionamento offline](https://firebase.google.com/docs/database/web/offline-capabilities) e [regras de acesso](https://firebase.google.com/docs/database/security).

O arquivo VALIDACAO.md registra as verificações executadas nesta entrega. Login Google em produção e teste com duas contas reais dependem da configuração Firebase.
