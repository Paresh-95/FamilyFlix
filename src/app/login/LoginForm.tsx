'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace(searchParams.get('from') || '/');
    } else {
      setError('Wrong password. Try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-white/60 text-sm font-medium mb-2 uppercase tracking-wider">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter family password"
          autoFocus
          className="w-full border text-white text-xl rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-white placeholder:text-white/30 transition-all"
        style={{ background: '#161616', borderColor: 'rgba(255,255,255,0.15)', WebkitTextFillColor: 'white', WebkitBoxShadow: '0 0 0px 1000px #161616 inset' }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-netflix-red/15 border border-netflix-red/30 text-netflix-red px-4 py-3 rounded-xl text-sm font-medium">
          <span>⚠</span> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full bg-netflix-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-white shadow-lg shadow-netflix-red/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in…
          </span>
        ) : (
          '▶  Watch Movies'
        )}
      </button>
    </form>
  );
}
