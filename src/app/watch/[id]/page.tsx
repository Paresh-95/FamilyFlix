import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import VideoPlayer from '@/components/VideoPlayer';

export const dynamic = 'force-dynamic';

export default async function WatchPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  const { data: movie } = await supabase
    .from('movies')
    .select('id, title, drive_file_id')
    .eq('id', params.id)
    .single();

  if (!movie) notFound();

  return <VideoPlayer movieTitle={movie.title} movieId={movie.id} driveFileId={movie.drive_file_id} />;
}
