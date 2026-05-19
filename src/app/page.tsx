'use client';

import { useState, useEffect } from 'react';

interface Settings {
  next_date: string;
  description: string;
  total_pizzas: number;
  contact: string;
  reserved: number;
  available: number;
}

interface Confirmation {
  cancel_token: string;
  cancel_url: string;
  name: string;
  quantity: number;
}

export default function HomePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleReserve(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setConfirmation({ cancel_token: data.cancel_token, cancel_url: data.cancel_url, name: name.trim(), quantity });
        setSettings((prev) =>
          prev
            ? { ...prev, reserved: prev.reserved + quantity, available: prev.available - quantity }
            : prev
        );
      }
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const maxQty = settings ? Math.min(4, settings.available) : 4;

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brick-50 to-ember-50">
      {/* Header */}
      <header className="bg-brick-800 text-brick-50 py-8 px-4 shadow-lg">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-2">🍕</div>
          <h1 className="text-4xl font-serif font-bold tracking-wide text-brick-100">
            Backyard Pizza
          </h1>
          <p className="mt-2 text-brick-300 text-sm tracking-widest uppercase">
            Wood-fired &middot; Neighborhood &middot; Made with love
          </p>
        </div>
      </header>

      {/* Flame divider */}
      <div className="h-2 bg-gradient-to-r from-brick-600 via-ember-400 to-brick-600" />

      <main className="max-w-xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center text-stone-400 py-20">
            <div className="text-5xl mb-4 animate-pulse">🔥</div>
            <p>Stoking the fire&hellip;</p>
          </div>
        ) : !settings ? (
          <div className="text-center text-stone-500 py-20">
            <p>Could not load pizza info. Please refresh the page.</p>
          </div>
        ) : (
          <>
            {/* Pizza info card */}
            <div className="bg-white rounded-2xl shadow-md border border-brick-200 p-6 mb-8">
              {settings.next_date ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-stone-400 font-sans">Next Pizza Day</p>
                      <p className="text-xl font-bold text-brick-800">{formatDate(settings.next_date)}</p>
                    </div>
                  </div>
                  <p className="text-stone-600 leading-relaxed border-t border-brick-100 pt-4 mt-3">
                    {settings.description}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 bg-brick-50 rounded-xl p-3 text-center border border-brick-100">
                      <p className="text-2xl font-bold text-brick-700">{settings.available}</p>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Slots left</p>
                    </div>
                    <div className="flex-1 bg-stone-50 rounded-xl p-3 text-center border border-stone-200">
                      <p className="text-2xl font-bold text-stone-600">{settings.reserved}</p>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Reserved</p>
                    </div>
                    <div className="flex-1 bg-ember-50 rounded-xl p-3 text-center border border-ember-200">
                      <p className="text-2xl font-bold text-ember-700">{settings.total_pizzas}</p>
                      <p className="text-xs text-stone-500 uppercase tracking-wide">Total</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🧱</div>
                  <h2 className="text-xl font-bold text-stone-600 mb-2">Check back soon!</h2>
                  <p className="text-stone-400 text-sm">The next pizza day hasn&apos;t been announced yet. Follow along and we&apos;ll have dates up shortly.</p>
                </div>
              )}
            </div>

            {/* Reservation section */}
            {settings.next_date && (
              <>
                {confirmation ? (
                  <div className="bg-white rounded-2xl shadow-md border border-brick-200 p-6 mb-8">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">🎉</div>
                      <h2 className="text-2xl font-bold text-brick-700">You&apos;re in!</h2>
                      <p className="text-stone-600 mt-1">
                        {confirmation.name}, your reservation for{' '}
                        <strong>{confirmation.quantity} pizza{confirmation.quantity > 1 ? 's' : ''}</strong> is confirmed.
                      </p>
                    </div>
                    <div className="bg-brick-50 border border-brick-200 rounded-xl p-4 mt-4">
                      <p className="text-sm text-stone-600 mb-2 font-semibold">Your cancel link (bookmark this!):</p>
                      <a
                        href={confirmation.cancel_url}
                        className="text-brick-700 underline break-all text-sm"
                      >
                        {confirmation.cancel_url}
                      </a>
                      <p className="text-xs text-stone-400 mt-2">
                        You can use this link any time to cancel your reservation. No account needed.
                      </p>
                    </div>
                    {settings.contact && (
                      <div className="mt-4 text-center text-sm text-stone-500">
                        Questions? Call: <span className="font-semibold text-stone-700">{settings.contact}</span>
                      </div>
                    )}
                  </div>
                ) : settings.available <= 0 ? (
                  <div className="bg-white rounded-2xl shadow-md border border-brick-200 p-6 mb-8 text-center">
                    <div className="text-4xl mb-2">😔</div>
                    <h2 className="text-2xl font-bold text-stone-700">Sold Out</h2>
                    <p className="text-stone-500 mt-2">All pizzas for this session have been reserved. Check back next time!</p>
                    {settings.contact && (
                      <p className="mt-4 text-sm text-stone-500">
                        Want to be on a waitlist? Call: <span className="font-semibold text-stone-700">{settings.contact}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-md border border-brick-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-brick-800 mb-1">Reserve your pizzas</h2>
                    <p className="text-sm text-stone-400 mb-5">Secure your spot before they&apos;re gone!</p>

                    <form onSubmit={handleReserve} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="name">
                          Your name <span className="text-brick-500">*</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Maria Rossi"
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-brick-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="email">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com (optional - for newsletter & cancel link)"
                          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-brick-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="quantity">
                          How many pizzas?
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="w-9 h-9 rounded-full bg-brick-100 text-brick-700 font-bold text-lg hover:bg-brick-200 transition flex items-center justify-center"
                            aria-label="Decrease"
                          >
                            -
                          </button>
                          <span className="text-2xl font-bold text-brick-800 w-8 text-center">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                            className="w-9 h-9 rounded-full bg-brick-100 text-brick-700 font-bold text-lg hover:bg-brick-200 transition flex items-center justify-center"
                            aria-label="Increase"
                          >
                            +
                          </button>
                          <span className="text-xs text-stone-400">(max {maxQty})</span>
                        </div>
                      </div>

                      {error && (
                        <p className="text-brick-600 bg-brick-50 border border-brick-200 rounded-lg px-3 py-2 text-sm">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-brick-600 hover:bg-brick-700 disabled:bg-brick-300 text-white font-bold py-3 rounded-xl transition text-lg shadow"
                      >
                        {submitting ? 'Reserving…' : 'Reserve my spot 🍕'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* Contact */}
            {settings.contact && !confirmation && (
              <div className="text-center text-sm text-stone-500">
                Questions? Give us a ring:{' '}
                <a href={`tel:${settings.contact}`} className="font-semibold text-stone-700 hover:text-brick-600 transition">
                  {settings.contact}
                </a>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-10 pb-6 text-center text-xs text-stone-400">
        <p>Fired with love &bull; Your neighborhood brick oven</p>
      </footer>
    </div>
  );
}
