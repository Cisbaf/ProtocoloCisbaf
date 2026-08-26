import { NextResponse } from 'next/server';

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
