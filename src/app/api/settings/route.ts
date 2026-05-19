import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  next_date: '',
  description: 'Fresh wood-fired pizzas from my backyard brick oven. Made with love, local ingredients, and very hot fire.',
  total_pizzas: 12,
  contact: '',
  reserved: 0,
};

export async function GET() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'config'));
    const data = snap.exists() ? snap.data() : {};
    const settings = { ...DEFAULTS, ...data };

    const totalPizzas = Number(settings.total_pizzas) || 12;
    const reserved = Number(settings.reserved) || 0;
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
