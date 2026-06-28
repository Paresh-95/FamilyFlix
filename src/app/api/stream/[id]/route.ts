import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getDriveAccessToken } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { data: movie } = await supabase
    .from('movies')
    .select('drive_file_id')
    .eq('id', params.id)
    .single();

  if (!movie) return new NextResponse('Not found', { status: 404 });

  try {
    const token = await getDriveAccessToken();
    const range = req.headers.get('range');

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${movie.drive_file_id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(range ? { Range: range } : {}),
        },
      }
    );

    if (!driveRes.ok) {
      const body = await driveRes.text();
      console.error('Drive stream error', driveRes.status, body);
      return new NextResponse(`Drive fetch failed: ${driveRes.status}`, { status: driveRes.status });
    }

    const headers = new Headers();
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const v = driveRes.headers.get(h);
      if (v) headers.set(h, v);
    }
    // Ensure a video content-type is set so players can identify the stream
    if (!headers.get('content-type')?.startsWith('video/')) {
      headers.set('content-type', 'video/x-matroska');
    }
    headers.set('cache-control', 'no-store');

    return new NextResponse(driveRes.body, {
      status: driveRes.status,
      headers,
    });
  } catch (err) {
    console.error('Stream error:', err);
    return new NextResponse('Stream error', { status: 500 });
  }
}
