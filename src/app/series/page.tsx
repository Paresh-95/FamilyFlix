import { createServerClient, Series } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import SeriesContent from './SeriesContent';

export const dynamic = 'force-dynamic';

export default async function SeriesPage() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false });

  const allSeries: Series[] = data ?? [];

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />
      <SeriesContent series={allSeries} />
    </div>
  );
}
