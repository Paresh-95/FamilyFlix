'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';
import OpenInPlayerButton from '@/components/OpenInPlayerButton';

type Movie = {
  id: string;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number | null;
  rating: number | null;
  overview: string | null;
  genres: string[] | null;
  drive_file_id: string;
};

type Cast = { name: string; character: string; profile_path: string | null };

export default function MovieDetailClient({ movie, cast }: { movie: Movie; cast: Cast[] }) {
  const [drivePlayer, setDrivePlayer] = useState(false);

  const backdrop = movie.backdrop_path ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}` : null;
  const poster   = movie.poster_path   ? `${TMDB_IMAGE_BASE}/original${movie.poster_path}`  : null;

  if (drivePlayer) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(0,0,0,0.9)' }}>
          <button
            onClick={() => setDrivePlayer(false)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            ← Back
          </button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, opacity: 0.85 }}>{movie.title}</span>
        </div>
        <iframe
          src={`https://drive.google.com/file/d/${movie.drive_file_id}/preview?autoplay=1`}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[360px]">
        {backdrop ? (
          <Image src={backdrop} alt={movie.title} fill priority className="object-cover object-top" sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.4) 60%, transparent 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 pb-20 -mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl">

          {/* Poster */}
          {poster && (
            <div className="shrink-0 self-start">
              <div className="relative w-44 md:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
                <Image src={poster} alt={movie.title} fill className="object-cover" sizes="240px" />
              </div>
            </div>
          )}

          {/* Details */}
          <div className="flex-1 pt-2">
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres.map((g: string) => (
                  <span key={g} className="text-xs font-semibold uppercase tracking-wider text-white/50 bg-white/8 border border-white/10 px-3 py-1 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              {movie.rating && (
                <span className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 font-bold px-3 py-1.5 rounded-lg">
                  ★ {movie.rating}
                </span>
              )}
              {movie.release_year && (
                <span className="text-white/50 font-medium">{movie.release_year}</span>
              )}
            </div>

            {movie.overview && (
              <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">{movie.overview}</p>
            )}

            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => setDrivePlayer(true)}
                className="flex items-center gap-3 bg-white text-black font-bold text-lg px-10 py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-black/30"
              >
                <span className="text-xl">▶</span> Play Now
              </button>
              <OpenInPlayerButton movieId={movie.id} />
              <Link
                href="/"
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/20 active:scale-95 transition-all border border-white/15"
              >
                ← Home
              </Link>
            </div>

            {cast.length > 0 && (
              <div>
                <h2 className="text-white text-xl font-bold mb-5">Cast</h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
                  {cast.slice(0, 12).map((actor) => (
                    <div key={actor.name} className="shrink-0 w-24 text-center group">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-800 mb-2 mx-auto ring-2 ring-transparent group-hover:ring-white/30 transition-all">
                        {actor.profile_path ? (
                          <Image
                            src={`${TMDB_IMAGE_BASE}/w185${actor.profile_path}`}
                            alt={actor.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl">👤</div>
                        )}
                      </div>
                      <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{actor.name}</p>
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
