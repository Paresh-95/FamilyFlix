import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(_: Request, { params }: { params: { roomId: string } }) {
  const supabase = createServerClient();
  const { data: room } = await supabase
    .from('watch_rooms')
    .select('*')
    .eq('id', params.roomId)
    .single();

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  if (room.movie_id) {
    const { data: movie } = await supabase
      .from('movies')
      .select('id, title')
      .eq('id', room.movie_id)
      .single();
    return NextResponse.json({ type: 'movie', content: movie });
  }

  if (room.episode_id) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, title, series_id')
      .eq('id', room.episode_id)
      .single();
    return NextResponse.json({ type: 'episode', content: episode });
  }

  return NextResponse.json({ error: 'No content' }, { status: 400 });
}
