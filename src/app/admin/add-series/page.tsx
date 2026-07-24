'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Tv } from 'lucide-react';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import { extractDriveId } from '@/lib/drive-utils';
import Navbar from '@/components/Navbar';
import Alert from '@/components/Alert';

type TmdbResult = { id: number; title: string; year?: string; poster_path?: string };

export default function AddSeriesPage() {
  const [driveFolderId, setDriveFolderId] = useState('');
  const [query,         setQuery]         = useState('');
  const [results,       setResults]       = useState<TmdbResult[]>([]);
  const [searching,     setSearching]     = useState(false);
  const [selected,      setSelected]      = useState<TmdbResult | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/tmdb-tv-search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setSearching(false);
    }, 400);
  }, [query, selected]);

  function pick(s: TmdbResult) { setSelected(s); setQuery(s.title); setResults([]); }
  function clear() { setSelected(null); setQuery(''); setResults([]); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Please search and select a TV show first.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driveFolderId: extractDriveId(driveFolderId), tmdbId: selected.id }),
    });
    if (res.ok) {
      const s = await res.json();
      setSuccess(`"${s.title}" added! Found ${s.episode_count} episode${s.episode_count !== 1 ? 's' : ''}.`);
      setDriveFolderId(''); clear();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add series.');
    }
    setLoading(false);
  }

  const inputStyle = { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(20,184,166,0.6)');
  const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)');

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Admin
          </Link>
          <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-2">Add Content</p>
          <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Add Web Series</h1>
          <p className="text-white/30 mt-2 text-base">Search TMDB and link a Google Drive folder</p>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Search TV Show on TMDB</label>
              <div className="relative">
                <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                  placeholder="e.g. Breaking Bad, Game of Thrones…" className="w-full rounded-xl px-4 py-3.5 text-base outline-none pr-10 transition-all"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                {query && (
                  <button type="button" onClick={clear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-xl">×</button>
                )}
              </div>
              {searching && <div className="flex items-center gap-2 mt-2 text-white/30 text-xs"><span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />Searching TMDB…</div>}
              {results.length > 0 && !selected && (
                <div className="mt-2 rounded-xl border border-white/8 overflow-hidden shadow-2xl" style={{ background: '#0e0e0e' }}>
                  {results.map((r) => (
                    <button key={r.id} type="button" onClick={() => pick(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                      {r.poster_path ? <Image src={`${TMDB_IMAGE_BASE}/w92${r.poster_path}`} alt={r.title} width={28} height={42} className="rounded-lg object-cover shrink-0" /> : <div className="w-7 h-10 bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center"><Tv size={14} className="text-white/30" /></div>}
                      <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{r.title}</p>{r.year && <p className="text-white/40 text-xs">{r.year}</p>}</div>
                    </button>
                  ))}
                </div>
              )}
              {selected && (
                <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 border border-teal-500/20 bg-teal-500/5">
                  {selected.poster_path && <Image src={`${TMDB_IMAGE_BASE}/w92${selected.poster_path}`} alt={selected.title} width={28} height={42} className="rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0"><p className="text-white font-semibold text-sm truncate">{selected.title}</p>{selected.year && <p className="text-white/40 text-xs">{selected.year}</p>}</div>
                  <span className="text-teal-400 text-xs font-bold shrink-0 bg-teal-500/10 px-2 py-1 rounded-lg">✓ Selected</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Google Drive Folder URL or ID</label>
              <input type="text" value={driveFolderId} onChange={(e) => setDriveFolderId(e.target.value)}
                placeholder="Paste Drive folder URL or bare folder ID…" className="w-full rounded-xl px-4 py-3.5 text-sm outline-none font-mono transition-all"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
              <p className="text-white/20 text-xs mt-1.5">The folder should contain all episode video files</p>
            </div>
            {error   && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}
            <button type="submit" disabled={loading || !driveFolderId || !selected}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-teal-600/15">
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding Series…</span> : 'Add Web Series'}
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 space-y-4">
              <p className="text-white/50 text-sm font-semibold">How to add a web series</p>
              {[
                'Create a folder in Google Drive with all episode files.',
                'Search the TV show name and pick the correct result.',
                'Paste the folder URL or ID and click Add Web Series.',
                'Episodes are auto-detected and matched to TMDB metadata.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-white/35 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
              <p className="text-white/50 text-sm font-semibold mb-2">Episode file naming</p>
              <p className="text-white/30 text-sm leading-relaxed mb-2">Name your files for best results:</p>
              <div className="space-y-1">
                {['S01E01 - Pilot.mkv', 'S01E02 - Episode Title.mp4', 'E01 - Title.mkv', '01 - Title.mkv'].map((ex) => (
                  <p key={ex} className="text-white/20 text-xs font-mono bg-white/3 px-3 py-1.5 rounded-lg">{ex}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
