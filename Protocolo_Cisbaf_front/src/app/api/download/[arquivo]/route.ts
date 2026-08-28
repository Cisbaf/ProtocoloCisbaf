import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ arquivo: string }> }
) {
  const { arquivo } = await params;

  try {
    const formularioId = new URL(request.url).searchParams.get('formularioId');
    const caminhoDownload = formularioId
      ? `/form/${encodeURIComponent(formularioId)}/arquivos/download/${encodeURIComponent(arquivo)}`
      : `/form/arquivos/download/${encodeURIComponent(arquivo)}`;
    const urlBackend = `${process.env.BACKEND_INTERNAL_URL}${caminhoDownload}`;
    const cookieHeader = request.headers.get('cookie');

    const res = await fetch(urlBackend, {
      method: 'GET',
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!res.ok) {
      const message = res.status === 404
        ? 'Arquivo não encontrado no servidor'
        : 'Erro ao baixar o arquivo do servidor';
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const contentType = res.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = res.headers.get('Content-Disposition') || `attachment; filename="${arquivo}"`;

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', contentDisposition);

    return new NextResponse(res.body, {
      status: 200,
      headers: headers,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
