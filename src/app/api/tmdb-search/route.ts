import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json([]);

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const data = await res.json();

  const results = (data.results || []).slice(0, 6).map((m: {
    id: number;
    title: string;
    release_date?: string;
    poster_path?: string;
  }) => ({
    id: m.id,
    title: m.title,
    year: m.release_date?.slice(0, 4),
    poster_path: m.poster_path,
  }));

  return NextResponse.json(results);
}
