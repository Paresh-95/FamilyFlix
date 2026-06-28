'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, CheckCircle2, AlertTriangle, Search, Plus, ChevronLeft, Clapperboard } from 'lucide-react';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';

type TmdbMatch = { id: number; title: string; year?: string; poster_path?: string };

type Candidate = {
  driveFileId: string;
  filename: string;
  cleanedName: string;
  tmdbMatches: TmdbMatch[];
};

type AddedMovie = { filename: string; title: string; poster_path?: string };

type ConflictRow = {
  candidate: Candidate;
  selected: TmdbMatch | null;
  searching: boolean;
  searchQuery: string;
  searchResults: TmdbMatch[];
  status: 'pending' | 'adding' | 'added' | 'error';
};

export default function SyncDrivePage() {
  const [scanning,  setScanning]  = useState(false);
  const [scanError, setScanError] = useState('');
  const [added,     setAdded]     = useState<AddedMovie[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [scanned,   setScanned]   = useState(false);
  const [progress,  setProgress]  = useState('');

  const sync = useCallback(async () => {
    setScanning(true);
    setScanError('');
    setAdded([]);
    setConflicts([]);
    setScanned(false);
    setProgress('Scanning Drive…');

    try {
      const res  = await fetch('/api/admin/sync-drive');
      const data: Candidate[] = await res.json();
      if (!res.ok) { setScanError((data as unknown as { error: string }).error || 'Scan failed'); setScanning(false); return; }

      if (data.length === 0) { setScanned(true); setScanning(false); setProgress(''); return; }

      const newAdded: AddedMovie[]    = [];
      const newConflicts: ConflictRow[] = [];

      for (let i = 0; i < data.length; i++) {
        const c = data[i];
        setProgress(`Adding ${i + 1} of ${data.length}: ${c.cleanedName}…`);

        if (c.tmdbMatches.length === 0) {
          newConflicts.push({ candidate: c, selected: null, searching: false, searchQuery: c.cleanedName, searchResults: [], status: 'pending' });
          continue;
        }

        try {
          const addRes = await fetch('/api/movies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driveFileId: c.driveFileId, tmdbId: c.tmdbMatches[0].id }),
          });
          if (addRes.ok) {
            newAdded.push({ filename: c.filename, title: c.tmdbMatches[0].title, poster_path: c.tmdbMatches[0].poster_path });
          } else if (addRes.status !== 409) {
            newConflicts.push({ candidate: c, selected: c.tmdbMatches[0], searching: false, searchQuery: c.cleanedName, searchResults: [], status: 'error' });
          }
        } catch {
          newConflicts.push({ candidate: c, selected: c.tmdbMatches[0], searching: false, searchQuery: c.cleanedName, searchResults: [], status: 'error' });
        }
      }

      setAdded(newAdded);
      setConflicts(newConflicts);
      setScanned(true);
      setProgress('');
    } catch {
      setScanError('Network error. Try again.');
    } finally {
      setScanning(false);
    }
  }, []);

  function updateConflict(driveFileId: string, patch: Partial<ConflictRow>) {
    setConflicts((prev) => prev.map((r) => r.candidate.driveFileId === driveFileId ? { ...r, ...patch } : r));
  }

  async function searchTmdb(driveFileId: string, query: string) {
    updateConflict(driveFileId, { searching: true });
    try {
      const res     = await fetch(`/api/tmdb-search?q=${encodeURIComponent(query)}`);
      const results = await res.json();
      updateConflict(driveFileId, { searchResults: results, searching: false });
    } catch {
      updateConflict(driveFileId, { searching: false });
    }
  }

  async function addConflict(row: ConflictRow) {
    if (!row.selected) return;
    updateConflict(row.candidate.driveFileId, { status: 'adding' });
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveFileId: row.candidate.driveFileId, tmdbId: row.selected.id }),
      });
      if (res.ok) {
        setAdded((prev) => [...prev, { filename: row.candidate.filename, title: row.selected!.title, poster_path: row.selected!.poster_path }]);
        updateConflict(row.candidate.driveFileId, { status: 'added' });
      } else {
        updateConflict(row.candidate.driveFileId, { status: 'error' });
      }
    } catch {
      updateConflict(row.candidate.driveFileId, { status: 'error' });
    }
  }

  const pendingConflicts = conflicts.filter((r) => r.status === 'pending' || r.status === 'error');

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors mb-4">
            <ChevronLeft size={14} />Admin
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <RefreshCw size={22} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Sync Drive</h1>
              <p className="text-white/30 text-sm mt-0.5">Auto-detect new movies and add them instantly</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 space-y-6 max-w-5xl mx-auto">

        {/* Sync trigger card */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-1">
            <p className="text-white font-semibold">Scan Movies Folder</p>
            <p className="text-white/35 text-sm mt-1 leading-relaxed">
              Finds new videos in Drive, matches them on TMDB automatically, and adds them in one go.
              Only stops if no match is found — those are shown below for manual resolution.
            </p>
          </div>
          <button
            onClick={sync}
            disabled={scanning}
            className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
          >
            <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Syncing…' : scanned ? 'Sync Again' : 'Sync Now'}
          </button>
        </div>

        {/* Progress */}
        {scanning && progress && (
          <div className="flex items-center gap-3 text-white/40 text-sm px-1">
            <span className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin shrink-0" />
            {progress}
          </div>
        )}

        {scanError && (
          <div className="flex items-center gap-3 bg-netflix-red/8 border border-netflix-red/25 text-red-400 px-5 py-4 rounded-xl text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            {scanError}
          </div>
        )}

        {/* All caught up */}
        {scanned && added.length === 0 && conflicts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-2xl gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">All caught up!</p>
              <p className="text-white/35 text-sm mt-1">No new movies found in Drive.</p>
            </div>
          </div>
        )}

        {/* Needs attention */}
        {pendingConflicts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <p className="text-amber-400 text-sm font-semibold">
                Needs attention — {pendingConflicts.length} movie{pendingConflicts.length !== 1 ? 's' : ''} couldn&apos;t be matched
              </p>
            </div>

            {conflicts.map((row) => {
              if (row.status === 'added') return null;
              return (
                <div key={row.candidate.driveFileId} className="bg-white/[0.03] border border-amber-500/15 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-14 rounded-xl bg-zinc-800/80 flex items-center justify-center shrink-0 overflow-hidden">
                      {row.selected?.poster_path ? (
                        <Image src={`${TMDB_IMAGE_BASE}/w92${row.selected.poster_path}`} alt="" width={40} height={56} className="object-cover w-full h-full" />
                      ) : <Clapperboard size={16} className="text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/25 text-xs font-mono truncate">{row.candidate.filename}</p>
                      {row.status === 'error' && (
                        <p className="text-netflix-red text-xs mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} />Failed to add — try again
                        </p>
                      )}
                      {row.selected && (
                        <p className="text-white/50 text-xs mt-1">
                          Selected: <span className="text-white/70 font-medium">{row.selected.title}</span>
                          {row.selected.year && <span className="text-white/30"> · {row.selected.year}</span>}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addConflict(row)}
                      disabled={!row.selected || row.status === 'adding'}
                      className="shrink-0 flex items-center gap-1.5 bg-netflix-red hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                    >
                      {row.status === 'adding' ? (
                        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <Plus size={13} />}
                      Add
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={row.searchQuery}
                      onChange={(e) => updateConflict(row.candidate.driveFileId, { searchQuery: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && searchTmdb(row.candidate.driveFileId, row.searchQuery)}
                      placeholder="Search TMDB manually…"
                      className="flex-1 text-white text-sm rounded-xl px-3 py-2.5 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    />
                    <button
                      onClick={() => searchTmdb(row.candidate.driveFileId, row.searchQuery)}
                      disabled={row.searching}
                      className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 text-white text-sm px-4 py-2.5 rounded-xl transition-colors"
                    >
                      <Search size={14} />
                      {row.searching ? '…' : 'Search'}
                    </button>
                  </div>

                  {row.searchResults.length > 0 && (
                    <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: '#0e0e0e' }}>
                      {row.searchResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => updateConflict(row.candidate.driveFileId, { selected: r, searchResults: [] })}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${row.selected?.id === r.id ? 'bg-white/5' : ''}`}
                        >
                          {r.poster_path ? (
                            <Image src={`${TMDB_IMAGE_BASE}/w92${r.poster_path}`} alt={r.title} width={28} height={40} className="rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-10 bg-zinc-800 rounded-lg shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{r.title}</p>
                            {r.year && <p className="text-white/40 text-xs">{r.year}</p>}
                          </div>
                          {row.selected?.id === r.id && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Added */}
        {added.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-sm font-semibold">
                {added.length} movie{added.length !== 1 ? 's' : ''} added successfully
              </p>
            </div>
            <div className="space-y-2">
              {added.map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl px-4 py-3">
                  {m.poster_path ? (
                    <Image src={`${TMDB_IMAGE_BASE}/w92${m.poster_path}`} alt={m.title} width={28} height={40} className="rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-10 bg-zinc-800 rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{m.title}</p>
                    <p className="text-white/20 text-xs font-mono truncate">{m.filename}</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-semibold shrink-0">Added</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

