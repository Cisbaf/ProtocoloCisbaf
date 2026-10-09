import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const { cpf } = await params;

  // Extract query parameters
  const { searchParams } = new URL(request.url);
    const nome = searchParams.get('nome') || '';
    const sobrenome = searchParams.get('sobrenome') || '';
    const nomeFantasia = searchParams.get('nomeFantasia') || '';
    const tipoDocumento = searchParams.get('tipoDocumento') || 'CPF';

  try {
    const query = new URLSearchParams({ nome, sobrenome, nomeFantasia, tipoDocumento });
    const backendUrl = `${process.env.BACKEND_INTERNAL_URL}/user/${cpf}?${query.toString()}`;
    const res = await fetch(backendUrl, {});

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
