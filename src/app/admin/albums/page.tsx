'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Images, FolderOpen, Trash2, ArrowUpRight, ChevronLeft, Plus } from 'lucide-react';
import { extractDriveId } from '@/lib/drive-utils';
import Navbar from '@/components/Navbar';
import Alert from '@/components/Alert';

type Album = { id: string; name: string; drive_folder_id: string; created_at: string };

const inputStyle = {
  width: '100%',
  background: '#161616',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  padding: '0.875rem 1rem',
  fontSize: '0.9375rem',
  outline: 'none',
  transition: 'border-color 0.15s',
};

export default function AlbumsAdminPage() {
  const [albums,  setAlbums]  = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [name,    setName]    = useState('');
  const [folder,  setFolder]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const fetchAlbums = useCallback(async () => {
    const res = await fetch('/api/albums');
    setAlbums(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, driveFolderId: extractDriveId(folder) }),
    });
    if (res.ok) {
      setSuccess(`Album "${name}" added!`);
      setName('');
      setFolder('');
      fetchAlbums();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to add album.');
    }
    setSaving(false);
  }

  async function handleDelete(id: string, albumName: string) {
    if (!confirm(`Remove album "${albumName}"?`)) return;
    await fetch(`/api/albums/${id}`, { method: 'DELETE' });
    fetchAlbums();
  }

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors mb-4">
            <ChevronLeft size={14} />Admin
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Images size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Photo Albums</h1>
              <p className="text-white/30 text-sm mt-0.5">{albums.length} album{albums.length !== 1 ? 's' : ''} · <Link href="/photos" className="hover:text-white/60 transition-colors">View Photos →</Link></p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 space-y-8 max-w-5xl mx-auto">

        {/* Add form */}
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6 flex items-center gap-3">
            <Plus size={16} className="text-white/40" />
            <h2 className="text-white font-bold">Add New Album</h2>
          </div>
          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Album Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Family Trip 2024, Birthday Party…"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                required
              />
            </div>
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Google Drive Folder URL or ID</label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/… or bare ID"
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8125rem' }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                required
              />
              <p className="text-white/20 text-xs mt-1.5">Share the folder with your service account email first</p>
            </div>

            {error   && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <button
              type="submit"
              disabled={saving || !name || !folder}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-20 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  Adding…
                </span>
              ) : '+ Add Album'}
            </button>
          </form>
        </div>

        {/* Albums list */}
        <section>
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">All Albums</h2>

          {loading && (
            <div className="flex items-center gap-3 py-12 justify-center">
              <span className="w-5 h-5 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
              <span className="text-white/35 text-sm">Loading…</span>
            </div>
          )}

          {!loading && albums.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 border border-white/5 rounded-2xl gap-4">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                <FolderOpen size={24} className="text-white/20" />
              </div>
              <p className="text-white/35 text-sm">No albums yet. Add one above.</p>
            </div>
          )}

          {albums.length > 0 && (
            <div className="space-y-2">
              {albums.map((album) => (
                <div key={album.id} className="group flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/6 rounded-2xl px-5 py-4 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center shrink-0">
                    <FolderOpen size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{album.name}</p>
                    <p className="text-white/20 text-xs font-mono truncate mt-0.5">{album.drive_folder_id}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href="/photos"
                      className="flex items-center gap-1 text-white/40 hover:text-white text-xs px-3 py-2 rounded-lg hover:bg-white/8 transition-colors">
                      <ArrowUpRight size={13} />Browse
                    </Link>
                    <button
                      onClick={() => handleDelete(album.id, album.name)}
                      className="flex items-center gap-1 text-red-500/50 hover:text-red-400 text-xs px-3 py-2 rounded-lg hover:bg-red-500/8 transition-colors">
                      <Trash2 size={13} />Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

