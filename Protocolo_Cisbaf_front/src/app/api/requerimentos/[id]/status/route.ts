import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');

    const putRes = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({
        finalizarArquivar: body.finalizarArquivar,
        assinatura: body.assinatura,
      }),
    });

    const data = await putRes.json().catch(() => ({ error: 'Erro ao atualizar status' }));
    return NextResponse.json(data, { status: putRes.status });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
