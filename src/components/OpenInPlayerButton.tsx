'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, MonitorPlay, X } from 'lucide-react';
import { IINAIcon, VLCIcon } from './PlayerIcons';

function VLCInstructionsModal({ onClose, onDownload }: { onClose: () => void; onDownload: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6"
        style={{ background: '#111' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <VLCIcon size={36} />
          <div>
            <h2 className="text-white font-bold text-lg">Open in VLC</h2>
            <p className="text-white/40 text-xs">One-time setup for seamless playback</p>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-5">
          A <span className="text-white font-medium">stream.m3u</span> file will download. To make VLC open it automatically every time, follow these steps:
        </p>

        <ol className="space-y-3 mb-6">
          {[
            { step: '1', text: 'Click "Download & Open" below' },
            { step: '2', text: 'In Chrome, right-click the downloaded file in the bottom bar → Always open files of this type' },
            { step: '3', text: 'On Windows, right-click the file → Open with → VLC → check Always use this app' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center font-bold">{step}</span>
              <span className="text-white/70 text-sm">{text}</span>
            </li>
          ))}
        </ol>

        <p className="text-white/30 text-xs mb-5">
          After the one-time setup, clicking "Open in VLC" will launch VLC instantly with no prompts.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onDownload(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-colors"
          >
            Download & Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OpenInPlayerButton({ movieId }: { movieId: string }) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVLCModal, setShowVLCModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const streamUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/drive-url/${movieId}`
    : '';

  function openIINA() {
    const a = document.createElement('a');
    a.href = `iina://weblink?url=${encodeURIComponent(streamUrl)}`;
    a.click();
    setOpen(false);
  }

  function downloadM3U() {
    const m3u = `#EXTM3U\n#EXTINF:-1,Stream\n${streamUrl}`;
    const blob = new Blob([m3u], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stream.m3u';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {showVLCModal && (
        <VLCInstructionsModal
          onClose={() => setShowVLCModal(false)}
          onDownload={downloadM3U}
        />
      )}

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
            <button
              onClick={() => { setOpen(false); setShowVLCModal(true); }}
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
    </>
  );
}
