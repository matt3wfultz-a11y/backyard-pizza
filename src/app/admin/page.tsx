'use client';

import { useState, useEffect, useCallback } from 'react';

interface Settings {
  next_date: string;
  description: string;
  total_pizzas: number | string;
  contact: string;
}

interface Reservation {
  id: number;
  name: string;
  email: string | null;
  quantity: number;
  cancel_token: string;
  cancelled: number;
  created_at: string;
}

interface ReservationData {
  reservations: Reservation[];
  reserved: number;
  available: number;
  total_pizzas: number;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [storedPassword, setStoredPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    next_date: '',
    description: '',
    total_pizzas: 12,
    contact: '',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [resLoading, setResLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password');
    if (saved) {
      setStoredPassword(saved);
      setAuthed(true);
    }
  }, []);

  const loadSettings = useCallback(async (pwd: string) => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          next_date: data.next_date || '',
          description: data.description || '',
          total_pizzas: data.total_pizzas ?? 12,
          contact: data.contact || '',
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
    // pwd is used to satisfy eslint but settings are public
    void pwd;
  }, []);

  const loadReservations = useCallback(async (pwd: string) => {
    setResLoading(true);
    try {
      const res = await fetch('/api/admin/reservations', {
        headers: { 'x-admin-password': pwd },
      });
      if (res.ok) {
        const data = await res.json();
        setReservationData(data);
      }
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setResLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && storedPassword) {
      loadSettings(storedPassword);
      loadReservations(storedPassword);
    }
  }, [authed, storedPassword, loadSettings, loadReservations]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem('admin_password', password);
        setStoredPassword(password);
        setAuthed(true);
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Incorrect password.');
      }
    } catch {
      setLoginError('Could not connect. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg('');
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': storedPassword,
        },
        body: JSON.stringify({
          next_date: settings.next_date,
          description: settings.description,
          total_pizzas: String(settings.total_pizzas),
          contact: settings.contact,
        }),
      });
      if (res.ok) {
        setSettingsMsg('Settings saved!');
        setTimeout(() => setSettingsMsg(''), 3000);
      } else {
        const data = await res.json();
        setSettingsMsg(data.error || 'Failed to save settings.');
      }
    } catch {
      setSettingsMsg('Could not connect. Please try again.');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleResetReservations() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'DELETE',
        headers: { 'x-admin-password': storedPassword },
      });
      if (res.ok) {
        setResetMsg('All reservations have been cleared.');
        setResetConfirm(false);
        loadReservations(storedPassword);
        setTimeout(() => setResetMsg(''), 4000);
      }
    } catch {
      setResetMsg('Failed to reset reservations.');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_password');
    setAuthed(false);
    setStoredPassword('');
    setPassword('');
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatDateTime(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-stone-800 mb-1">Admin Login</h1>
          <p className="text-sm text-stone-400 mb-6">Backyard Pizza &bull; Admin Panel</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-brick-400 transition"
                autoFocus
              />
            </div>
            {loginError && (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-stone-800 hover:bg-stone-900 disabled:bg-stone-400 text-white font-bold py-2.5 rounded-xl transition"
            >
              {loginLoading ? 'Checking…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-stone-800 text-white py-4 px-6 shadow flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Backyard Pizza &mdash; Admin</h1>
          <p className="text-stone-400 text-xs">Manage your pizza day</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-white text-sm transition"
        >
          Logout
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Settings */}
        <section className="bg-white rounded-2xl shadow border border-stone-200 p-6">
          <h2 className="text-lg font-bold text-stone-800 mb-5">Pizza Day Settings</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="next-date">
                Next Pizza Day
              </label>
              <input
                id="next-date"
                type="date"
                value={settings.next_date}
                onChange={(e) => setSettings((s) => ({ ...s, next_date: e.target.value }))}
                className="border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-brick-400 transition"
              />
              {settings.next_date && (
                <p className="text-xs text-stone-400 mt-1">{formatDate(settings.next_date)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="description">
                Pizza Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={settings.description}
                onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))}
                placeholder="Describe today's pizzas..."
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-brick-400 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="total-pizzas">
                Total Pizzas Available
              </label>
              <input
                id="total-pizzas"
                type="number"
                min={1}
                max={200}
                value={settings.total_pizzas}
                onChange={(e) => setSettings((s) => ({ ...s, total_pizzas: e.target.value }))}
                className="border border-stone-300 rounded-lg px-3 py-2 w-28 text-stone-800 focus:outline-none focus:ring-2 focus:ring-brick-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-600 mb-1" htmlFor="contact">
                Contact Phone Number
              </label>
              <input
                id="contact"
                type="tel"
                value={settings.contact}
                onChange={(e) => setSettings((s) => ({ ...s, contact: e.target.value }))}
                placeholder="e.g. (555) 867-5309"
                className="w-full max-w-xs border border-stone-300 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-brick-400 transition"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="bg-brick-600 hover:bg-brick-700 disabled:bg-brick-300 text-white font-bold px-6 py-2.5 rounded-xl transition"
              >
                {settingsSaving ? 'Saving…' : 'Save Settings'}
              </button>
              {settingsMsg && (
                <p className={`text-sm ${settingsMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>
                  {settingsMsg}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Reservations */}
        <section className="bg-white rounded-2xl shadow border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-stone-800">Reservations</h2>
            <button
              onClick={() => loadReservations(storedPassword)}
              className="text-sm text-stone-400 hover:text-stone-600 transition"
            >
              Refresh
            </button>
          </div>

          {/* Totals */}
          {reservationData && (
            <div className="flex gap-4 mb-6">
              <div className="flex-1 bg-brick-50 border border-brick-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-brick-700">{reservationData.reserved}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Reserved</p>
              </div>
              <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{reservationData.available}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Available</p>
              </div>
              <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-stone-600">{reservationData.total_pizzas}</p>
                <p className="text-xs text-stone-500 uppercase tracking-wide">Total</p>
              </div>
            </div>
          )}

          {resLoading ? (
            <p className="text-stone-400 text-sm text-center py-8">Loading reservations…</p>
          ) : !reservationData || reservationData.reservations.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">No reservations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left">
                    <th className="pb-2 font-semibold text-stone-500 pr-4">Name</th>
                    <th className="pb-2 font-semibold text-stone-500 pr-4">Email</th>
                    <th className="pb-2 font-semibold text-stone-500 pr-4 text-center">Qty</th>
                    <th className="pb-2 font-semibold text-stone-500 pr-4">Status</th>
                    <th className="pb-2 font-semibold text-stone-500">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reservationData.reservations.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-stone-50 ${r.cancelled ? 'opacity-40' : ''}`}
                    >
                      <td className="py-2 pr-4 font-medium text-stone-800">{r.name}</td>
                      <td className="py-2 pr-4 text-stone-500">{r.email || <span className="italic text-stone-300">—</span>}</td>
                      <td className="py-2 pr-4 text-center font-bold text-stone-700">{r.quantity}</td>
                      <td className="py-2 pr-4">
                        {r.cancelled ? (
                          <span className="text-xs bg-red-50 text-red-500 border border-red-200 rounded-full px-2 py-0.5">
                            Cancelled
                          </span>
                        ) : (
                          <span className="text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-stone-400 text-xs">{formatDateTime(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reset */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex items-center gap-4 flex-wrap">
            <button
              onClick={handleResetReservations}
              className={`px-5 py-2 rounded-xl font-bold text-sm transition ${
                resetConfirm
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {resetConfirm ? 'Confirm Reset — Clear All' : 'Reset Reservations'}
            </button>
            {resetConfirm && (
              <button
                onClick={() => setResetConfirm(false)}
                className="text-sm text-stone-400 hover:text-stone-600 transition"
              >
                Cancel
              </button>
            )}
            {resetMsg && (
              <p className="text-sm text-green-600">{resetMsg}</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
