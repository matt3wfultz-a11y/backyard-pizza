import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();

    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    const reservedRow = db
      .prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM reservations WHERE cancelled = 0')
      .get() as { total: number };

    const totalPizzas = parseInt(settings.total_pizzas || '12', 10);
    const reserved = reservedRow.total;
    const available = Math.max(0, totalPizzas - reserved);

    return NextResponse.json({
      next_date: settings.next_date || '',
      description: settings.description || '',
      total_pizzas: totalPizzas,
      contact: settings.contact || '',
      reserved,
      available,
    });
  } catch (err) {
    console.error('GET /api/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
