/**
 * Sessions proxy – forwards /api/sessions-proxy/* to the backend /api/admin/*.
 * This lets the browser call the backend without CORS issues.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const auth = req.headers.get('Authorization');
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const path = pathSegments.join('/');
  const url  = `${BACKEND_URL}/api/admin/${path}`;

  const body = req.method !== 'GET' && req.method !== 'DELETE'
    ? await req.text()
    : undefined;

  const res = await fetch(url, {
    method:  req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  auth,
    },
    body,
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type Params = Promise<{ path: string[] }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  return proxyRequest(req, path);
}
