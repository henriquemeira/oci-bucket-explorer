# OCI Bucket Explorer 🚀

Uma interface leve, moderna e sem servidor (Serverless) para gerenciar objetos no **Oracle Cloud Infrastructure (OCI) Object Storage**. 

Este projeto resolve a limitação de visualização e gestão de arquivos em Buckets da Oracle, oferecendo uma experiência de "Google Drive" ou "Dropbox" personalizada, rodando inteiramente em serviços gratuitos ou de baixo custo.



## ✨ Funcionalidades

* **Navegação por Pastas:** Suporte total a prefixos (pastas virtuais) com navegação via breadcrumbs.
* **Gestão de Arquivos:** Upload, Download e visualização de metadados (Tamanho, Data de modificação, ETag).
* **Ordenação Inteligente:** Pastas sempre no topo e ordenação alfabética automática.
* **Interface Responsiva:** Design limpo focado em usabilidade.
* **Dual Mode:** Escolha entre facilidade de configuração (PAR) ou controle total (Worker).

## 🛠 Modos de Operação

O Explorer pode ser configurado de duas formas, alternáveis via um interruptor no rodapé da página:

### 1. Modo PAR (Pre-Authenticated Request)
Ideal para configurações rápidas ou compartilhamento temporário.
* **Requisito:** Uma URL PAR gerada no console da Oracle com permissão de leitura e gravação.
* **Prós:** Configuração em 1 minuto; não requer servidor ou chaves de API.
* **Contras:** **Não permite a exclusão de arquivos** (limitação nativa da segurança da Oracle para PARs).

### 2. Modo Worker (OCI API Bridge)
Para usuários que precisam de gestão completa, incluindo a exclusão de arquivos e pastas.
* **Requisito:** Um **Cloudflare Worker** atuando como ponte, configurado com as chaves de API da Oracle (API Key, Fingerprint, Tenancy OCID).
* **Prós:** Permite a **exclusão definitiva** de objetos; maior segurança (as chaves ficam protegidas no ambiente do Worker).
* **Funcionamento:** O Worker assina digitalmente as requisições usando o padrão RSA-SHA256 exigido pela Oracle.



## 🔐 Segurança e Autenticação

Este projeto **não implementa um sistema de login interno** no código-fonte por motivos de segurança (evitar exposição de credenciais no frontend).

Recomenda-se fortemente o uso de camadas de autenticação externas (Zero Trust), como:
* **Cloudflare Access:** Coloca um portal de login (Email PIN, Google, GitHub) à frente da página.
* **Oracle Cloud IAM:** Se hospedado em instâncias específicas.

> **Atenção:** Nunca publique sua `index.html` com a URL da PAR ou do Worker em servidores públicos sem uma camada de proteção como o Cloudflare Access.

## 🚀 Como Instalar

1.  **Frontend:** Suba o arquivo `index.html` para o **Cloudflare Pages** ou qualquer servidor estático.
2.  **Configuração V1 (PAR):** Insira a URL da sua PAR na constante `URL_PAR`.
3.  **Configuração V2 (Worker):**
    * Crie um Cloudflare Worker com o script fornecido na pasta `/worker`.
    * Configure as variáveis de ambiente (`OCI_PRIVATE_KEY`, `OCI_USER_ID`, etc.) no painel da Cloudflare.
    * Atualize a constante `URL_WORKER` no HTML.

## 📄 Licença
Este projeto está sob a licença MIT. Sinta-se à vontade para usar, modificar e distribuir.