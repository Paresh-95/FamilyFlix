import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json([]);

  const url = `https://api.themoviedb.org/3/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const data = await res.json();

  const results = (data.results || []).slice(0, 6).map((s: {
    id: number;
    name: string;
    first_air_date?: string;
    poster_path?: string;
  }) => ({
    id: s.id,
    title: s.name,
    year: s.first_air_date?.slice(0, 4),
    poster_path: s.poster_path,
  }));

  return NextResponse.json(results);
}
