import { NextResponse } from 'next/server';

// 1. Força a rota a ser sempre renderizada dinamicamente (mata o cache de rota)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');
  const unidade = searchParams.get('unidade') || 'all';

  if (!tipo || !inicio || !fim) {
    return NextResponse.json(
      { error: 'Parâmetros tipo, inicio e fim são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `${process.env.BACKEND_INTERNAL_URL}/form/graficos?tipo=${tipo}&inicio=${inicio}&fim=${fim}&unidade=${unidade}`;

    const res = await fetch(backendUrl, {
      // 2. Avisa o Node.js interno para não fazer cache desta requisição ao Spring Boot
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Erro do backend: ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}