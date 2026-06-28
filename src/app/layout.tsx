import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'FamilyFlix',
  description: 'Your family movie streaming app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-netflix-dark text-white">
        {children}
      </body>
    </html>
  );
}
