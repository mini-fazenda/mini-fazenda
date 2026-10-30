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

## Salvamento automático na conta

O Firebase mantém o progresso confirmado da conta. Uma cópia temporária, por UID, guarda apenas alterações ainda não confirmadas no localStorage (e sessionStorage como alternativa). Ela é apagada após confirmação e só pode ser recuperada se sua versão de origem ainda corresponder à nuvem, inclusive quando o save que estava em trânsito foi confirmado ao fechar a página. Uma versão remota posterior de outra sessão prevalece. Saves legados continuam sendo removidos.

Cada alteração sinalizada pela engine é enviada imediatamente, com verificação adicional a cada segundo. “Salvando…” indica pendência; “Salvo na nuvem” só aparece após confirmação. Falhas mostram o código e pausam o jogo, com repetição automática e tentativa manual no aviso. O jogo também pausa ao perder conexão. Não há confirmação ao fechar ou recarregar.

Uma nova entrada na conta substitui o identificador da sessão no Firebase antes de carregar a fazenda. A sessão anterior é desconectada, seu iframe é removido e o login dessa aba é encerrado. As regras já publicadas recusam gravações de sessões antigas e revisões que poderiam sobrescrever uma versão mais nova. Isso também protege o caso em que o dispositivo anterior ficou sem internet.

A autenticação usa persistência por aba, para que desconectar a aba antiga não encerre a nova. Credenciais de login e preferências visuais do navegador não são saves de progresso.

A recuperação pendente depende do armazenamento do navegador: limpeza dos dados, armazenamento indisponível ou troca de aparelho antes da sincronização podem perder alterações não confirmadas. Nenhuma interface oferece garantia absoluta de perda zero em interrupções desse tipo. O salvamento é automático e o jogo exige conexão para continuar jogando.

## Crescimento com o jogo fechado

O save registra o horário absoluto de captura e de plantio. Plantios e arações que o jogador já enfileirou podem terminar durante a ausência, respeitando sequência, deslocamento, duração e custo; cada planta usa o horário previsto de conclusão. Não cria novos pedidos nem automatiza colheitas. Saves anteriores usam o updatedAt confirmado como referência; horários legados relativos são migrados conservadoramente usando essa referência e o estágio conhecido, sem inventar o instante original de plantio.

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

O teste unitário cobre revisões, repetição de confirmação e preservação dos dados no documento salvo. Para executar também os testes do navegador e das regras, instale as dependências opcionais:

```sh
npm install --no-save playwright@1.51.1 firebase@12.5.0 @firebase/rules-unit-testing@5.0.0 firebase-tools@14.22.0
npx playwright install chromium --only-shell
npm run test:rules
```

Com `npm run serve` aberto em outro terminal, execute `npm run test:browser`. Os testes do navegador usam um serviço simulado para a autenticação e a comunicação; o teste de regras usa o emulador real do Realtime Database.

