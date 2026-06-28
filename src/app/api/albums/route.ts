import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('photo_albums')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { name, driveFolderId } = await req.json();
  if (!name || !driveFolderId) {
    return NextResponse.json({ error: 'name and driveFolderId are required' }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('photo_albums')
    .insert({ name, drive_folder_id: driveFolderId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
