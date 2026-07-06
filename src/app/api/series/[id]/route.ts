import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const [{ data: series }, { data: episodes }] = await Promise.all([
    supabase.from('series').select('*').eq('id', params.id).single(),
    supabase.from('episodes').select('*').eq('series_id', params.id).order('season_number').order('episode_number'),
  ]);

  if (!series) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json({ ...series, episodes: episodes ?? [] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  await supabase.from('episodes').delete().eq('series_id', params.id);
  const { error } = await supabase.from('series').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
