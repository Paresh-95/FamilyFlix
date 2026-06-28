'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clapperboard, Search, Play, Trash2, Star, ChevronLeft, Plus } from 'lucide-react';
import { Movie } from '@/lib/supabase';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';

export default function MoviesTablePage() {
  const [movies,  setMovies]  = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    const res = await fetch('/api/movies');
    setMovies(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Remove "${title}" from the library?`)) return;
    setDeleting(id);
    await fetch(`/api/movies/${id}`, { method: 'DELETE' });
    setMovies((prev) => prev.filter((m) => m.id !== id));
    setDeleting(null);
  }

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genres?.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors mb-4">
            <ChevronLeft size={14} />Admin
          </Link>
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Clapperboard size={22} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">Movies</h1>
                <p className="text-white/30 text-sm mt-0.5">{movies.length} movie{movies.length !== 1 ? 's' : ''} in your library</p>
              </div>
            </div>
            <Link href="/admin" className="ml-auto flex items-center gap-2 bg-netflix-red hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all">
              <Plus size={15} />Add Movie
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 space-y-6 max-w-6xl mx-auto">

        {/* Search */}
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or genre…"
            className="w-full text-white text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 border border-white/5 rounded-2xl gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Clapperboard size={28} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/50 font-semibold">{search ? 'No results match your search.' : 'No movies yet.'}</p>
              {!search && (
                <Link href="/admin" className="text-netflix-red hover:text-red-400 text-sm mt-2 inline-block transition-colors">
                  Add your first movie →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Poster grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onDelete={handleDelete} deleting={deleting === movie.id} />
            ))}
          </div>
        )}

        {search && filtered.length > 0 && (
          <p className="text-white/20 text-xs text-center">{filtered.length} of {movies.length} movies</p>
        )}
      </div>
    </div>
  );
}

function MovieCard({ movie, onDelete, deleting }: { movie: Movie; onDelete: (id: string, title: string) => void; deleting: boolean }) {
  return (
    <div className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900">
      {/* Poster */}
      {movie.poster_path ? (
        <Image
          src={`${TMDB_IMAGE_BASE}/w342${movie.poster_path}`}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-800">
          <Clapperboard size={32} className="text-white/15" />
          <p className="text-white/20 text-xs text-center px-2 leading-tight">{movie.title}</p>
        </div>
      )}

      {/* Gradient overlay — always visible at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-white font-semibold text-xs leading-tight line-clamp-2">{movie.title}</p>
        <div className="flex items-center gap-2 mt-1">
          {movie.release_year && <span className="text-white/40 text-xs">{movie.release_year}</span>}
          {movie.rating && (
            <span className="flex items-center gap-0.5 text-amber-400 text-xs">
              <Star size={9} className="fill-amber-400" />{movie.rating}
            </span>
          )}
        </div>
      </div>

      {/* Hover action overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3">
        <Link
          href={`/watch/${movie.id}`}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-bold py-2.5 rounded-lg hover:bg-white/90 transition-colors"
        >
          <Play size={13} className="fill-black" />
          Play
        </Link>
        <Link
          href={`/movie/${movie.id}`}
          className="w-full flex items-center justify-center gap-2 bg-white/15 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-white/25 transition-colors"
        >
          Details
        </Link>
        <button
          onClick={() => onDelete(movie.id, movie.title)}
          disabled={deleting}
          className="w-full flex items-center justify-center gap-2 bg-netflix-red/20 hover:bg-netflix-red/40 text-red-400 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={12} />
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  );
}
