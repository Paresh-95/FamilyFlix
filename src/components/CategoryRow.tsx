'use client';

import { useRef } from 'react';
import { Movie } from '@/lib/supabase';
import MovieCard from './MovieCard';

export default function CategoryRow({
  title,
  movies,
  rowIndex = 0,
}: {
  title: string;
  movies: Movie[];
  rowIndex?: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (movies.length === 0) return null;

  function focusCardInRow(section: Element, cardIdx: number) {
    const cards = Array.from(section.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const target = cards[Math.min(cardIdx, cards.length - 1)] ?? cards[0];
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function currentCardIndex(): number {
    const row = rowRef.current;
    if (!row) return 0;
    const cards = Array.from(row.querySelectorAll<HTMLAnchorElement>('a[href]'));
    return cards.indexOf(document.activeElement as HTMLAnchorElement);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const row = rowRef.current;
    if (!row) return;

    const cards = Array.from(row.querySelectorAll<HTMLAnchorElement>('a[href]'));
    const idx = currentCardIndex();

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = cards[idx + 1];
      if (next) { next.focus(); next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }

    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = cards[idx - 1];
      if (prev) { prev.focus(); prev.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }

    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = document.querySelector<HTMLElement>(`section[data-row="${rowIndex + 1}"]`);
      if (next) focusCardInRow(next, idx);

    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex === 0) {
        // Return focus to hero buttons
        const heroBtn = document.querySelector<HTMLElement>('[data-hero-focus]');
        heroBtn?.focus();
      } else {
        const prev = document.querySelector<HTMLElement>(`section[data-row="${rowIndex - 1}"]`);
        if (prev) focusCardInRow(prev, idx);
      }
    }
  }

  return (
    <section data-row={rowIndex} className="mb-8">
      {/* Row title */}
      <div className="flex items-center gap-3 px-6 md:px-10 mb-4">
        <h2 className="text-white text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Card row */}
      <div
        ref={rowRef}
        onKeyDown={handleKeyDown}
        className="flex gap-3 md:gap-4 overflow-x-auto px-6 md:px-10 pb-4 scrollbar-hide"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
