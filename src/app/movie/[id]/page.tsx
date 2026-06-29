import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { getMovieDetails } from '@/lib/tmdb';
import MovieDetailClient from './MovieDetailClient';

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

  return <MovieDetailClient movie={movie} cast={cast} />;
}
