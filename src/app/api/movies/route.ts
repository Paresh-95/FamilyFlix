import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { searchMovie, getMovieDetails } from '@/lib/tmdb';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

function extractDriveId(input: string): string {
  const m = input.match(/\/(?:file\/d|folders)\/([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : input.trim();
}

export async function POST(req: NextRequest) {
  const { driveFileId: rawDriveFileId, movieName, tmdbId } = await req.json();
  const driveFileId = extractDriveId(rawDriveFileId ?? '');

  if (!driveFileId) {
    return NextResponse.json({ error: 'driveFileId is required' }, { status: 400 });
  }

  let movieData;

  if (tmdbId) {
    // User picked exact movie from TMDB search results
    const [detailRes, { genres }] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`),
      getMovieDetails(tmdbId),
    ]);
    const d = await detailRes.json();
    movieData = {
      title: d.title,
      tmdb_id: d.id,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      overview: d.overview,
      release_year: d.release_date ? parseInt(d.release_date.slice(0, 4)) : null,
      rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
      genres,
    };
  } else if (movieName) {
    // Fallback: search by name, pick first result
    const found = await searchMovie(movieName);
    if (!found) return NextResponse.json({ error: 'Movie not found on TMDB' }, { status: 404 });
    const { genres } = await getMovieDetails(found.tmdb_id);
    movieData = { ...found, genres };
  } else {
    return NextResponse.json({ error: 'tmdbId or movieName is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Prevent duplicates — check both bare ID and any stored URL form, plus TMDB ID
  const { data: allMovies } = await supabase.from('movies').select('id, title, drive_file_id, tmdb_id');
  const duplicate = (allMovies ?? []).find((m: { drive_file_id: string; tmdb_id: number }) =>
    extractDriveId(m.drive_file_id) === driveFileId || m.tmdb_id === movieData.tmdb_id
  );

  if (duplicate) {
    return NextResponse.json({ error: `Already in library: "${(duplicate as { title: string }).title}"` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('movies')
    .insert({ ...movieData, drive_file_id: driveFileId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
