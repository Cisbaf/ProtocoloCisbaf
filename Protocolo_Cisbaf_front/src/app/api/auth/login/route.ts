import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const backendUrl = process.env.BACKEND_INTERNAL_URL;
    const backendRes = await fetch(`${backendUrl}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (backendRes.ok) {
      const response = NextResponse.json({ success: true, user: { name: username } });

      const setCookies = backendRes.headers.getSetCookie();
      for (const cookie of setCookies) {
        response.headers.append('Set-Cookie', cookie);
      }

      return response;
    }

    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  } catch (error) {
    console.error('Erro ao conectar com o backend:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
