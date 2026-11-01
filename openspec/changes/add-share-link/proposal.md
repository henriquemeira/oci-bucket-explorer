# Proposal

## Why

Hoje a única forma de dar acesso a um arquivo para outra pessoa é cadastrar o e-mail dela no Cloudflare Access, e essa pessoa passa a enxergar todas as pastas do bucket. Surgiu a necessidade de compartilhamento rápido: o usuário logado envia um arquivo e manda um link para alguém baixar, sem login e sem acesso ao resto do explorer.

## What Changes

- Novo botão **Compartilhar** em cada arquivo da lista do explorer (não em pastas), habilitado somente no Modo Worker.
- Ao clicar, o usuário escolhe uma validade (presets de 1 hora, 1 dia, 7 dias e 30 dias; padrão 1 dia) e o frontend pede ao Worker a criação de uma PAR de leitura (`ObjectRead`) restrita àquele único objeto, com `timeExpires`.
- A URL completa do link é exibida em um modal com botão de copiar. O OCI devolve o acesso da PAR apenas na criação, então o link é mostrado uma vez e não é guardado nem listado depois.
- Quem recebe o link baixa o arquivo direto do OCI Object Storage, sem login, sem Cloudflare Access e sem passar pelo Worker.
- Não há link permanente: toda PAR criada tem validade obrigatória, com teto definido pelo próprio frontend.
- Documentação (README e guia de setup) atualizada com a funcionalidade e com seus limites.
- Sem infraestrutura nova (sem KV, sem banco), sem upload anônimo, sem alteração na PAR de upload existente.

Fora de escopo, registrado para decisões futuras:

- Revogar ou listar links pela interface (a revogação continua possível pelo console do OCI, em Pre-Authenticated Requests).
- Autenticar o Worker (hoje ele aceita qualquer origem e não exige login).
- Lifecycle rule para apagar arquivos antigos de compartilhamento.

## Capabilities

### New Capabilities

- `file-sharing`: criação de links temporários de download para um único arquivo, via PAR de leitura por objeto, e o acesso anônimo a esse arquivo enquanto o link for válido.

### Modified Capabilities

<!-- Nenhuma: ainda não existem specs em openspec/specs/. -->

## Impact

- `frontend/index.html`: novo botão na renderização da lista, modal de compartilhamento (validade, resultado, copiar), função que chama o Worker e monta a URL final.
- `worker/index.js`: em princípio sem alteração, porque o Worker já mapeia `pathname` para a API do bucket e já assina `POST` com corpo, então `POST /p/` deve funcionar. Pode ser necessário um ajuste de CORS (resposta ao preflight `OPTIONS`), a confirmar na implementação.
- `README.md` e `docs/setup-guide.md`: nova seção sobre compartilhamento por link.
- Sistemas externos: OCI Object Storage (criação de PAR por objeto). Nenhuma dependência nova.
- Segurança: o Worker continua sem autenticação própria. Quem conhece a URL dele já consegue ler e apagar objetos, então este change não amplia o que um atacante pode fazer, mas também não resolve isso.
