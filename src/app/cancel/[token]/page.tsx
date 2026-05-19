'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Reservation {
  name: string;
  quantity: number;
  cancelled: number;
  created_at: string;
}

type PageState = 'loading' | 'found' | 'already_cancelled' | 'not_found' | 'cancelled' | 'error';

export default function CancelPage() {
  const params = useParams();
  const token = params?.token as string;

  const [pageState, setPageState] = useState<PageState>('loading');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token) {
      setPageState('not_found');
      return;
    }

    fetch(`/api/cancel/${token}`)
      .then((res) => {
        if (res.status === 404) {
          setPageState('not_found');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setPageState('not_found');
        } else {
          setReservation(data);
          setPageState(data.cancelled ? 'already_cancelled' : 'found');
        }
      })
      .catch(() => {
        setPageState('error');
      });
  }, [token]);

  async function handleCancel() {
    if (!token) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/cancel/${token}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPageState('cancelled');
      } else if (data.error?.includes('already cancelled')) {
        setPageState('already_cancelled');
      } else {
        setPageState('error');
      }
    } catch {
      setPageState('error');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brick-50 to-ember-50">
      <header className="bg-brick-800 text-brick-50 py-6 px-4 shadow-lg">
        <div className="max-w-xl mx-auto text-center">
          <Link href="/" className="text-2xl font-bold tracking-wide text-brick-100 hover:text-white transition">
            Backyard Pizza
          </Link>
        </div>
      </header>
      <div className="h-2 bg-gradient-to-r from-brick-600 via-ember-400 to-brick-600" />

      <main className="max-w-md mx-auto px-4 py-12">
        {pageState === 'loading' && (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-4 animate-pulse">🔥</div>
            <p>Looking up your reservation…</p>
          </div>
        )}

        {pageState === 'found' && reservation && (
          <div className="bg-white rounded-2xl shadow-md border border-brick-200 p-8 text-center">
            <div className="text-4xl mb-4">🍕</div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Cancel Reservation</h1>
            <p className="text-stone-500 mb-6">
              Are you sure you want to cancel{' '}
              <strong className="text-stone-700">{reservation.name}</strong>&apos;s reservation for{' '}
              <strong className="text-stone-700">
                {reservation.quantity} pizza{reservation.quantity > 1 ? 's' : ''}
              </strong>
              ?
            </p>
            <p className="text-xs text-stone-400 mb-6">
              This will free up {reservation.quantity} slot{reservation.quantity > 1 ? 's' : ''} for others.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition text-base"
            >
              {cancelling ? 'Cancelling…' : 'Yes, cancel my reservation'}
            </button>
            <Link
              href="/"
              className="block mt-4 text-sm text-stone-400 hover:text-stone-600 transition"
            >
              Never mind, keep it
            </Link>
          </div>
        )}

        {pageState === 'cancelled' && (
          <div className="bg-white rounded-2xl shadow-md border border-brick-200 p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">Reservation Cancelled</h1>
            <p className="text-stone-500 mb-6">
              Your reservation has been successfully cancelled. Your slot is now available for someone else.
            </p>
            <Link
              href="/"
              className="inline-block bg-brick-600 hover:bg-brick-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Back to Backyard Pizza
            </Link>
          </div>
        )}

        {pageState === 'already_cancelled' && (
          <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-8 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h1 className="text-2xl font-bold text-stone-700 mb-2">Already Cancelled</h1>
            <p className="text-stone-500 mb-6">
              This reservation has already been cancelled.
            </p>
            <Link
              href="/"
              className="inline-block bg-brick-600 hover:bg-brick-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Back to Backyard Pizza
            </Link>
          </div>
        )}

        {pageState === 'not_found' && (
          <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-stone-700 mb-2">Reservation Not Found</h1>
            <p className="text-stone-500 mb-6">
              We couldn&apos;t find a reservation linked to this cancel link. It may have already been removed.
            </p>
            <Link
              href="/"
              className="inline-block bg-brick-600 hover:bg-brick-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Back to Backyard Pizza
            </Link>
          </div>
        )}

        {pageState === 'error' && (
          <div className="bg-white rounded-2xl shadow-md border border-red-200 p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">Something went wrong</h1>
            <p className="text-stone-500 mb-6">
              We couldn&apos;t process your cancellation. Please try again or call us directly.
            </p>
            <Link
              href="/"
              className="inline-block bg-brick-600 hover:bg-brick-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Back to Backyard Pizza
            </Link>
          </div>
        )}
      </main>

      <footer className="mt-10 pb-6 text-center text-xs text-stone-400">
        <p>Fired with love &bull; Your neighborhood brick oven</p>
      </footer>
    </div>
  );
}
