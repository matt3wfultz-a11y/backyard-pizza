import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, runTransaction, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

async function findByToken(token: string) {
  const snap = await getDocs(query(collection(db, 'reservations'), where('cancel_token', '==', token)));
  if (snap.empty) return null;
  return { docId: snap.docs[0].id, ...snap.docs[0].data() } as {
    docId: string;
    name: string;
    quantity: number;
    cancelled: boolean;
    created_at: string;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    if (!token) return NextResponse.json({ error: 'Token required.' }, { status: 400 });

    const reservation = await findByToken(token);
    if (!reservation) return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });

    return NextResponse.json({
      name: reservation.name,
      quantity: reservation.quantity,
      cancelled: reservation.cancelled,
      created_at: reservation.created_at,
    });
  } catch (err) {
    console.error('GET /api/cancel/[token] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    if (!token) return NextResponse.json({ error: 'Token required.' }, { status: 400 });

    const reservation = await findByToken(token);
    if (!reservation) return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
    if (reservation.cancelled) return NextResponse.json({ error: 'Reservation is already cancelled.' }, { status: 400 });

    const settingsRef = doc(db, 'settings', 'config');
    const reservationRef = doc(db, 'reservations', reservation.docId);

    await runTransaction(db, async (tx) => {
      const [settingsSnap, reservSnap] = await Promise.all([
        tx.get(settingsRef),
        tx.get(reservationRef),
      ]);

      if (reservSnap.data()?.cancelled) throw new Error('ALREADY_CANCELLED');

      const currentReserved = settingsSnap.exists() ? Number(settingsSnap.data().reserved) || 0 : 0;
      tx.update(reservationRef, { cancelled: true });
      if (settingsSnap.exists()) {
        tx.update(settingsRef, { reserved: Math.max(0, currentReserved - reservation.quantity) });
      }
    });

    return NextResponse.json({ success: true, name: reservation.name, quantity: reservation.quantity });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_CANCELLED') {
      return NextResponse.json({ error: 'Reservation is already cancelled.' }, { status: 400 });
    }
    console.error('POST /api/cancel/[token] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
