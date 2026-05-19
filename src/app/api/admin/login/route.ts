import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as { password: string };

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.warn('ADMIN_PASSWORD env var is not set!');
      return NextResponse.json({ error: 'Admin not configured.' }, { status: 500 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
