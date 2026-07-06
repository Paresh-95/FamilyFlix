import { google } from 'googleapis';

const VIDEO_MIMES = [
  'video/mp4', 'video/x-matroska', 'video/avi', 'video/quicktime',
  'video/x-msvideo', 'video/webm', 'video/mpeg', 'video/x-ms-wmv',
];

export async function listFolderVideos(folderId: string): Promise<{ id: string; name: string }[]> {
  const token = await getDriveAccessToken();
  const mimeFilter = VIDEO_MIMES.map((m) => `mimeType='${m}'`).join(' or ');
  const q = encodeURIComponent(`'${folderId}' in parents and (${mimeFilter}) and trashed=false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&orderBy=name&pageSize=200`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive list error: ${res.status}`);
  const data = await res.json();
  return data.files ?? [];
}

let cachedToken: { token: string; expiry: number } | null = null;

export async function getDriveAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiry > now + 60_000) {
    return cachedToken.token;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const token = await auth.getAccessToken();
  if (!token) throw new Error('Failed to get Drive access token');

  cachedToken = { token: token as string, expiry: now + 55 * 60 * 1000 };
  return token as string;
}
