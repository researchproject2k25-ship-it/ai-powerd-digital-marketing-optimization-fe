import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chatbot
 *
 * Proxy to the Smart Assistant backend RAG engine.
 *
 * - If the request carries a Bearer token  → forwards to /api/admin/chat
 *   (tenant is resolved automatically from the JWT on the backend).
 * - If no token is provided               → returns 401.
 *
 * Backend URL is configured via the server-side env var BACKEND_URL
 * (defaults to http://localhost:8000 for local development).
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Forward the Authorization header if present (admin / user JWT)
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to use the Smart Assistant.' },
        { status: 401 }
      );
    }

    // Proxy to backend /api/admin/chat
    const backendRes = await fetch(`${BACKEND_URL}/api/admin/chat`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ message, context: context || [] }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.message || 'Backend error' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chatbot proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy error' },
      { status: 500 }
    );
  }
}

/** GET /api/chatbot — health check */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'smart-assistant-proxy',
    backend: BACKEND_URL,
    timestamp: new Date().toISOString(),
  });
}
