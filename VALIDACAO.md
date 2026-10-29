# Validação — progresso somente na conta (29/10/2026)

- 4 testes unitários de gravação por revisão, proteção contra sobrescrita, confirmação repetida e primeira gravação passaram.
- 21 verificações no emulador real do Realtime Database passaram, incluindo isolamento de contas, visitas autenticadas, rejeição de escrita de outra conta e rejeição de escrita pela sessão anterior após trocar o identificador de sessão.
- Chromium com transporte Firebase simulado: salvamento automático, reload sem confirmação, carregamento exclusivo da versão da conta, limpeza do save local antigo, pausa sem conexão, retomada após validar a sessão, visita e retorno à própria fazenda e encerramento da sessão anterior sem novas gravações.
- A interface não oferece backup, escolha de cópia ou recuperação local. A autenticação usa persistência por aba; nenhum progresso é gravado em localStorage ou IndexedDB.
- O carregamento dos scripts alterados usa versão na URL para evitar misturar módulos novos com versões anteriores em cache.

## Limites

O teste de interface usa autenticação e transporte simulados; não entra em contas Google reais. As regras do banco foram verificadas no emulador sem alterar o banco de produção.

Sem saves locais, alterações ainda em trânsito podem se perder ao fechar à força a página ou o dispositivo. A aplicação envia mudanças automaticamente e pausa o jogo quando perde a conexão; não há garantia de perda zero antes de confirmação do servidor.
