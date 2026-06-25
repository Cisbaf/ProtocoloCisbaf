import { NextResponse } from 'next/server';

// GET /api/requerimentos/[id]/mensagens
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/${id}/mensagens`);
    if (!res.ok) throw new Error('Erro ao buscar mensagens');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/requerimentos/[id]/mensagens
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const contentType = request.headers.get('content-type') || '';
    let res;
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/${id}/mensagens`, {
        method: 'POST',
        body: formData,
      });
    } else {
      const body = await request.json();
      res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/${id}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) throw new Error('Erro ao enviar mensagem');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
