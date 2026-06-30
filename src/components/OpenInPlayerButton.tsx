'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, MonitorPlay } from 'lucide-react';
import { IINAIcon, VLCIcon } from './PlayerIcons';

export default function OpenInPlayerButton({ movieId }: { movieId: string }) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const streamUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/stream/${movieId}`
    : '';

  function openIINA() {
    const a = document.createElement('a');
    a.href = `iina://weblink?url=${encodeURIComponent(streamUrl)}`;
    a.click();
    setOpen(false);
  }

  function openVLC() {
    const m3u = `#EXTM3U\n#EXTINF:-1,Stream\n${streamUrl}`;
    const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stream.m3u';
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-white/18 active:scale-95 transition-all border border-white/15"
      >
        {copied ? (
          <><Check size={18} className="text-emerald-400" /> Copied!</>
        ) : (
          <><MonitorPlay size={18} /> Open in Player <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-60 rounded-2xl border border-white/8 overflow-hidden shadow-2xl z-50"
          style={{ background: '#0e0e0e' }}>
          <button onClick={openIINA}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <IINAIcon size={32} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Open in IINA</p>
              <p className="text-white/30 text-xs">macOS — recommended</p>
            </div>
          </button>
          <button onClick={openVLC}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <VLCIcon size={32} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Open in VLC</p>
              <p className="text-white/30 text-xs">Cross-platform</p>
            </div>
          </button>
          <button onClick={copyUrl}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left">
            <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
              <Copy size={14} className="text-white/50" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Copy Stream URL</p>
              <p className="text-white/30 text-xs">Paste into any media player</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
