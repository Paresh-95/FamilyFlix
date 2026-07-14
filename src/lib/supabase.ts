import { createClient } from '@supabase/supabase-js';

export type Movie = {
  id: string;
  title: string;
  tmdb_id: number | null;
  drive_file_id: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  release_year: number | null;
  rating: number | null;
  genres: string[] | null;
  created_at: string;
};

export type Series = {
  id: string;
  title: string;
  tmdb_id: number | null;
  drive_folder_id: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  first_air_year: number | null;
  rating: number | null;
  genres: string[] | null;
  created_at: string;
};

export type Episode = {
  id: string;
  series_id: string;
  title: string;
  episode_number: number;
  season_number: number;
  drive_file_id: string;
  overview: string | null;
  still_path: string | null;
  air_date: string | null;
  created_at: string;
};

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
