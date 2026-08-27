import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cookieHeader = request.headers.get('cookie');
  const body = await request.text();
  const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/admin/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text || 'Erro ao editar usuário' }, { status: res.status });
    }
  }
  return NextResponse.json(await res.json());
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cookieHeader = request.headers.get('cookie');
  const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/admin/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: { ...(cookieHeader ? { Cookie: cookieHeader } : {}) },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || 'Erro ao excluir usuário' }, { status: res.status });
  }
  return new NextResponse(null, { status: 204 });
}
