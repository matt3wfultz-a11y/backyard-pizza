import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.headers.get('x-admin-password') === adminPassword;
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

    const updates: Record<string, unknown> = {};
    if (next_date !== undefined) updates.next_date = next_date;
    if (description !== undefined) updates.description = description;
    if (total_pizzas !== undefined) updates.total_pizzas = Number(total_pizzas);
    if (contact !== undefined) updates.contact = contact;

    await setDoc(doc(db, 'settings', 'config'), updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/admin/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
