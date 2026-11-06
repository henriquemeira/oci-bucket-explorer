/**
 * Cloudflare Worker: OCI API Bridge
 * Gerencia autenticação RSA para permitir DELETE, PUT e GET no Object Storage
 */

async function sign(request, env) {
  const url = new URL(request.url);
  const method = request.method.toLowerCase();
  const date = new Date().toUTCString();
  const host = url.host;
  const path = url.pathname + url.search;

  // Headers necessários para a assinatura OCI
  let headersToSign = ["date", "(request-target)", "host"];
  let signingContent = `date: ${date}\n(request-target): ${method} ${path}\nhost: ${host}`;

  // Se houver corpo (PUT), precisamos do SHA-256 do conteúdo
  if (method === "put" || method === "post") {
    const body = await request.clone().arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", body);
    const contentHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    signingContent += `\nx-content-sha256: ${contentHash}\ncontent-type: ${request.headers.get("content-type") || "application/octet-stream"}\ncontent-length: ${body.byteLength}`;
    headersToSign.push("x-content-sha256", "content-type", "content-length");
  }

  // Chave Privada
  const pem = env.OCI_PRIVATE_KEY.replace(/\\n/g, '\n');
  const binaryDerString = atob(pem.split('-----')[2].replace(/\s/g, ''));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) binaryDer[i] = binaryDerString.charCodeAt(i);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingContent)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  const keyId = `${env.OCI_TENANCY_ID}/${env.OCI_USER_ID}/${env.OCI_FINGERPRINT}`;
  
  return `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",headers="${headersToSign.join(" ")}",signature="${signature}"`;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    // Preflight CORS: responde direto, sem assinar nem chamar a OCI
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      const url = new URL(request.url);

      // Ex: worker.dev/o/arquivo.txt -> objectstorage.<region>.oraclecloud.com/n/<ns>/b/<bucket>/o/arquivo.txt
      const ociUrl = `https://objectstorage.${env.OCI_REGION}.oraclecloud.com/n/${env.OCI_NAMESPACE}/b/${env.OCI_BUCKET_NAME}${url.pathname}${url.search}`;

      // Lê o corpo uma única vez (o stream só pode ser consumido uma vez)
      const hasBody = !["GET", "HEAD"].includes(request.method);
      const body = hasBody ? await request.arrayBuffer() : undefined;

      const newRequest = new Request(ociUrl, {
        method: request.method,
        body,
        headers: new Headers(request.headers)
      });

      newRequest.headers.set("Date", new Date().toUTCString());

      if (request.method === "PUT" || request.method === "POST") {
        const hashBuffer = await crypto.subtle.digest("SHA-256", body);
        const contentHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
        newRequest.headers.set("x-content-sha256", contentHash);
      }

      newRequest.headers.set("Authorization", await sign(newRequest, env));

      const response = await fetch(newRequest);
      const newHeaders = new Headers(response.headers);
      for (const [k, v] of Object.entries(CORS)) newHeaders.set(k, v);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (e) {
      return new Response(JSON.stringify({ message: String(e && e.message || e) }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
  }
};
