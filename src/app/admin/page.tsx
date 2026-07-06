'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, Clapperboard, Images, ArrowRight, Tv } from 'lucide-react';
import { Movie, Series } from '@/lib/supabase';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import { extractDriveId } from '@/lib/drive-utils';
import Navbar from '@/components/Navbar';
import Alert from '@/components/Alert';

type TmdbResult = { id: number; title: string; year?: string; poster_path?: string };

export default function AdminPage() {
  const [movies,      setMovies]      = useState<Movie[]>([]);
  const [seriesList,  setSeriesList]  = useState<Series[]>([]);

  // Movie add form state
  const [driveFileId, setDriveFileId] = useState('');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<TmdbResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [selected,    setSelected]    = useState<TmdbResult | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Series add form state
  const [driveFolderId,   setDriveFolderId]   = useState('');
  const [seriesQuery,     setSeriesQuery]     = useState('');
  const [seriesResults,   setSeriesResults]   = useState<TmdbResult[]>([]);
  const [seriesSearching, setSeriesSearching] = useState(false);
  const [seriesSelected,  setSeriesSelected]  = useState<TmdbResult | null>(null);
  const [seriesLoading,   setSeriesLoading]   = useState(false);
  const [seriesError,     setSeriesError]     = useState('');
  const [seriesSuccess,   setSeriesSuccess]   = useState('');
  const seriesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tab, setTab] = useState<'movie' | 'series'>('movie');

  const fetchMovies  = useCallback(async () => {
    const res = await fetch('/api/movies');
    setMovies(await res.json());
  }, []);

  const fetchSeries  = useCallback(async () => {
    const res = await fetch('/api/series');
    setSeriesList(await res.json());
  }, []);

  useEffect(() => { fetchMovies(); fetchSeries(); }, [fetchMovies, fetchSeries]);

  // Movie TMDB search debounce
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

  // Series TMDB search debounce
  useEffect(() => {
    if (seriesSelected) return;
    if (seriesDebounceRef.current) clearTimeout(seriesDebounceRef.current);
    if (!seriesQuery.trim()) { setSeriesResults([]); return; }
    seriesDebounceRef.current = setTimeout(async () => {
      setSeriesSearching(true);
      const res = await fetch(`/api/tmdb-tv-search?q=${encodeURIComponent(seriesQuery)}`);
      setSeriesResults(await res.json());
      setSeriesSearching(false);
    }, 400);
  }, [seriesQuery, seriesSelected]);

  function pickMovie(movie: TmdbResult) { setSelected(movie); setQuery(movie.title); setResults([]); }
  function clearMovieSelection() { setSelected(null); setQuery(''); setResults([]); }
  function pickSeries(s: TmdbResult) { setSeriesSelected(s); setSeriesQuery(s.title); setSeriesResults([]); }
  function clearSeriesSelection() { setSeriesSelected(null); setSeriesQuery(''); setSeriesResults([]); }

  async function handleAddMovie(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError('Please search and select a movie first.'); return; }
    setLoading(true); setError(''); setSuccess('');
    const res = await fetch('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driveFileId, tmdbId: selected.id }),
    });
    if (res.ok) {
      const movie = await res.json();
      setSuccess(`"${movie.title}" added to your library!`);
      setDriveFileId(''); clearMovieSelection(); fetchMovies();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add movie.');
    }
    setLoading(false);
  }

  async function handleAddSeries(e: React.FormEvent) {
    e.preventDefault();
    if (!seriesSelected) { setSeriesError('Please search and select a TV show first.'); return; }
    setSeriesLoading(true); setSeriesError(''); setSeriesSuccess('');
    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driveFolderId: extractDriveId(driveFolderId), tmdbId: seriesSelected.id }),
    });
    if (res.ok) {
      const s = await res.json();
      setSeriesSuccess(`"${s.title}" added! Found ${s.episode_count} episode${s.episode_count !== 1 ? 's' : ''}.`);
      setDriveFolderId(''); clearSeriesSelection(); fetchSeries();
    } else {
      const data = await res.json();
      setSeriesError(data.error || 'Failed to add series.');
    }
    setSeriesLoading(false);
  }

  const cards = [
    { href: '/admin/sync',   icon: RefreshCw,   label: 'Sync Drive',     desc: 'Auto-detect & add new movies',      gradient: 'from-violet-600/20 to-violet-900/5', border: 'border-violet-500/20', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
    { href: '/admin/movies', icon: Clapperboard, label: 'Manage Movies',  desc: `${movies.length} movies in library`, gradient: 'from-blue-600/20 to-blue-900/5',   border: 'border-blue-500/20',   iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-400'   },
    { href: '/admin/series', icon: Tv,           label: 'Manage Series',  desc: `${seriesList.length} series in library`, gradient: 'from-teal-600/20 to-teal-900/5', border: 'border-teal-500/20', iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400' },
    { href: '/admin/albums', icon: Images,       label: 'Photo Albums',   desc: 'Manage Drive photo folders',        gradient: 'from-amber-600/20 to-amber-900/5', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  ];

  const inputStyle = { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(229,9,20,0.6)');
  const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)');

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
          <p className="text-white/30 mt-2 text-base">
            {movies.length} movie{movies.length !== 1 ? 's' : ''} · {seriesList.length} series in your library
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 space-y-10 max-w-5xl mx-auto">

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cards.map(({ href, icon: Icon, label, desc, gradient, border, iconBg, iconColor }) => (
            <Link key={href} href={href}
              className={`group flex items-center gap-3 bg-gradient-to-br ${gradient} border ${border} rounded-2xl px-4 py-4 transition-all duration-200 hover:scale-[1.02] hover:brightness-110`}
            >
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-white/40 text-xs mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs uppercase tracking-widest font-semibold">Add Manually</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Tab selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('movie')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'movie' ? 'bg-white text-black' : 'bg-white/8 text-white/60 hover:bg-white/15 border border-white/10'}`}
          >
            🎬 Movie
          </button>
          <button
            onClick={() => setTab('series')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'series' ? 'bg-white text-black' : 'bg-white/8 text-white/60 hover:bg-white/15 border border-white/10'}`}
          >
            📺 Web Series
          </button>
        </div>

        {/* Movie form */}
        {tab === 'movie' && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <form onSubmit={handleAddMovie} className="space-y-5">
              <div>
                <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Search Movie on TMDB</label>
                <div className="relative">
                  <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                    placeholder="e.g. Inception, Interstellar…" className="w-full rounded-xl px-4 py-3.5 text-base outline-none pr-10 transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                  {query && (
                    <button type="button" onClick={clearMovieSelection}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-xl">×</button>
                  )}
                </div>
                {searching && <div className="flex items-center gap-2 mt-2 text-white/30 text-xs"><span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />Searching TMDB…</div>}
                {results.length > 0 && !selected && (
                  <div className="mt-2 rounded-xl border border-white/8 overflow-hidden shadow-2xl" style={{ background: '#0e0e0e' }}>
                    {results.map((r) => (
                      <button key={r.id} type="button" onClick={() => pickMovie(r)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                        {r.poster_path ? <Image src={`${TMDB_IMAGE_BASE}/w92${r.poster_path}`} alt={r.title} width={28} height={42} className="rounded-lg object-cover shrink-0" /> : <div className="w-7 h-10 bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center"><Clapperboard size={14} className="text-white/30" /></div>}
                        <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{r.title}</p>{r.year && <p className="text-white/40 text-xs">{r.year}</p>}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selected && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 border border-netflix-red/20 bg-netflix-red/5">
                    {selected.poster_path && <Image src={`${TMDB_IMAGE_BASE}/w92${selected.poster_path}`} alt={selected.title} width={28} height={42} className="rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0"><p className="text-white font-semibold text-sm truncate">{selected.title}</p>{selected.year && <p className="text-white/40 text-xs">{selected.year}</p>}</div>
                    <span className="text-netflix-red text-xs font-bold shrink-0 bg-netflix-red/10 px-2 py-1 rounded-lg">✓ Selected</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Google Drive File URL or ID</label>
                <input type="text" value={driveFileId} onChange={(e) => setDriveFileId(extractDriveId(e.target.value))}
                  placeholder="Paste Drive URL or bare file ID…" className="w-full rounded-xl px-4 py-3.5 text-sm outline-none font-mono transition-all"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                <p className="text-white/20 text-xs mt-1.5">Full URL or bare file ID — both work</p>
              </div>
              {error   && <Alert type="error">{error}</Alert>}
              {success && <Alert type="success">{success}</Alert>}
              <button type="submit" disabled={loading || !driveFileId || !selected}
                className="w-full bg-netflix-red hover:bg-red-700 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-netflix-red/15">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding…</span> : 'Add Movie'}
              </button>
            </form>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 space-y-4">
                <p className="text-white/50 text-sm font-semibold">How to add a movie</p>
                {['Search the movie name and pick the correct result from TMDB.', 'Copy the Google Drive file URL or bare file ID.', 'Paste it and click Add Movie.'].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-netflix-red/15 text-netflix-red text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-white/35 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
                <p className="text-white/50 text-sm font-semibold mb-2">Prefer automatic?</p>
                <p className="text-white/30 text-sm leading-relaxed">
                  Use{' '}<Link href="/admin/sync" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Sync Drive</Link>{' '}to auto-detect all new movies.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Series form */}
        {tab === 'series' && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <form onSubmit={handleAddSeries} className="space-y-5">
              <div>
                <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Search TV Show on TMDB</label>
                <div className="relative">
                  <input type="text" value={seriesQuery} onChange={(e) => { setSeriesQuery(e.target.value); if (seriesSelected) setSeriesSelected(null); }}
                    placeholder="e.g. Breaking Bad, Game of Thrones…" className="w-full rounded-xl px-4 py-3.5 text-base outline-none pr-10 transition-all"
                    style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                  {seriesQuery && (
                    <button type="button" onClick={clearSeriesSelection}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-xl">×</button>
                  )}
                </div>
                {seriesSearching && <div className="flex items-center gap-2 mt-2 text-white/30 text-xs"><span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />Searching TMDB…</div>}
                {seriesResults.length > 0 && !seriesSelected && (
                  <div className="mt-2 rounded-xl border border-white/8 overflow-hidden shadow-2xl" style={{ background: '#0e0e0e' }}>
                    {seriesResults.map((r) => (
                      <button key={r.id} type="button" onClick={() => pickSeries(r)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                        {r.poster_path ? <Image src={`${TMDB_IMAGE_BASE}/w92${r.poster_path}`} alt={r.title} width={28} height={42} className="rounded-lg object-cover shrink-0" /> : <div className="w-7 h-10 bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center"><Tv size={14} className="text-white/30" /></div>}
                        <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{r.title}</p>{r.year && <p className="text-white/40 text-xs">{r.year}</p>}</div>
                      </button>
                    ))}
                  </div>
                )}
                {seriesSelected && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 border border-teal-500/20 bg-teal-500/5">
                    {seriesSelected.poster_path && <Image src={`${TMDB_IMAGE_BASE}/w92${seriesSelected.poster_path}`} alt={seriesSelected.title} width={28} height={42} className="rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0"><p className="text-white font-semibold text-sm truncate">{seriesSelected.title}</p>{seriesSelected.year && <p className="text-white/40 text-xs">{seriesSelected.year}</p>}</div>
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
              {seriesError   && <Alert type="error">{seriesError}</Alert>}
              {seriesSuccess && <Alert type="success">{seriesSuccess}</Alert>}
              <button type="submit" disabled={seriesLoading || !driveFolderId || !seriesSelected}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-20 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-teal-600/15">
                {seriesLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding Series…</span> : 'Add Web Series'}
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
        )}
      </div>
    </div>
  );
}
