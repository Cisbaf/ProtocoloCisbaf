import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie');

    // 1. Busca o estado atual no Java
    const getRes = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/${id}`, {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    if (!getRes.ok) throw new Error('Requerimento não encontrado');
    const existing = await getRes.json();

    // 2. Mapeia os dados do body do Front-end para o objeto que vai para o Java
    if (body.confirmacao !== undefined) {
      existing.confirmacao = body.confirmacao;
    }
    if (body.motivo !== undefined) {
      existing.motivo = body.motivo;
    }

    // 👇 A LINHA QUE FALTAVA 👇
    if (body.finalizarArquivar !== undefined) {
      existing.finalizarArquivar = body.finalizarArquivar;
    }

    // 3. Envia os dados atualizados para o Java
    const putRes = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(existing),
    });

    if (!putRes.ok) throw new Error('Erro ao atualizar no backend');

    const updated = await putRes.json();
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}