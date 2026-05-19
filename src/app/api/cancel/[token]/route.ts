import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token required.' }, { status: 400 });
    }

    const db = getDb();
    const reservation = db
      .prepare('SELECT id, name, quantity, cancelled FROM reservations WHERE cancel_token = ?')
      .get(token) as { id: number; name: string; quantity: number; cancelled: number } | undefined;

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    if (reservation.cancelled) {
      return NextResponse.json({ error: 'Reservation is already cancelled.' }, { status: 400 });
    }

    db.prepare('UPDATE reservations SET cancelled = 1 WHERE cancel_token = ?').run(token);

    return NextResponse.json({
      success: true,
      name: reservation.name,
      quantity: reservation.quantity,
    });
  } catch (err) {
    console.error('POST /api/cancel/[token] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token required.' }, { status: 400 });
    }

    const db = getDb();
    const reservation = db
      .prepare('SELECT name, quantity, cancelled, created_at FROM reservations WHERE cancel_token = ?')
      .get(token) as { name: string; quantity: number; cancelled: number; created_at: string } | undefined;

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (err) {
    console.error('GET /api/cancel/[token] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
