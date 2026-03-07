import { NextRequest, NextResponse } from 'next/server';

// Allow up to 300s for this route (phi3 CPU inference can be slow)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const BACKEND_URL = (process.env.SA_BACKEND_URL || 'http://4.145.88.11:8000').replace(/\/$/, '');

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Support both sync (Next 14) and async (Next 15) params
    const resolved = await Promise.resolve(params);
    const pathSegments = resolved.path ?? [];

    // Build target URL preserving the full path and query string
    const reqUrl = new URL(req.url);
    const target = `${BACKEND_URL}/${pathSegments.join('/')}${reqUrl.search}`;

    const headers = new Headers();
    for (const key of ['content-type', 'authorization', 'accept']) {
      const val = req.headers.get(key);
      if (val) headers.set(key, val);
    }

    const controller = new AbortController();
    // 200 s hard timeout — phi3 on CPU can take 20-120s; 180s Ollama timeout + Groq fallback
    const timer = setTimeout(() => controller.abort(), 200_000);

    const init: RequestInit = { method: req.method, headers, signal: controller.signal };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = await req.arrayBuffer();
    }

    let upstream: Response;
    try {
      upstream = await fetch(target, init);
    } finally {
      clearTimeout(timer);
    }

    const respHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
      if (!['transfer-encoding', 'content-encoding', 'connection'].includes(k.toLowerCase())) {
        respHeaders.set(k, v);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Proxy error', detail: message, backend: BACKEND_URL },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
