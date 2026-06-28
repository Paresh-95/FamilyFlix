'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, Clapperboard, Images, ArrowRight } from 'lucide-react';
import { Movie } from '@/lib/supabase';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';

type TmdbResult = { id: number; title: string; year?: string; poster_path?: string };

function extractDriveId(input: string): string {
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]{10,})/,
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /\/open\?id=([a-zA-Z0-9_-]{10,})/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return input.trim();
}

export default function AdminPage() {
  const [movies,      setMovies]      = useState<Movie[]>([]);
  const [driveFileId, setDriveFileId] = useState('');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<TmdbResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [selected,    setSelected]    = useState<TmdbResult | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMovies = useCallback(async () => {
    const res = await fetch('/api/movies');
    setMovies(await res.json());
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/tmdb-search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setSearching(false);
    }, 400);
  }, [query, selected]);

  function pickMovie(movie: TmdbResult) {
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
  }

  function clearSelection() {
    setSelected(null);
    setQuery('');
    setResults([]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Please search and select a movie first.'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driveFileId, tmdbId: selected.id }),
    });
    if (res.ok) {
      const movie = await res.json();
      setSuccess(`"${movie.title}" added to your library!`);
      setDriveFileId('');
      clearSelection();
      fetchMovies();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add movie.');
    }
    setLoading(false);
  }

  const cards = [
    { href: '/admin/sync',   icon: RefreshCw,   label: 'Sync Drive',   desc: 'Auto-detect & add new movies', gradient: 'from-violet-600/20 to-violet-900/5', border: 'border-violet-500/20', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
    { href: '/admin/movies', icon: Clapperboard, label: 'Movies Table', desc: `${movies.length} movies in library`,  gradient: 'from-blue-600/20 to-blue-900/5',   border: 'border-blue-500/20',   iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-400'   },
    { href: '/admin/albums', icon: Images,       label: 'Photo Albums', desc: 'Manage Drive photo folders',  gradient: 'from-amber-600/20 to-amber-900/5', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-red/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-netflix-red/4 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <p className="text-netflix-red text-xs font-bold uppercase tracking-widest mb-2">Dashboard</p>
          <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Admin Panel</h1>
          <p className="text-white/30 mt-2 text-base">{movies.length} movie{movies.length !== 1 ? 's' : ''} in your library</p>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 space-y-10 max-w-5xl mx-auto">

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(({ href, icon: Icon, label, desc, gradient, border, iconBg, iconColor }) => (
            <Link key={href} href={href}
              className={`group flex items-center gap-4 bg-gradient-to-br ${gradient} border ${border} rounded-2xl px-5 py-5 transition-all duration-200 hover:scale-[1.02] hover:brightness-110`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-white/40 text-xs mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs uppercase tracking-widest font-semibold">Add Manually</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Two-column: form + tips */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <form onSubmit={handleAdd} className="space-y-5">
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Search Movie on TMDB</label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                  placeholder="e.g. Inception, Interstellar…"
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none pr-10 transition-all"
                  style={{ background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(229,9,20,0.6)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                {query && (
                  <button type="button" onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-xl">
                    ×
                  </button>
                )}
              </div>

              {searching && (
                <div className="flex items-center gap-2 mt-2 text-white/30 text-xs">
                  <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                  Searching TMDB…
                </div>
              )}

              {results.length > 0 && !selected && (
                <div className="mt-2 rounded-xl border border-white/8 overflow-hidden shadow-2xl" style={{ background: '#0e0e0e' }}>
                  {results.map((r) => (
                    <button key={r.id} type="button" onClick={() => pickMovie(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      {r.poster_path ? (
                        <Image src={`${TMDB_IMAGE_BASE}/w92${r.poster_path}`} alt={r.title} width={28} height={42} className="rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-10 bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center"><Clapperboard size={14} className="text-white/30" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{r.title}</p>
                        {r.year && <p className="text-white/40 text-xs">{r.year}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 border border-netflix-red/20 bg-netflix-red/5">
                  {selected.poster_path && (
                    <Image src={`${TMDB_IMAGE_BASE}/w92${selected.poster_path}`} alt={selected.title} width={28} height={42} className="rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{selected.title}</p>
                    {selected.year && <p className="text-white/40 text-xs">{selected.year}</p>}
                  </div>
                  <span className="text-netflix-red text-xs font-bold shrink-0 bg-netflix-red/10 px-2 py-1 rounded-lg">✓ Selected</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Google Drive URL or File ID</label>
              <input
                type="text"
                value={driveFileId}
                onChange={(e) => setDriveFileId(extractDriveId(e.target.value))}
                placeholder="Paste Drive URL or bare ID…"
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none font-mono transition-all"
                style={{ background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(229,9,20,0.6)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                required
              />
              <p className="text-white/20 text-xs mt-1.5">Full URL or bare file ID — both work</p>
            </div>

            {error   && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <button
              type="submit"
              disabled={loading || !driveFileId || !selected}
              className="w-full bg-netflix-red hover:bg-red-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-netflix-red/15"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding…
                </span>
              ) : 'Add to Library'}
            </button>
          </form>

          {/* Tips */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 space-y-4">
              <p className="text-white/50 text-sm font-semibold">How to add a movie</p>
              {[
                'Search the movie name and pick the correct result from TMDB.',
                'Copy the Google Drive file URL or bare file ID.',
                'Paste it and click Add to Library.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-netflix-red/15 text-netflix-red text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-white/35 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
              <p className="text-white/50 text-sm font-semibold mb-2">Prefer automatic?</p>
              <p className="text-white/30 text-sm leading-relaxed">
                Use{' '}
                <Link href="/admin/sync" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Sync Drive</Link>
                {' '}to auto-detect all new movies in your Drive folder without manual entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 border px-4 py-3 rounded-xl text-sm font-medium ${
      type === 'error' ? 'bg-netflix-red/8 border-netflix-red/25 text-red-400' : 'bg-emerald-500/8 border-emerald-500/25 text-emerald-400'
    }`}>
      {type === 'error' ? '⚠' : '✓'} {children}
    </div>
  );
}
