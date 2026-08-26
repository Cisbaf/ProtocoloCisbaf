import { NextResponse } from 'next/server';

async function proxyError(res: Response) {
  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ error: text || 'Erro no servidor' }, { status: res.status });
  }
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/admin`, {
    headers: { ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
    cache: 'no-store',
  });

  if (!res.ok) return proxyError(res);
  return NextResponse.json(await res.json());
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const body = await request.text();
  const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/admin/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body,
  });

  if (!res.ok) return proxyError(res);
  return NextResponse.json(await res.json(), { status: res.status });
}
