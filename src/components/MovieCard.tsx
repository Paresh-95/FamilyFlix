import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/lib/supabase';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';

export default function MovieCard({ movie }: { movie: Movie }) {
  const poster = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}`
    : null;

  return (
    <Link
      href={`/movie/${movie.id}`}
      tabIndex={0}
      className="tv-card group relative block rounded-xl overflow-hidden bg-netflix-card shrink-0 w-40 sm:w-48 md:w-52 transition-transform duration-200 outline-none"
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative bg-netflix-card">
        {poster ? (
          <Image
            src={poster}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105"
            sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 208px"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 flex flex-col items-center justify-center gap-2 px-2">
            <span className="text-4xl">🎬</span>
            <span className="text-zinc-400 text-xs text-center font-medium leading-tight">{movie.title}</span>
          </div>
        )}

        {/* Hover overlay with play icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-focus-visible:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all scale-75 group-hover:scale-100 group-focus-visible:scale-100">
            <span className="text-white text-xl ml-1">▶</span>
          </div>
        </div>

        {/* Rating badge */}
        {movie.rating && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold px-2 py-1 rounded-lg">
            ★ {movie.rating}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-gradient-to-t from-netflix-card to-netflix-card/80">
        <p className="text-white text-sm font-semibold truncate leading-snug">{movie.title}</p>
        <div className="flex items-center gap-2 mt-1">
          {movie.release_year && (
            <span className="text-netflix-muted text-xs">{movie.release_year}</span>
          )}
          {movie.genres && movie.genres[0] && (
            <span className="text-netflix-muted text-xs truncate">· {movie.genres[0]}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