Referências usadas: [login Google](https://firebase.google.com/docs/auth/web/google-signin), [gravações e transações](https://firebase.google.com/docs/database/web/read-and-write), [funcionamento offline](https://firebase.google.com/docs/database/web/offline-capabilities) e [regras de acesso](https://firebase.google.com/docs/database/security).

O arquivo VALIDACAO.md registra as verificações executadas nesta entrega. Login Google em produção e teste com duas contas reais dependem da configuração Firebase.

## Fertilização bloqueada pelo Firebase

A publicação no GitHub Pages atualiza o jogo, mas **não publica as regras do Realtime Database**.
Se a amizade funciona e o Firebase nega a consulta de `fertUsage` ou o envio para `fertilize`,
confira as regras publicadas no projeto `mini-fazenda-9b007`.

1. Abra Firebase Console → projeto Mini Fazenda → Realtime Database → **Regras**.
2. Use o conteúdo completo de [`database.rules.json`](database.rules.json) deste repositório.
3. Clique em **Publicar** e recarregue o jogo.

Isso altera permissões, sem apagar o banco. Mantenha as regras completas: elas também protegem
saves, sessões e amizades. Não libere leitura/escrita global.

Alternativa pelo terminal, já autenticado na conta administradora:

```sh
firebase deploy --only database --project mini-fazenda-9b007
```

O teste do emulador verifica cinco fertilizações por amigo, envio atômico com o contador,
bloqueio da sexta e de evento sem contador, leitura pelo dono e confirmação do recebimento.
A mensagem do jogo distingue verificação da amizade, consulta do limite e envio.

## Compatibilidade de contas antigas

O host normaliza números legados e listas esparsas devolvidas pelo Realtime Database
antes de montar a fazenda, tanto no login quanto nas visitas. O primeiro save da
versão compatível conserva o estado anterior em `farms/$uid/legacyStateBackup`,
privado ao proprietário, e preserva os demais campos do documento. Esse backup não
é cache do navegador, não é publicado nas visitas e não é substituído a cada save.
Dados ambíguos/inválidos interrompem o carregamento com o campo identificado, sem
criar uma fazenda nova por cima deles. Não é necessário excluir a conta.

**Publique também o `database.rules.json` atualizado no Firebase.** A regra permite
que um documento legado sem `revision` receba a revisão 1 uma única vez, somente
pelo dono e com a sessão atual. As revisões seguintes continuam sequenciais. Sem
essa publicação, essas contas podem continuar recebendo `PERMISSION_DENIED` ao
salvar; o GitHub Pages não altera as regras do banco.

A comparação do progresso desconsidera apenas `savedAt` e `activeSeconds`, que
mudam sem ações do jogador, para evitar transações contínuas com a fazenda parada.
Alterações reais continuam sendo capturadas. Um documento existente sem `state`
ou com revisão inválida é bloqueado para análise, em vez de ser zerado.

## Saves e visitas em tempo real

Cada gravação confirma `farms/$uid` e `publicFarms/$uid` no mesmo update atômico.
As regras existentes exigem sessão atual e revisão sequencial no save privado;
um conflito rejeita a operação inteira, incluindo a projeção. Isso também evita
usar transações do SDK no caminho principal que antes podia esgotar `maxretry`.
`saveId` continua reconhecendo confirmações repetidas e respostas perdidas.

O visitante assina `publicFarms/$uid` com `onValue`: mudanças de culturas, objetos
e personagem chegam sem sair e entrar de novo. A cena é aplicada sem reiniciar o
iframe ou a câmera. Os relógios de crescimento usam a hora do servidor; tarefas,
inventário, compras e colheitas do dono não são executados pelo visitante.
A visita acompanha o último estado confirmado; latência e interrupções de rede
continuam possíveis, não se trata de um servidor autoritativo de física/movimento.

Ao entrar, o dono também republica saves anteriores para reparar projeções antigas,
com retry e proteção de revisão. Para fazendas cujo último save ocorreu antes desta
correção, o dono precisa entrar uma vez para reparar uma cópia pública desatualizada.
Não é necessário apagar contas nem modificar as regras para este fluxo.

### Adubação compartilhada e zoom em visitas

A atualização permite zoom por botões, roda do mouse e pinça durante visitas.
O adubo preserva a porcentagem atual e reduz em 35% o tempo restante.
O bloco fica adubado por 12 horas, inclusive entre colheitas e novos plantios.
As estrelas permanecem no bloco enquanto o prazo estiver ativo. Todos os
visitantes consultam o mesmo registro por coordenada. Após 12 horas, outro
amigo pode adubar novamente.

**Publicação necessária no Firebase:** copie o conteúdo completo de
`database.rules.json` para Realtime Database → Regras → Publicar. Alternativa
com acesso autenticado ao projeto: `firebase deploy --only database --project mini-fazenda-9b007`.
O GitHub Pages publica apenas o site, não essas regras. Sem a atualização das
regras, o novo adubo será bloqueado, sem consumir a cota. O zoom funciona normalmente.

Cota, evento e marca compartilhada são gravados em uma única atualização
atômica. Um segundo amigo não pode sobrescrever a mesma marca nem consumir
sua cota numa tentativa recusada. Cada novo plantio dentro das 12 horas herda a aceleração. Depois do prazo,
o crescimento volta ao ritmo normal, inclusive em culturas ainda crescendo.
