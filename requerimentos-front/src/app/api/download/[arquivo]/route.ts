import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ arquivo: string }> }
) {
  const { arquivo } = await params;

  try {
    const urlBackend = `${process.env.BACKEND_INTERNAL_URL}/form/arquivos/download/${encodeURIComponent(arquivo)}`;
    const cookieHeader = request.headers.get('cookie');

    const res = await fetch(urlBackend, {
      method: 'GET',
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (res.status === 404) {
      return NextResponse.json({ error: 'Arquivo não encontrado no servidor' }, { status: 404 });
    }

    if (!res.ok) {
      throw new Error('Erro ao baixar o arquivo do servidor');
    }

    const blob = await res.blob();
    const contentType = res.headers.get('Content-Type') || 'application/octet-stream';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${arquivo}"`);

    return new NextResponse(blob, {
      status: 200,
      headers: headers,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}