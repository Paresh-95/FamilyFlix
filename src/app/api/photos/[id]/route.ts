import { NextRequest, NextResponse } from 'next/server';
import { getDriveAccessToken } from '@/lib/gdrive';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getDriveAccessToken();

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${params.id}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!driveRes.ok) {
      return new NextResponse('Photo not found', { status: driveRes.status });
    }

    const headers = new Headers();
    const ct = driveRes.headers.get('content-type');
    if (ct) headers.set('content-type', ct);
    headers.set('cache-control', 'public, max-age=3600');

    return new NextResponse(driveRes.body, { status: 200, headers });
  } catch (err) {
    console.error('Photo fetch error:', err);
    return new NextResponse('Error', { status: 500 });
  }
}
