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

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
