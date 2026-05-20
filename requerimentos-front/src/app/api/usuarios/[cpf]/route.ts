import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const { cpf } = await params;

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL || 'http://localhost:8080';
    const res = await fetch(`${backendUrl}/user/${cpf}`, {});

    if (res.status === 404) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!res.ok) {
      throw new Error('Erro ao buscar dados do usuário');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
