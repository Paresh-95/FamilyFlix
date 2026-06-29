'use client';

export default function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 border px-4 py-3 rounded-xl text-sm font-medium ${
      type === 'error' ? 'bg-netflix-red/8 border-netflix-red/25 text-red-400' : 'bg-emerald-500/8 border-emerald-500/25 text-emerald-400'
    }`}>
      {type === 'error' ? '⚠' : '✓'} {children}
    </div>
  );
}
