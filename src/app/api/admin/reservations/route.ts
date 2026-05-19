import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const header = req.headers.get('x-admin-password');
  return header === adminPassword;
}

interface Reservation {
  id: number;
  name: string;
  email: string | null;
  quantity: number;
  cancel_token: string;
  cancelled: number;
  created_at: string;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDb();
    const reservations = db
      .prepare('SELECT id, name, email, quantity, cancel_token, cancelled, created_at FROM reservations ORDER BY created_at DESC')
      .all() as Reservation[];

    const totalRow = db
      .prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM reservations WHERE cancelled = 0')
      .get() as { total: number };

    const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    for (const row of settingsRows) {
      settingsMap[row.key] = row.value;
    }

    const totalPizzas = parseInt(settingsMap.total_pizzas || '12', 10);
    const reserved = totalRow.total;
    const available = Math.max(0, totalPizzas - reserved);

    return NextResponse.json({
      reservations,
      reserved,
      available,
      total_pizzas: totalPizzas,
    });
  } catch (err) {
    console.error('GET /api/admin/reservations error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDb();
    db.prepare('DELETE FROM reservations').run();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/reservations error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
