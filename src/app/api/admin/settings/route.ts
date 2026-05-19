import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const header = req.headers.get('x-admin-password');
  return header === adminPassword;
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { next_date, description, total_pizzas, contact } = body as {
      next_date?: string;
      description?: string;
      total_pizzas?: string | number;
      contact?: string;
    };

    const db = getDb();
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );

    if (next_date !== undefined) upsert.run('next_date', next_date);
    if (description !== undefined) upsert.run('description', description);
    if (total_pizzas !== undefined) upsert.run('total_pizzas', String(total_pizzas));
    if (contact !== undefined) upsert.run('contact', contact);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/admin/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
