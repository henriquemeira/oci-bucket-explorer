# Tasks

## 1. Criação do link via Worker

- [ ] 1.1 Confirmar com um `curl` assinado pelo Worker (`POST <worker>/p/` com o corpo de `design.md`, `ObjectRead` em um arquivo de teste e validade de 1 hora) que o OCI responde `200` com `accessUri`; verificar que baixar `https://objectstorage.<região>.oraclecloud.com<accessUri>` sem credenciais devolve o arquivo
- [ ] 1.2 Confirmar o preflight a partir do navegador: um `fetch` com `Content-Type: application/json` para `<worker>/p/` na página do explorer não falha por CORS. Se falhar, em `worker/index.js` responder `OPTIONS` com `204` e os cabeçalhos CORS sem encaminhar ao OCI, e repetir o `fetch` até passar

## 2. Interface de compartilhamento

- [x] 2.1 Em `frontend/index.html`, adicionar o botão "Compartilhar" na renderização de arquivos (não de pastas), desabilitado com dica no Modo PAR; verificar no navegador que pastas não mostram o botão e que alternar o modo habilita e desabilita o botão
- [x] 2.2 Adicionar o modal de compartilhamento reaproveitando `#overlay`: seletor de validade (1 hora, 1 dia, 7 dias, 30 dias, padrão 1 dia, sem opção permanente) e botão "Gerar link"; verificar que o modal abre com 1 dia selecionado e fecha pelo overlay e pelo botão de fechar
- [x] 2.3 Implementar a criação: calcular `timeExpires`, chamar `POST /p/` no Worker com `name` `share-<epoch ms>`, `accessType` `ObjectRead`, `objectName` e `timeExpires`, e montar a URL com `new URL(URL_PAR).origin + accessUri`; o nome do arquivo deve chegar ao handler sem interpolação em `onclick`. Verificar com arquivos de nomes comuns, com espaços, com acentos e com `/` no caminho
- [ ] 2.4 Exibir o resultado com a URL, a data de expiração e o botão "Copiar" (com seleção do texto como alternativa e confirmação visual); verificar que a URL colada em uma janela anônima baixa o arquivo sem login
- [x] 2.5 Tratar falhas (erro HTTP, falha de conexão, `timeExpires` recusado) com mensagem de erro e sem exibir URL; verificar simulando o Worker indisponível (URL inválida) e confirmando que nenhuma URL aparece
- [x] 2.6 Garantir que o link anterior não é reexibido: fechar o modal e reabrir o compartilhamento do mesmo arquivo mostra o estado inicial; verificar no navegador

## 3. Verificação ponta a ponta e documentação

- [ ] 3.1 Em janela anônima, verificar os cenários da spec `file-sharing`: o link baixa o arquivo; trocar o nome do objeto no caminho da URL é negado; ler a raiz do bucket com o mesmo `accessUri` é negado; após a expiração (usar validade de 1 hora e conferir no console do OCI, ou criar uma PAR de teste curta) o acesso é negado
- [x] 3.2 Atualizar `README.md` (lista de funcionalidades e segurança) e `docs/setup-guide.md` (nova seção "Compartilhamento por link"): exige Modo Worker, link visível uma única vez, validade obrigatória, link vale para o nome do objeto (sobrescrever o arquivo muda o que o link entrega), revogação pelo console do OCI em Pre-Authenticated Requests. Verificar relendo as seções e seguindo os passos documentados
