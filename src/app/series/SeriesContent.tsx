'use client';

import { useMemo, useState } from 'react';
import { Series } from '@/lib/supabase';
import SeriesCard from '@/components/SeriesCard';

export default function SeriesContent({ series }: { series: Series[] }) {
  const [activeGenre, setActiveGenre] = useState('All');

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const s of series) {
      if (s.genres?.[0]) set.add(s.genres[0]);
    }
    return Array.from(set).sort();
  }, [series]);

  const visible = useMemo(() =>
    activeGenre === 'All' ? series : series.filter((s) => s.genres?.[0] === activeGenre),
    [series, activeGenre]
  );

  if (series.length === 0) {
    return (
      <div className="pt-36 flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-6">📺</div>
        <h2 className="text-2xl font-bold text-white mb-3">No series yet</h2>
        <p className="text-white/40 mb-8">Add web series from the admin panel.</p>
        <a href="/admin/add-series" className="bg-netflix-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors">
          Add Series →
        </a>
      </div>
    );
  }

  return (
    <div className="pb-20">

      {/* Genre chips */}
      <div className="px-6 md:px-10 pt-24 pb-4">
        {genres.length > 0 && (
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
        )}
      </div>

      {/* Grid */}
      <div className={genres.length > 0 ? 'px-6 md:px-10' : 'px-6 md:px-10 pt-4'}>
        {visible.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/30 text-lg">Nothing here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {visible.map((s) => <SeriesCard key={s.id} series={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
