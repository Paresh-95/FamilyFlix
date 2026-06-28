import { google } from 'googleapis';

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
