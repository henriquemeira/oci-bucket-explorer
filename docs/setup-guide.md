# Guia de Configuração: OCI Bucket Explorer 🛠️

Este guia detalha como configurar os recursos necessários na **Oracle Cloud Infrastructure (OCI)** e no **Cloudflare** para rodar o Explorer nos dois modos disponíveis.

---

## 1. Configuração na Oracle Cloud (OCI)

### 1.1 Criando uma PAR (Para Modo V1)
Se você deseja apenas o modo básico (Upload/Download):
1. Acesse o console da OCI e vá em **Storage** > **Buckets**.
2. Selecione seu bucket e, no menu lateral, clique em **Pre-Authenticated Requests**.
3. Clique em **Create Pre-Authenticated Request**.
4. Selecione **Bucket** como o *Target Type*.
5. Em **Access Type**, escolha **Permitir leituras e gravações de objeto**.
6. Ative a opção **Enable Object Listing** (Essencial para o explorer funcionar).
7. Copie a URL gerada e cole na constante `URL_PAR` do arquivo `index.html`.

### 1.2 Gerando Chaves de API (Para Modo V2 - Worker)
Para habilitar a exclusão de arquivos e gestão total via API:
1. No seu computador, gere um par de chaves RSA:
   ```bash
   openssl genrsa -out oci_api_key.pem 2048
   openssl rsa -pubout -in oci_api_key.pem -out oci_api_key_public.pem
   ```
2. No console OCI, vá em User Settings (ícone de perfil) > API Keys.

3. Clique em Add API Key e faça o upload do arquivo oci_api_key_public.pem.

4. Anote os dados exibidos: Tenancy OCID, User OCID, Fingerprint, Region e o Namespace do bucket.

## 2. Configuração no Cloudflare Workers (Ponte API)

O Worker é necessário para assinar as requisições de deleção que as PARs não permitem nativamente.

### 2.1 Criando o Worker

1. No painel da Cloudflare, vá em Workers & Pages > Create Application > Create Worker.

2. Nomeie como oci-bridge e faça o deploy inicial.

3. Clique em Edit Code e cole o conteúdo do arquivo worker.js disponível neste repositório.

### 2.2 Configurando Variáveis de Ambiente (Secrets)

Para que o Worker funcione, você deve configurar as variáveis de ambiente no painel do Cloudflare (Settings > Variables):

|Variável|Descrição|
|-|-|
|OCI_TENANCY_ID|O Tenancy OCID copiado da Oracle|
|OCI_USER_ID|O User OCID copiado da Oracle|
|OCI_FINGERPRINT|O Fingerprint da sua chave de API|
|OCI_REGION|Sua região (ex: sa-saopaulo-1)|
|OCI_NAMESPACE|O Namespace do seu Object Storage|
|OCI_BUCKET_NAME|O nome exato do seu Bucket|
|OCI_PRIVATE_KEY|Conteúdo total do seu arquivo oci_api_key.pem|

## 3. Segurança: Protegendo a Interface

Como este projeto é uma Single Page Application (SPA) sem sistema de login embutido, não deixe sua URL pública exposta sem proteção.

**Recomendação: Cloudflare Access (Zero Trust)**

A forma mais robusta de proteger este explorer é utilizar o Cloudflare Access:

1. No painel Cloudflare, vá em Zero Trust > Access > Applications.

2. Adicione uma aplicação do tipo Self-hosted.

3. Vincule ao domínio onde você hospedou o index.html.

4. Configure uma política de autenticação (ex: permitir apenas seu e-mail via One-Time PIN).


## 4. Ajustes Finais no Frontend

No arquivo index.html, certifique-se de preencher as URLs no início do script:

```javascript
const URL_PAR = "https://objectstorage..."; // Sua URL PAR da Oracle
const URL_WORKER = "[https://oci-bridge.seu-subdominio.workers.dev/o/](https://oci-bridge.seu-subdominio.workers.dev/o/)"; // URL do seu Worker (mantenha o /o/ no final)
```

**Pronto!** Agora seu Explorer está configurado para operar com segurança e funcionalidade máxima em ambos os modos.