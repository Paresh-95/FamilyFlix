import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getDriveAccessToken } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { data: movie } = await supabase
    .from('movies')
    .select('drive_file_id')
    .eq('id', params.id)
    .single();

  if (!movie) return new NextResponse('Not found', { status: 404 });

  const token = await getDriveAccessToken();
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${movie.drive_file_id}?alt=media&access_token=${token}`;

  return NextResponse.redirect(driveUrl, { status: 302 });
}
