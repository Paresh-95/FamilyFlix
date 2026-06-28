'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

function AdminLoginForm() {
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pin }),
    });
    if (res.ok) {
      router.replace(searchParams.get('from') || '/admin');
    } else {
      setError('Wrong PIN. Try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
          Admin PIN
        </label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter admin PIN"
            autoFocus
            className="w-full border text-white text-xl rounded-xl px-5 py-4 outline-none pr-12 transition-all"
            style={{ background: '#161616', borderColor: 'rgba(255,255,255,0.12)', WebkitTextFillColor: 'white', WebkitBoxShadow: '0 0 0px 1000px #161616 inset' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(229,9,20,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-netflix-red/10 border border-netflix-red/25 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          ⚠ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !pin}
        className="w-full bg-netflix-red hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-netflix-red/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verifying…
          </span>
        ) : 'Unlock Admin'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0a0a14 50%, #0a0a0a 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-netflix-red/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-netflix-red/15 border border-netflix-red/20 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck size={28} className="text-netflix-red" />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">Admin Access</h1>
          <p className="text-white/35 text-sm mt-1">Enter your admin PIN to continue</p>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-md border border-white/8 rounded-2xl p-8 shadow-2xl">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">
            ← Back to FamilyFlix
          </a>
        </p>
      </div>
    </div>
  );
}
