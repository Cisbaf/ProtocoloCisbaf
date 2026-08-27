import { NextResponse } from 'next/server';

const ERROR_PREVIEW_LIMIT = 1000;

function createRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readResponseBody(res: Response) {
  const text = await res.text();

  try {
    return { text, data: JSON.parse(text) };
  } catch {
    return { text, data: text };
  }
}

function logRequestError(requestId: string, message: string, details: Record<string, unknown>) {
  console.error(`[requerimentos:${requestId}] ${message}`, details);
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const cookieHeader = request.headers.get('cookie');
    const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/admin`, {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    const { text, data } = await readResponseBody(res);

    if (!res.ok) {
      logRequestError(requestId, 'Falha ao buscar requerimentos no backend', {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        bodyPreview: text.slice(0, ERROR_PREVIEW_LIMIT),
      });

      return NextResponse.json(
        { error: 'Erro ao buscar requerimentos', requestId },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    logRequestError(requestId, 'Erro inesperado ao buscar requerimentos', {
      error: errorMessage,
    });

    return NextResponse.json({ error: errorMessage, requestId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const formData = await request.formData();

    // The backend expects "formulario" (JSON string) and "arquivo" (file)
    const formulario = formData.get('formulario');
    const arquivos = formData.getAll('arquivos');

    const backendFormData = new FormData();
    if (formulario) backendFormData.append('formulario', formulario);
    arquivos.forEach((arq) => backendFormData.append('arquivos', arq));

    const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form`, {
      method: 'POST',
      body: backendFormData,
    });

    const { text, data } = await readResponseBody(res);

    if (!res.ok) {
      const formularioJson = typeof formulario === 'string' ? formulario : null;
      let formularioResumo: Record<string, unknown> | null = null;

      if (formularioJson) {
        try {
          const parsed = JSON.parse(formularioJson);
          formularioResumo = {
            cpf: parsed?.usuario?.cpf,
            nome: parsed?.usuario?.nome,
            sobrenome: parsed?.usuario?.sobrenome,
            email: parsed?.usuario?.email,
            assunto: parsed?.assunto,
            unidade: parsed?.unidade,
          };
        } catch {
          formularioResumo = { formularioInvalido: true };
        }
      }

      logRequestError(requestId, 'Falha ao enviar requerimento ao backend', {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        backendUrl: process.env.BACKEND_INTERNAL_URL,
        userAgent: request.headers.get('user-agent'),
        forwardedFor: request.headers.get('x-forwarded-for'),
        formulario: formularioResumo,
        arquivos: arquivos.map((arquivo) => arquivo instanceof File ? {
          name: arquivo.name,
          size: arquivo.size,
          type: arquivo.type,
        } : { type: typeof arquivo }),
        bodyPreview: text.slice(0, ERROR_PREVIEW_LIMIT),
      });

      const backendError = data && typeof data === 'object' && !Array.isArray(data) && 'error' in data
        ? data.error
        : data;
      return NextResponse.json({ error: backendError, requestId }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    logRequestError(requestId, 'Erro inesperado ao enviar requerimento', {
      error: errorMessage,
      backendUrl: process.env.BACKEND_INTERNAL_URL,
      userAgent: request.headers.get('user-agent'),
      forwardedFor: request.headers.get('x-forwarded-for'),
    });

    return NextResponse.json({ error: errorMessage, requestId }, { status: 500 });
  }
}
