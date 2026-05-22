import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_INTERNAL_URL}/form/cep/${cep}`);

    if (res.status === 404) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
    }

    if (!res.ok) {
      throw new Error('Erro ao buscar dados do CEP');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}