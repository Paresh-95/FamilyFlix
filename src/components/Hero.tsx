import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/lib/supabase';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';

export default function Hero({ movie }: { movie: Movie }) {
  const backdrop = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
    : null;

  return (
    <div className="relative w-full h-[85vh] min-h-[560px] flex items-end">
      {/* Backdrop */}
      {backdrop ? (
        <Image src={backdrop} alt={movie.title} fill priority className="object-cover object-top" sizes="100vw" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800" />
      )}

      {/* Gradient layers */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.6) 30%, transparent 60%)' }} />

      {/* Content */}
      <div className="relative z-10 px-8 md:px-14 pb-20 max-w-2xl animate-fade-up">
        {/* Genre pills */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-xs font-semibold uppercase tracking-wider text-white/60 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                {g}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4 tracking-tight">
          {movie.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-5 text-sm">
          {movie.rating && (
            <span className="flex items-center gap-1 text-yellow-400 font-bold text-base">
              ★ {movie.rating}
            </span>
          )}
          {movie.release_year && (
            <span className="text-white/60 font-medium">{movie.release_year}</span>
          )}
        </div>

        {movie.overview && (
          <p className="text-white/75 text-base md:text-lg leading-relaxed mb-8 line-clamp-3">
            {movie.overview}
          </p>
        )}

        {/* CTA buttons */}
        <div className="flex gap-4">
          <Link
            href={`/watch/${movie.id}`}
            data-hero-focus
            className="flex items-center gap-3 bg-white text-black font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all focus-visible:ring-4 focus-visible:ring-white shadow-lg shadow-black/30"
          >
            <span className="text-xl">▶</span> Play
          </Link>
          <Link
            href={`/movie/${movie.id}`}
            className="flex items-center gap-3 bg-white/15 backdrop-blur-sm text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/25 active:scale-95 transition-all focus-visible:ring-4 focus-visible:ring-white border border-white/20"
          >
            <span className="text-xl">ℹ</span> More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
