# Spec Delta

## Purpose

Permite que o usuário logado no explorer gere um link temporário de download para um único arquivo, que qualquer pessoa com o link consegue baixar sem login e sem acessar o restante do bucket.

## ADDED Requirements

### Requirement: Ação de compartilhar em arquivos
O explorer SHALL oferecer uma ação "Compartilhar" em cada arquivo listado, e SHALL NOT oferecê-la para pastas.

#### Scenario: Arquivo exibe a ação
- **WHEN** a lista renderiza um objeto cujo nome não termina em `/`
- **THEN** o item mostra o botão "Compartilhar"

#### Scenario: Pasta não exibe a ação
- **WHEN** a lista renderiza um objeto cujo nome termina em `/`
- **THEN** o item não mostra o botão "Compartilhar"

### Requirement: Compartilhar exige o Modo Worker
A ação "Compartilhar" SHALL estar disponível somente no Modo Worker, porque a criação de links depende de chamadas assinadas que uma PAR não pode fazer.

#### Scenario: Modo PAR desabilita a ação
- **WHEN** o explorer está no Modo PAR
- **THEN** o botão "Compartilhar" aparece desabilitado com uma dica informando que requer o Modo Worker

#### Scenario: Modo Worker habilita a ação
- **WHEN** o explorer está no Modo Worker
- **THEN** o botão "Compartilhar" aparece habilitado nos arquivos

### Requirement: Validade obrigatória e limitada
Todo link criado SHALL ter data de expiração. O usuário SHALL escolher a validade entre 1 hora, 1 dia, 7 dias e 30 dias, e a opção padrão SHALL ser 1 dia. O sistema SHALL NOT oferecer link sem expiração.

#### Scenario: Validade padrão
- **WHEN** o usuário abre o diálogo de compartilhamento
- **THEN** a validade de 1 dia vem selecionada

#### Scenario: Validade escolhida define a expiração
- **WHEN** o usuário escolhe 7 dias e confirma
- **THEN** o link criado expira 7 dias após o momento da criação

#### Scenario: Sem opção permanente
- **WHEN** o usuário abre o diálogo de compartilhamento
- **THEN** nenhuma das opções de validade representa um link sem expiração

### Requirement: Link restrito a um único arquivo, somente leitura
O link criado SHALL permitir apenas a leitura do arquivo escolhido. O link SHALL NOT permitir listar o bucket, ler outros objetos, gravar ou apagar.

#### Scenario: Link abre apenas o arquivo compartilhado
- **WHEN** alguém acessa o link de um arquivo compartilhado
- **THEN** recebe o conteúdo desse arquivo e nenhum outro

#### Scenario: Link não serve para outros arquivos
- **WHEN** alguém altera o nome do objeto no caminho do link para outro arquivo
- **THEN** o acesso é negado

### Requirement: Download anônimo enquanto o link for válido
Enquanto o link não tiver expirado, qualquer pessoa com a URL SHALL conseguir baixar o arquivo sem login, sem passar pelo Cloudflare Access e sem passar pelo Worker. Após a expiração, o acesso SHALL ser negado.

#### Scenario: Download sem login
- **WHEN** uma pessoa sem sessão no explorer abre o link antes da expiração
- **THEN** o arquivo é entregue

#### Scenario: Link expirado
- **WHEN** alguém abre o link depois da data de expiração
- **THEN** o acesso é negado e o arquivo não é entregue

### Requirement: Exibição e cópia do link
Após a criação, o explorer SHALL exibir a URL completa do link com a data de expiração e SHALL oferecer uma ação para copiá-la. A URL SHALL ser exibida apenas nessa ocasião; o explorer SHALL NOT listar nem reexibir links criados anteriormente.

#### Scenario: Link criado com sucesso
- **WHEN** o Worker confirma a criação do link
- **THEN** o explorer mostra a URL completa, a data de expiração e um botão para copiar

#### Scenario: Copiar o link
- **WHEN** o usuário aciona o botão de copiar
- **THEN** a URL vai para a área de transferência e o usuário recebe uma confirmação visual

#### Scenario: Link não é reexibido
- **WHEN** o usuário fecha o diálogo e abre o compartilhamento do mesmo arquivo de novo
- **THEN** o explorer não mostra o link anterior e cria um novo link se o usuário confirmar

### Requirement: Falha na criação do link
Se o link não puder ser criado, o explorer SHALL informar o erro ao usuário e SHALL NOT exibir uma URL.

#### Scenario: Worker recusa ou está indisponível
- **WHEN** a chamada de criação falha por erro HTTP ou de conexão
- **THEN** o explorer mostra uma mensagem de erro e não exibe URL de compartilhamento
