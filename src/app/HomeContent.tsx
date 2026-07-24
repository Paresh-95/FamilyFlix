'use client';

import { useMemo, useState } from 'react';
import { Movie, Series } from '@/lib/supabase';
import MovieCard from '@/components/MovieCard';
import SeriesCard from '@/components/SeriesCard';

type Tab = 'all' | 'movies' | 'series';

export default function HomeContent({
  movies,
  series,
  query,
}: {
  movies: Movie[];
  series: Series[];
  query?: string;
}) {
  const [tab, setTab]               = useState<Tab>('all');
  const [activeGenre, setActiveGenre] = useState<string>('All');

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const movie of movies) {
      if (movie.genres?.[0]) set.add(movie.genres[0]);
    }
    return Array.from(set).sort();
  }, [movies]);

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

  // Search results view
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
        <a href="/admin" className="bg-netflix-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors">
          Go to Admin →
        </a>
      </div>
    );
  }

  const visibleMovies = tab === 'series' ? [] :
    activeGenre === 'All' ? movies :
    movies.filter((m) => m.genres?.[0] === activeGenre);

  const visibleSeries = tab === 'movies' ? [] : series;
  const total = visibleMovies.length + visibleSeries.length;

  return (
    <div className="pb-20">

      {/* Tabs */}
      <div className="px-6 md:px-10 pt-6 pb-0 flex items-center gap-1">
        {(['all', 'movies', 'series'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setActiveGenre('All'); }}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all capitalize ${
              tab === t
                ? 'bg-white text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t === 'all' ? 'All' : t === 'movies' ? 'Movies' : 'Series'}
          </button>
        ))}
      </div>

      {/* Genre chips — only shown on Movies or All tab */}
      {tab !== 'series' && genres.length > 0 && (
        <div className="px-6 md:px-10 pt-3 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {['All', ...genres].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                className={`shrink-0 px-4 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeGenre === g
                    ? 'bg-netflix-red text-white'
                    : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={tab !== 'series' && genres.length > 0 ? 'px-6 md:px-10' : 'px-6 md:px-10 pt-4'}>
        {total === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/30 text-lg">Nothing here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {visibleSeries.map((s) => <SeriesCard key={s.id} series={s} />)}
            {visibleMovies.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
