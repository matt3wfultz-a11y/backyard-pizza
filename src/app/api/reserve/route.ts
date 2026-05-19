import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

    const cancelToken = uuidv4();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cancelUrl = `${baseUrl}/cancel/${cancelToken}`;
    const settingsRef = doc(db, 'settings', 'config');
    const reservationRef = doc(collection(db, 'reservations'));

    let nextDate = '';

    await runTransaction(db, async (tx) => {
      const settingsSnap = await tx.get(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : {};

      if (!settings.next_date) throw new Error('NO_DATE');

      nextDate = settings.next_date as string;
      const totalPizzas = Number(settings.total_pizzas) || 12;
      const reserved = Number(settings.reserved) || 0;
      const available = totalPizzas - reserved;

      if (qty > available) throw new Error(`INSUFFICIENT:${available}`);

      tx.set(reservationRef, {
        name: name.trim(),
        email: email?.trim() || null,
        quantity: qty,
        cancel_token: cancelToken,
        cancelled: false,
        created_at: new Date().toISOString(),
      });

      tx.set(settingsRef, { reserved: reserved + qty }, { merge: true });
    });

    if (email?.trim()) {
      try {
        await sendReservationEmail({
          to: email.trim(),
          name: name.trim(),
          quantity: qty,
          nextDate,
          cancelUrl,
        });
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, cancel_token: cancelToken, cancel_url: cancelUrl });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'NO_DATE') {
        return NextResponse.json({ error: 'No pizza day is currently scheduled.' }, { status: 400 });
      }
      if (err.message.startsWith('INSUFFICIENT:')) {
        const available = parseInt(err.message.split(':')[1], 10);
        return NextResponse.json(
          { error: `Only ${available} slot${available === 1 ? '' : 's'} remaining.` },
          { status: 400 }
        );
      }
    }
    console.error('POST /api/reserve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
