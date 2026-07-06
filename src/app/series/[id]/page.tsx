import { createServerClient, Series, Episode } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SeriesDetailClient from './SeriesDetailClient';

export const dynamic = 'force-dynamic';

export default async function SeriesPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: series } = await supabase.from('series').select('*').eq('id', params.id).single();
  if (!series) notFound();

  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('series_id', params.id)
    .order('season_number')
    .order('episode_number');

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />
      <SeriesDetailClient series={series as Series} episodes={(episodes ?? []) as Episode[]} />
    </div>
  );
}
