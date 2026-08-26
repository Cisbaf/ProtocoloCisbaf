import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('loginToken');
  if (!session?.value) {
    return NextResponse.json({ isAuthenticated: false });
  }

  try {
    const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/admin/me`, {
      headers: { Cookie: `loginToken=${session.value}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ isAuthenticated: false }, { status: res.status });
    }

    const admin = await res.json();
    return NextResponse.json({ isAuthenticated: true, admin });
  } catch {
    return NextResponse.json({ isAuthenticated: false }, { status: 500 });
  }
}
