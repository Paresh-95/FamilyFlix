const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export async function searchMovie(title: string) {
  const data = await tmdbFetch('/search/movie', { query: title });
  const movie = data.results?.[0];
  if (!movie) return null;
  return {
    tmdb_id: movie.id as number,
    title: movie.title as string,
    overview: movie.overview as string,
    poster_path: movie.poster_path as string | null,
    backdrop_path: movie.backdrop_path as string | null,
    release_year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null,
    rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
  };
}

export async function getMovieDetails(tmdbId: number) {
  const [details, credits] = await Promise.all([
    tmdbFetch(`/movie/${tmdbId}`),
    tmdbFetch(`/movie/${tmdbId}/credits`),
  ]);
  return {
    genres: (details.genres as { name: string }[]).map((g) => g.name),
    cast: (credits.cast as { name: string; character: string; profile_path: string | null }[])
      .slice(0, 10)
      .map((c) => ({ name: c.name, character: c.character, profile_path: c.profile_path })),
  };
}
