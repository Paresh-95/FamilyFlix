'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Eye, EyeOff, X } from 'lucide-react';

export default function AdminPinModal({ onClose }: { onClose: () => void }) {
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

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
      onClose();
      router.push('/admin');
    } else {
      setError('Wrong PIN. Try again.');
      setPin('');
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="bg-netflix-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-5 border-b border-white/6">
            <div className="w-10 h-10 rounded-xl bg-netflix-red/15 border border-netflix-red/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-netflix-red" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Admin Access</p>
              <p className="text-white/35 text-xs mt-0.5">Enter your PIN to continue</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                placeholder="Enter admin PIN"
                className="w-full text-white text-lg rounded-xl px-4 py-3.5 pr-12 outline-none transition-all"
                style={{
                  background: '#161616',
                  border: error ? '1px solid rgba(229,9,20,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  WebkitTextFillColor: 'white',
                  WebkitBoxShadow: '0 0 0px 1000px #161616 inset',
                }}
                onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium flex items-center gap-1.5">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full bg-netflix-red hover:bg-red-700 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : 'Unlock Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
