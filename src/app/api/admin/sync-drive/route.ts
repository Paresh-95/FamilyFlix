import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function cleanFilename(filename: string): string {
  let name = filename.replace(/\.[^/.]+$/, '');
  name = name.replace(/^Copy of /i, '');
  const dots   = (name.match(/\./g) ?? []).length;
  const spaces = (name.match(/ /g) ?? []).length;
  if (dots > spaces) name = name.replace(/\./g, ' ');
  const bracketYear = name.match(/^(.+?)\s*[\(\[]\s*(\d{4})/);
  if (bracketYear) return bracketYear[1].trim();
  name = name.replace(/\b(19|20)\d{2}\b.*$/, '');
  name = name.replace(
    /\b(S\d{2}|Season\s*\d+|2160p|1080p|720p|480p|4K|UHD|BluRay|BRRip|WEB[-. ]?DL|WEBRip|HDRip|DVDRip|x264|x265|HEVC|AVC|AAC|DD|DTS|ESub|ESubs|Hindi|English|Tamil|Telugu|Dual|Multi|Audio|Unrated|Extended|Directors\.Cut|Remastered|PROPER|REPACK|NF|AMZN|DSNP)\b.*/i,
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
    const supabase = createServerClient();

    const moviesFolderId = process.env.DRIVE_MOVIES_FOLDER_ID;
    const parentQ = moviesFolderId ? `'${moviesFolderId}' in parents and` : '';

    // ── Scan video files (movies) ──────────────────────────────────────────
    const filesRes = await drive.files.list({
      q: `${parentQ} mimeType contains 'video/' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 200,
      orderBy: 'name',
    });
    const driveFiles = filesRes.data.files ?? [];

    // ── Scan subfolders (series) ───────────────────────────────────────────
    const foldersRes = await drive.files.list({
      q: `${parentQ} mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 200,
      orderBy: 'name',
    });
    const driveFolders = foldersRes.data.files ?? [];

    // ── Existing library ───────────────────────────────────────────────────
    const [{ data: existingMovies }, { data: existingSeries }] = await Promise.all([
      supabase.from('movies').select('drive_file_id, tmdb_id'),
      supabase.from('series').select('drive_folder_id, tmdb_id'),
    ]);

    const existingMovieIds = new Set(
      (existingMovies ?? []).map(({ drive_file_id }: { drive_file_id: string }) => {
        const m = drive_file_id?.match(/\/(?:file\/d|folders)\/([a-zA-Z0-9_-]{10,})/);
        return m ? m[1] : drive_file_id;
      })
    );
    const existingMovieTmdbIds = new Set(
      (existingMovies ?? []).map(({ tmdb_id }: { tmdb_id: number }) => tmdb_id).filter(Boolean)
    );
    const existingSeriesIds = new Set(
      (existingSeries ?? []).map(({ drive_folder_id }: { drive_folder_id: string }) => drive_folder_id)
    );
    const existingSeriesTmdbIds = new Set(
      (existingSeries ?? []).map(({ tmdb_id }: { tmdb_id: number }) => tmdb_id).filter(Boolean)
    );

    // ── Match movies on TMDB ───────────────────────────────────────────────
    const newFiles = driveFiles.filter((f) => !existingMovieIds.has(f.id!));
    const movieCandidates = await Promise.all(
      newFiles.map(async (file) => {
        const cleanedName = cleanFilename(file.name!);
        try {
          const r = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanedName)}&page=1`
          );
          const data = await r.json();
          const tmdbMatches: TmdbMatch[] = (data.results ?? []).slice(0, 4).map((m: {
            id: number; title: string; release_date?: string; poster_path?: string;
          }) => ({ id: m.id, title: m.title, year: m.release_date?.slice(0, 4), poster_path: m.poster_path ?? undefined }));
          return { type: 'movie' as const, driveId: file.id!, filename: file.name!, cleanedName, tmdbMatches };
        } catch {
          return { type: 'movie' as const, driveId: file.id!, filename: file.name!, cleanedName, tmdbMatches: [] };
        }
      })
    );

    // ── Match series folders on TMDB ───────────────────────────────────────
    const newFolders = driveFolders.filter((f) => !existingSeriesIds.has(f.id!));
    const seriesCandidates = await Promise.all(
      newFolders.map(async (folder) => {
        const cleanedName = cleanFilename(folder.name!);
        try {
          const r = await fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(cleanedName)}&page=1`
          );
          const data = await r.json();
          const tmdbMatches: TmdbMatch[] = (data.results ?? []).slice(0, 4).map((m: {
            id: number; name: string; first_air_date?: string; poster_path?: string;
          }) => ({ id: m.id, title: m.name, year: m.first_air_date?.slice(0, 4), poster_path: m.poster_path ?? undefined }));
          return { type: 'series' as const, driveId: folder.id!, filename: folder.name!, cleanedName, tmdbMatches };
        } catch {
          return { type: 'series' as const, driveId: folder.id!, filename: folder.name!, cleanedName, tmdbMatches: [] };
        }
      })
    );

    // Filter out already-known TMDB IDs
    const filteredMovies  = movieCandidates.filter((c) => c.tmdbMatches.length === 0 || !existingMovieTmdbIds.has(c.tmdbMatches[0].id));
    const filteredSeries  = seriesCandidates.filter((c) => c.tmdbMatches.length === 0 || !existingSeriesTmdbIds.has(c.tmdbMatches[0].id));

    return NextResponse.json([...filteredMovies, ...filteredSeries]);
  } catch (err) {
    console.error('Sync Drive error:', err);
    return NextResponse.json({ error: 'Failed to scan Drive' }, { status: 500 });
  }
}
