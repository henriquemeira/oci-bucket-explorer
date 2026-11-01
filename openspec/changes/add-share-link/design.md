# Design

## Context

O explorer é um único `frontend/index.html` servido pelo Cloudflare Pages atrás do Cloudflare Access, mais um Worker (`worker/index.js`) que assina requisições para o OCI Object Storage. Motivação em `proposal.md`.

Fatos do código atual que moldam a abordagem:

- No Modo Worker, `BASE_URL` é `URL_WORKER`, que termina em `/o/`. O Worker monta a URL do OCI com `.../b/<bucket>` + `url.pathname`, então `<worker>/p/` chega em `.../b/<bucket>/p/`, que é o endpoint de PARs do bucket.
- O `sign()` do Worker já trata `POST` com corpo (SHA-256, `content-type`, `content-length`), então uma chamada `POST /p/` com JSON deve ser assinada sem mudança.
- O upload usa sempre `URL_PAR`, então ela está configurada em qualquer instalação que use o explorer. O host da PAR (`https://objectstorage.<região>.oraclecloud.com`) é o mesmo da URL final do link.
- A exclusão já segue o padrão "desabilitado fora do Modo Worker"; a ação Compartilhar adota o mesmo padrão.
- O Worker não autentica requisições e responde com CORS `*`.

## Goals / Non-Goals

**Goals:**

- Gerar link de leitura para um único objeto, com validade, sem estado no servidor e sem infraestrutura nova.
- Manter o download totalmente fora do Cloudflare (direto do OCI).

**Non-Goals:**

- Revogar, listar ou auditar links pela interface.
- Link permanente, link de uso único, senha ou contador de downloads.
- Autenticar o Worker, restringir CORS ou mexer no controle de acesso existente.
- Limpeza automática de arquivos (lifecycle rule).

## Decisions

### 1. PAR de objeto criada pelo Worker, em vez de token próprio com KV

O frontend chama `POST <origem do Worker>/p/` com o corpo:

```json
{
  "name": "share-<epoch ms>",
  "accessType": "ObjectRead",
  "objectName": "<nome exato do objeto>",
  "timeExpires": "<ISO 8601 UTC>"
}
```

O OCI responde com `accessUri`. Alternativa considerada: tokens guardados em Workers KV com rota pública `/s/<token>`. Daria URL curta, contagem e uso único, mas exige KV, uma rota pública no Worker (que hoje não tem autenticação) e faz o download consumir a cota do Worker. A PAR entrega validade, restrição a um objeto e revogação nativas, sem estado nosso. O nome `share-<epoch>` é curto e seguro quanto a caracteres, e o console do OCI já mostra o objeto de cada PAR, então o nome não precisa repeti-lo.

### 2. O frontend monta a URL final a partir do host de `URL_PAR`

URL final = `new URL(URL_PAR).origin + accessUri`. Assim o Worker não muda e não é preciso uma constante nova de região. Alternativa considerada: o Worker devolver a URL completa, o que exigiria interpretar e reescrever a resposta. Descartada por aumentar o código do Worker sem benefício.

### 3. Validade calculada no cliente como instante absoluto

Os presets (1 h, 1 d, 7 d, 30 d) viram `timeExpires` somando ao relógio do navegador. Não há opção sem validade, e o teto de 30 dias é imposto pela interface. A validação final de limites fica com o OCI.

### 4. Habilitação só no Modo Worker, só para arquivos

O botão aparece para itens que não terminam em `/` e fica desabilitado no Modo PAR, com a mesma dica usada na exclusão. Uma PAR não consegue criar outra PAR.

### 5. Modal reaproveita o padrão do modal de Info

O diálogo de compartilhamento reutiliza `#overlay` e o estilo do `#modalInfo`: seleção de validade, botão "Gerar link", e depois o campo com a URL, a data de expiração e o botão "Copiar" (`navigator.clipboard`, com seleção do texto como alternativa). O nome do arquivo chega ao handler por listener ou índice, não por string interpolada no `onclick`, para não herdar o problema de nomes com aspas simples que o `onclick` atual tem.

### 6. Preflight CORS

O `POST` com `Content-Type: application/json` dispara preflight `OPTIONS`. Como `DELETE` e `PUT` já funcionam pelo Worker, é provável que o preflight passe, mas não foi verificado. Na implementação, testar; se falhar, adicionar ao Worker uma resposta `204` com os cabeçalhos CORS para `OPTIONS`, sem encaminhar ao OCI. É a única alteração prevista no Worker.

## Risks / Trade-offs

- [O link é um segredo de portador: quem o tiver baixa o arquivo] → Validade obrigatória e curta por padrão; a interface não oferece link permanente. Revogação manual no console do OCI.
- [A PAR aponta para o nome do objeto, não para o conteúdo: se o arquivo for sobrescrito ou apagado e recriado com o mesmo nome, o link serve a versão nova] → Documentar no README. Aceitável para o uso rápido pretendido.
- [O Worker continua aberto: quem tem a URL dele pode criar PARs, além de já poder ler e apagar] → Não amplia o que já é possível, mas o risco fica registrado. Proteger o Worker é um change separado e recomendado.
- [Sem revogação pela interface] → Expiração é o controle principal. Se virar necessidade, listar PARs (`GET /p/`) devolve id, nome, objeto e validade, sem a URL, então revogar não exige guardar links.
- [Relógio do navegador adiantado ou atrasado] → Um `timeExpires` já no passado é rejeitado pelo OCI; o erro é mostrado ao usuário. Com 1 hora de validade o efeito de um relógio muito errado é maior.
- [Arquivos compartilhados continuam no bucket depois que o link expira, ocupando o free tier] → Fora de escopo. Uma lifecycle rule por prefixo pode ser tratada depois.
- [Links ficam registrados no OCI como PARs acumuladas] → O console permite listar e apagar; o volume esperado é baixo.

## Migration Plan

Sem migração de dados nem ordem de deploy obrigatória. Publicar o `index.html` atualizado no Cloudflare Pages; reimplantar o Worker apenas se o ajuste de preflight for necessário. Reverter é publicar a versão anterior do `index.html`. PARs já criadas continuam válidas até expirar e podem ser apagadas no console do OCI.
