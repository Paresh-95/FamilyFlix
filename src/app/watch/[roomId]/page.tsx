import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import WatchPartyClient from './WatchPartyClient';

export const dynamic = 'force-dynamic';

export default async function WatchPage({ params }: { params: { roomId: string } }) {
  const supabase = createServerClient();
  const { data: room } = await supabase
    .from('watch_rooms')
    .select('*')
    .eq('id', params.roomId)
    .single();

  if (!room) notFound();

  let streamUrl = '';
  let title = '';

  if (room.movie_id) {
    const { data: movie } = await supabase
      .from('movies')
      .select('id, title')
      .eq('id', room.movie_id)
      .single();
    if (!movie) notFound();
    streamUrl = `/api/stream/${room.movie_id}`;
    title = movie.title;
  } else if (room.episode_id) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('id', room.episode_id)
      .single();
    if (!episode) notFound();
    streamUrl = `/api/stream/episode/${room.episode_id}`;
    title = episode.title;
  } else {
    notFound();
  }

  return (
    <WatchPartyClient roomId={params.roomId} streamUrl={streamUrl} title={title} />
  );
}
