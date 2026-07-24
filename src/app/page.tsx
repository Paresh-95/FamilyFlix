import { createServerClient, Movie } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HomeContent from './HomeContent';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createServerClient();
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false });

  const allMovies: Movie[] = movies ?? [];
  const featured = allMovies[0] ?? null;

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />
      {featured && !searchParams.q && <Hero movie={featured} />}
      <HomeContent movies={allMovies} query={searchParams.q} />
    </div>
  );
}
