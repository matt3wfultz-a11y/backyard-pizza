import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, doc, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.headers.get('x-admin-password') === adminPassword;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const [settingsSnap, reservSnap] = await Promise.all([
      getDoc(doc(db, 'settings', 'config')),
      getDocs(query(collection(db, 'reservations'), orderBy('created_at', 'desc'))),
    ]);

    const settings = settingsSnap.exists() ? settingsSnap.data() : {};
    const totalPizzas = Number(settings.total_pizzas) || 12;
    const reserved = Number(settings.reserved) || 0;
    const available = Math.max(0, totalPizzas - reserved);

    const reservations = reservSnap.docs.map((d, i) => {
      const data = d.data();
      return {
        id: i + 1,
        name: data.name,
        email: data.email,
        quantity: data.quantity,
        cancel_token: data.cancel_token,
        cancelled: data.cancelled ? 1 : 0,
        created_at: data.created_at,
      };
    });

    return NextResponse.json({ reservations, reserved, available, total_pizzas: totalPizzas });
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
    const reservSnap = await getDocs(collection(db, 'reservations'));
    const batch = writeBatch(db);
    reservSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.set(doc(db, 'settings', 'config'), { reserved: 0 }, { merge: true });
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/reservations error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
