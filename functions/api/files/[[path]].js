// Cloudflare Pages Function: R2 認証プロキシ
//
// 役割:
//   - /api/files/<key> でリクエストを受け取る
//   - Cloudflare Access が認証済みの場合のみ実行される（edge側でガード）
//   - R2 バインディング (PDF_BUCKET) から該当オブジェクトを取得して返す
//
// 環境変数バインディング設定 (Cloudflare Pages > Settings > Functions > R2 bucket bindings):
//   PDF_BUCKET → inhouse-details
//
// セキュリティ:
//   - Cloudflare Access のポリシーでこの関数の前に認証チェックが入る
//   - R2 の公開URL (pub-xxx.r2.dev) を無効化しても、この経路は機能する
//   - 認証なしのアクセスは Access のログインページにリダイレクトされる

export async function onRequest(context) {
  const { env, params, request } = context;

  // CORS プリフライト
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders(request),
    });
  }

  if (!env.PDF_BUCKET) {
    return new Response(
      "Server misconfiguration: PDF_BUCKET binding not found",
      { status: 500, headers: corsHeaders(request) }
    );
  }

  // params.path は配列または単一文字列
  // URL内の日本語などは %エンコードで届くため、R2のキー(生の文字列)に合わせて
  // decodeURIComponent で元に戻してから join する
  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const safeParts = pathParts
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    })
    .filter((p) => p && !p.includes(".."));
  if (safeParts.length === 0) {
    return new Response("Invalid path", {
      status: 400,
      headers: corsHeaders(request),
    });
  }
  const key = `files/${safeParts.join("/")}`;

  try {
    const object = await env.PDF_BUCKET.get(key);
    if (!object) {
      return new Response(`Not found: ${key}`, {
        status: 404,
        headers: corsHeaders(request),
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=3600");
    // CORS
    for (const [k, v] of Object.entries(corsHeaders(request))) {
      headers.set(k, v);
    }

    return new Response(request.method === "HEAD" ? null : object.body, {
      status: 200,
      headers,
    });
  } catch (e) {
    return new Response(`Error: ${String(e)}`, {
      status: 500,
      headers: corsHeaders(request),
    });
  }
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "Content-Length, Content-Type, ETag",
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin",
  };
}
