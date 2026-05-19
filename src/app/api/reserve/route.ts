import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import getDb from '@/lib/db';
import { sendReservationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, quantity } = body as { name: string; email?: string; quantity: number };

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const qty = parseInt(String(quantity), 10);
    if (!qty || qty < 1 || qty > 4) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 4.' }, { status: 400 });
    }

    const db = getDb();

    // Check availability
    const settings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settingsMap: Record<string, string> = {};
    for (const row of settings) {
      settingsMap[row.key] = row.value;
    }

    if (!settingsMap.next_date) {
      return NextResponse.json({ error: 'No pizza day is currently scheduled.' }, { status: 400 });
    }

    const totalPizzas = parseInt(settingsMap.total_pizzas || '12', 10);
    const reservedRow = db
      .prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM reservations WHERE cancelled = 0')
      .get() as { total: number };
    const available = totalPizzas - reservedRow.total;

    if (qty > available) {
      return NextResponse.json(
        { error: `Only ${available} slot${available === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      );
    }

    const cancelToken = uuidv4();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cancelUrl = `${baseUrl}/cancel/${cancelToken}`;

    db.prepare(
      'INSERT INTO reservations (name, email, quantity, cancel_token) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), email?.trim() || null, qty, cancelToken);

    // Send email if email provided
    if (email && email.trim()) {
      try {
        await sendReservationEmail({
          to: email.trim(),
          name: name.trim(),
          quantity: qty,
          nextDate: settingsMap.next_date,
          cancelUrl,
        });
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        // Don't fail the reservation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      cancel_token: cancelToken,
      cancel_url: cancelUrl,
    });
  } catch (err) {
    console.error('POST /api/reserve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
