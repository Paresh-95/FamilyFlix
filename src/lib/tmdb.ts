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

export async function searchTV(title: string) {
  const data = await tmdbFetch('/search/tv', { query: title });
  return (data.results ?? []).slice(0, 5).map((s: Record<string, unknown>) => ({
    id: s.id as number,
    name: s.name as string,
    year: s.first_air_date ? String(s.first_air_date).slice(0, 4) : undefined,
    poster_path: s.poster_path as string | null,
  }));
}

export async function getTVDetails(tmdbId: number) {
  const details = await tmdbFetch(`/tv/${tmdbId}`);
  return {
    title: details.name as string,
    overview: details.overview as string | null,
    poster_path: details.poster_path as string | null,
    backdrop_path: details.backdrop_path as string | null,
    first_air_year: details.first_air_date ? parseInt(details.first_air_date.slice(0, 4)) : null,
    rating: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
    genres: (details.genres as { name: string }[]).map((g) => g.name),
    number_of_seasons: details.number_of_seasons as number,
  };
}

export async function getTVSeason(tmdbId: number, seasonNumber: number) {
  try {
    const data = await tmdbFetch(`/tv/${tmdbId}/season/${seasonNumber}`);
    return (data.episodes ?? []).map((ep: Record<string, unknown>) => ({
      episode_number: ep.episode_number as number,
      season_number: ep.season_number as number,
      title: ep.name as string,
      overview: ep.overview as string | null,
      still_path: ep.still_path as string | null,
      air_date: ep.air_date as string | null,
    }));
  } catch {
    return [];
  }
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
