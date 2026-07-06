'use client';

import { useMemo } from 'react';
import { Movie, Series } from '@/lib/supabase';
import CategoryRow from '@/components/CategoryRow';
import SeriesRow from '@/components/SeriesRow';
import MovieCard from '@/components/MovieCard';
import SeriesCard from '@/components/SeriesCard';

export default function HomeContent({
  movies,
  series,
  query,
}: {
  movies: Movie[];
  series: Series[];
  query?: string;
}) {
  const filteredMovies = useMemo(() => {
    if (!query) return movies;
    const q = query.toLowerCase();
    return movies.filter((m) => m.title.toLowerCase().includes(q));
  }, [movies, query]);

  const filteredSeries = useMemo(() => {
    if (!query) return series;
    const q = query.toLowerCase();
    return series.filter((s) => s.title.toLowerCase().includes(q));
  }, [series, query]);

  const byGenre = useMemo(() => {
    const map = new Map<string, Movie[]>();
    for (const movie of movies) {
      const genre = movie.genres?.[0];
      if (genre) {
        if (!map.has(genre)) map.set(genre, []);
        map.get(genre)!.push(movie);
      }
    }
    return map;
  }, [movies]);

  if (query) {
    const total = filteredMovies.length + filteredSeries.length;
    return (
      <div className="pt-10 px-6 md:px-10 pb-20">
        <p className="text-white/50 text-base mb-6">
          <span className="text-white font-semibold">{total}</span> result{total !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
        {total === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-white/40 text-lg">No results found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredSeries.map((s) => <SeriesCard key={s.id} series={s} />)}
            {filteredMovies.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </div>
    );
  }

  if (movies.length === 0 && series.length === 0) {
    return (
      <div className="pt-36 flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-6">🎬</div>
        <h2 className="text-2xl font-bold text-white mb-3">No content yet</h2>
        <p className="text-white/40 mb-8">Add movies or web series from the admin panel.</p>
        <a
          href="/admin"
          className="bg-netflix-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors focus-visible:ring-4 focus-visible:ring-white"
        >
          Go to Admin →
        </a>
      </div>
    );
  }

  const genres = Array.from(byGenre.entries()) as [string, Movie[]][];

  return (
    <div className="pb-20">
      {series.length > 0 && <SeriesRow title="Web Series" seriesList={series} rowIndex={0} />}
      {genres.map(([genre, genreMovies], i) => (
        <CategoryRow key={genre} title={genre} movies={genreMovies} rowIndex={series.length > 0 ? i + 1 : i} />
      ))}
      {movies.length > 0 && (
        <CategoryRow title="All Movies" movies={movies} rowIndex={series.length > 0 ? genres.length + 1 : genres.length} />
      )}
    </div>
  );
}
