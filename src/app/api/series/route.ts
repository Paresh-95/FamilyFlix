import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getTVDetails, getTVSeason } from '@/lib/tmdb';
import { listFolderVideos } from '@/lib/gdrive';
import { extractDriveId } from '@/lib/drive-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

function parseEpisodeInfo(filename: string, index: number): { season: number; episode: number; title: string } {
  // Match S01E02, s1e2, etc.
  const seMatch = filename.match(/[sS](\d{1,2})[eE](\d{1,3})/);
  if (seMatch) {
    return {
      season: parseInt(seMatch[1]),
      episode: parseInt(seMatch[2]),
      title: filename.replace(/\.[^.]+$/, '').replace(/[sS]\d{1,2}[eE]\d{1,3}[-_\s]*/, '').trim() || `Episode ${parseInt(seMatch[2])}`,
    };
  }
  // Match bare episode number like "01 - Title.mkv" or "E01.mkv"
  const epMatch = filename.match(/^[eE]?(\d{1,3})[\s_-]+(.+?)\.[^.]+$/);
  if (epMatch) {
    return { season: 1, episode: parseInt(epMatch[1]), title: epMatch[2].trim() };
  }
  // Fallback: natural order
  const name = filename.replace(/\.[^.]+$/, '').trim();
  return { season: 1, episode: index + 1, title: name || `Episode ${index + 1}` };
}

export async function POST(req: NextRequest) {
  const { driveFolderId: rawFolderId, tmdbId } = await req.json();
  const driveFolderId = extractDriveId(rawFolderId ?? '');

  if (!driveFolderId) return NextResponse.json({ error: 'driveFolderId is required' }, { status: 400 });
  if (!tmdbId) return NextResponse.json({ error: 'tmdbId is required' }, { status: 400 });

  const supabase = createServerClient();

  // Prevent duplicate series
  const { data: existing } = await supabase.from('series').select('id, title').eq('drive_folder_id', driveFolderId).maybeSingle();
  if (existing) return NextResponse.json({ error: `Already in library: "${existing.title}"` }, { status: 409 });

  // Fetch TV metadata from TMDB
  const tvDetails = await getTVDetails(tmdbId);

  const { data: series, error: seriesErr } = await supabase
    .from('series')
    .insert({
      title: tvDetails.title,
      tmdb_id: tmdbId,
      drive_folder_id: driveFolderId,
      poster_path: tvDetails.poster_path,
      backdrop_path: tvDetails.backdrop_path,
      overview: tvDetails.overview,
      first_air_year: tvDetails.first_air_year,
      rating: tvDetails.rating,
      genres: tvDetails.genres,
    })
    .select()
    .single();

  if (seriesErr || !series) return NextResponse.json({ error: seriesErr?.message ?? 'Insert failed' }, { status: 500 });

  // Scan Drive folder for video files
  let driveFiles: { id: string; name: string }[] = [];
  try {
    driveFiles = await listFolderVideos(driveFolderId);
  } catch (e) {
    console.error('Drive folder scan failed:', e);
  }

  if (driveFiles.length > 0) {
    // Fetch TMDB episode metadata for season 1 (default; multi-season handled via episode parsing)
    const tmdbEpisodes = await getTVSeason(tmdbId, 1);
    const tmdbByEp: Record<number, (typeof tmdbEpisodes)[0]> = {};
    for (const ep of tmdbEpisodes) tmdbByEp[ep.episode_number] = ep;

    const episodes = driveFiles.map((file, i) => {
      const parsed = parseEpisodeInfo(file.name, i);
      const tmdbEp = tmdbByEp[parsed.episode];
      return {
        series_id: series.id,
        title: tmdbEp?.title ?? parsed.title,
        episode_number: parsed.episode,
        season_number: parsed.season,
        drive_file_id: file.id,
        overview: tmdbEp?.overview ?? null,
        still_path: tmdbEp?.still_path ?? null,
        air_date: tmdbEp?.air_date ?? null,
      };
    });

    await supabase.from('episodes').insert(episodes);
  }

  // Return series with episode count
  const { data: withEps } = await supabase
    .from('episodes')
    .select('id')
    .eq('series_id', series.id);

  return NextResponse.json({ ...series, episode_count: withEps?.length ?? 0 }, { status: 201 });
}
