import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/form/admin`, {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    if (!res.ok) throw new Error('Erro ao buscar requerimentos');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    if (!res.ok) {
      const errText = await res.text();
      let errData;
      try {
        errData = JSON.parse(errText);
      } catch (e) {
        errData = errText;
      }
      return NextResponse.json({ error: errData }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
