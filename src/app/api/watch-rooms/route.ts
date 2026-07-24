import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const { movieId, episodeId } = await req.json();

  if (!movieId && !episodeId) {
    return NextResponse.json({ error: 'movieId or episodeId required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('watch_rooms')
    .insert({ movie_id: movieId ?? null, episode_id: episodeId ?? null })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ roomId: data.id });
}
