import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function cleanFilename(filename: string): string {
  let name = filename.replace(/\.[^/.]+$/, ''); // strip extension
  name = name.replace(/^Copy of /i, '');

  // Dot-separated filenames (e.g. Raja.Shivaji.2026.1080p...) — replace dots with spaces
  const dots   = (name.match(/\./g) ?? []).length;
  const spaces = (name.match(/ /g) ?? []).length;
  if (dots > spaces) name = name.replace(/\./g, ' ');

  // Title before bracketed year: "Movie Name (2008)" or "Movie Name [2008]"
  const bracketYear = name.match(/^(.+?)\s*[\(\[]\s*(\d{4})/);
  if (bracketYear) return bracketYear[1].trim();

  // Strip bare year (1900–2099) and everything after it
  name = name.replace(/\b(19|20)\d{2}\b.*$/, '');

  // Fallback: strip quality tags and everything after
  name = name.replace(
    /\b(2160p|1080p|720p|480p|4K|UHD|BluRay|BRRip|WEB[-. ]?DL|WEBRip|HDRip|DVDRip|x264|x265|HEVC|AVC|AAC|DD|DTS|ESub|ESubs|Hindi|English|Tamil|Telugu|Dual|Multi|Audio|Unrated|Extended|Directors\.Cut|Remastered|PROPER|REPACK|NF|AMZN|DSNP)\b.*/i,
    ''
  );

  return name.trim();
}

type TmdbMatch = { id: number; title: string; year?: string; poster_path?: string };

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // List all video files the service account can access
    const q = process.env.DRIVE_MOVIES_FOLDER_ID
      ? `'${process.env.DRIVE_MOVIES_FOLDER_ID}' in parents and mimeType contains 'video/' and trashed = false`
      : `mimeType contains 'video/' and trashed = false`;

    const res = await drive.files.list({
      q,
      fields: 'files(id, name, mimeType)',
      pageSize: 200,
      orderBy: 'name',
    });

    const driveFiles = res.data.files ?? [];

    // Get already-added drive_file_ids
    const supabase = createServerClient();
    const { data: existing } = await supabase.from('movies').select('drive_file_id');
    const existingIds = new Set((existing ?? []).map((m: { drive_file_id: string }) => m.drive_file_id));

    const newFiles = driveFiles.filter((f) => !existingIds.has(f.id!));

    if (newFiles.length === 0) return NextResponse.json([]);

    // Search TMDB for each new file in parallel
    const candidates = await Promise.all(
      newFiles.map(async (file) => {
        const cleanedName = cleanFilename(file.name!);
        try {
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanedName)}&page=1`
          );
          const tmdbData = await tmdbRes.json();
          const tmdbMatches: TmdbMatch[] = (tmdbData.results ?? []).slice(0, 4).map((r: {
            id: number; title: string; release_date?: string; poster_path?: string;
          }) => ({
            id: r.id,
            title: r.title,
            year: r.release_date?.slice(0, 4),
            poster_path: r.poster_path ?? undefined,
          }));
          return { driveFileId: file.id!, filename: file.name!, cleanedName, tmdbMatches };
        } catch {
          return { driveFileId: file.id!, filename: file.name!, cleanedName, tmdbMatches: [] };
        }
      })
    );

    return NextResponse.json(candidates);
  } catch (err) {
    console.error('Sync Drive error:', err);
    return NextResponse.json({ error: 'Failed to scan Drive' }, { status: 500 });
  }
}
