import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('id');
  const size = req.nextUrl.searchParams.get('size') || 's400';
  if (!fileId) return new NextResponse('id required', { status: 400 });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Get the thumbnailLink for this file
    const meta = await drive.files.get({
      fileId,
      fields: 'thumbnailLink',
    });

    const thumbUrl = meta.data.thumbnailLink;
    if (!thumbUrl) {
      return new NextResponse('No thumbnail available', { status: 404 });
    }

    // Replace the size param in the thumbnail URL (e.g. =s220 → =s400)
    const resizedUrl = thumbUrl.replace(/=s\d+$/, `=${size}`);

    const token = await auth.getAccessToken();
    const imgRes = await fetch(resizedUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!imgRes.ok) {
      return new NextResponse('Thumbnail fetch failed', { status: imgRes.status });
    }

    const headers = new Headers();
    headers.set('content-type', imgRes.headers.get('content-type') || 'image/jpeg');
    headers.set('cache-control', 'public, max-age=3600');

    return new NextResponse(imgRes.body, { status: 200, headers });
  } catch (err) {
    console.error('Thumb error:', err);
    return new NextResponse('Error', { status: 500 });
  }
}
