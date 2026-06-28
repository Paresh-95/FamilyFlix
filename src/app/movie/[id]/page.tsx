import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import { getMovieDetails, TMDB_IMAGE_BASE } from '@/lib/tmdb';
import Navbar from '@/components/Navbar';
import OpenInPlayerButton from '@/components/OpenInPlayerButton';

export const dynamic = 'force-dynamic';

export default async function MoviePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!movie) notFound();

  let cast: { name: string; character: string; profile_path: string | null }[] = [];
  try {
    if (movie.tmdb_id) {
      const details = await getMovieDetails(movie.tmdb_id);
      cast = details.cast;
    }
  } catch { /* Cast fetch is best-effort */ }

  const backdrop = movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}` : null;
  const poster   = movie.poster_path   ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`   : null;

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

      {/* Content card */}
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
            {/* Genres */}
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

            {/* Meta row */}
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

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                href={`/watch/${movie.id}`}
                className="flex items-center gap-3 bg-white text-black font-bold text-lg px-10 py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all focus-visible:ring-4 focus-visible:ring-white shadow-lg shadow-black/30"
              >
                <span className="text-xl">▶</span> Play Now
              </Link>
              <OpenInPlayerButton movieId={movie.id} />
              <Link
                href="/"
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/20 active:scale-95 transition-all focus-visible:ring-4 focus-visible:ring-white border border-white/15"
              >
                ← Home
              </Link>
            </div>

            {/* Cast */}
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
