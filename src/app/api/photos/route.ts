import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  thumbnailLink?: string;
  width?: number;
  height?: number;
};

function extractFolderId(input: string): string {
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]{10,})/,
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
  ];
  for (const re of patterns) {
    const m = input.match(re);
    if (m) return m[1];
  }
  return input.trim();
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('folderId');
  if (!raw) {
    return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
  }
  const folderId = extractFolderId(raw);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder') and trashed = false`,
      fields: 'files(id, name, mimeType, thumbnailLink, imageMediaMetadata)',
      pageSize: 500,
      orderBy: 'folder,name',
    });

    const items: DriveItem[] = (res.data.files ?? []).map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
      thumbnailLink: f.thumbnailLink ?? undefined,
      width: (f.imageMediaMetadata as { width?: number } | null)?.width,
      height: (f.imageMediaMetadata as { height?: number } | null)?.height,
    }));

    return NextResponse.json(items);
  } catch (err) {
    console.error('Photos list error:', err);
    return NextResponse.json({ error: 'Failed to list photos' }, { status: 500 });
  }
}
