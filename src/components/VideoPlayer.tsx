'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function VideoPlayer({ movieTitle, movieId, driveFileId }: { movieTitle: string; movieId: string; driveFileId?: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playerMode, setPlayerMode] = useState<'drive' | 'browser'>(driveFileId ? 'drive' : 'browser');
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState('');
  const [buffered, setBuffered] = useState(0);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); setShowControls(true); };
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onVol = () => { setVolume(v.volume); setMuted(v.muted); };
    const onErr = () => setError('Could not load video. Check stream route or service account.');
    const onProg = () => {
      if (v.buffered.length > 0) setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('volumechange', onVol);
    v.addEventListener('error', onErr);
    v.addEventListener('progress', onProg);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('volumechange', onVol);
      v.removeEventListener('error', onErr);
      v.removeEventListener('progress', onProg);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Number(e.target.value);
    v.muted = false;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
  };

  const skip = (s: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.currentTime + s, v.duration));
  };

  const onKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ': case 'k': e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft': e.preventDefault(); skip(-10); break;
      case 'ArrowRight': e.preventDefault(); skip(10); break;
      case 'ArrowUp': e.preventDefault(); if (videoRef.current) videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1); break;
      case 'ArrowDown': e.preventDefault(); if (videoRef.current) videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1); break;
      case 'f': e.preventDefault(); toggleFullscreen(); break;
      case 'm': e.preventDefault(); toggleMute(); break;
    }
    scheduleHide();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Drive iframe player
  if (playerMode === 'drive' && driveFileId) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
          <button onClick={() => router.back()} style={btnStyle}>← Back</button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movieTitle}</span>
          {/* Player toggle */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 4 }}>
            <button
              onClick={() => setPlayerMode('drive')}
              style={{ ...toggleBtn, background: playerMode === 'drive' ? 'rgba(255,255,255,0.2)' : 'transparent', color: playerMode === 'drive' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              Drive Player
            </button>
            <button
              onClick={() => setPlayerMode('browser')}
              style={{ ...toggleBtn, background: playerMode === 'browser' ? 'rgba(255,255,255,0.2)' : 'transparent', color: playerMode === 'browser' ? '#fff' : 'rgba(255,255,255,0.4)' }}
            >
              Browser Player
            </button>
          </div>
        </div>
        <iframe
          src={`https://drive.google.com/file/d/${driveFileId}/preview`}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={scheduleHide}
      onKeyDown={onKey}
      onClick={togglePlay}
      tabIndex={0}
      style={{
        position: 'fixed', inset: 0, background: '#000',
        cursor: showControls ? 'default' : 'none',
        outline: 'none',
      }}
    >
      <video
        ref={videoRef}
        src={`/api/stream/${movieId}`}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
        autoPlay
        playsInline
        onDoubleClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
      />

      {/* Error overlay */}
      {error && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: '#fff', fontSize: 15, opacity: 0.7, textAlign: 'center', maxWidth: 400 }}>
            Could not play this video in the browser.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', maxWidth: 360 }}>
            The format may not be supported. Open it in an external player instead:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
            <a
              href={`iina://weblink?url=${encodeURIComponent(window.location.origin + '/api/stream/' + movieId)}`}
              style={{ ...playerBtn, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}
            >
              🎬 Open in IINA <span style={{ fontSize: 11, opacity: 0.6 }}>(macOS)</span>
            </a>
            <a
              href={`vlc://${window.location.origin}/api/stream/${movieId}`}
              style={{ ...playerBtn, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.4)', color: '#fdba74' }}
            >
              🔶 Open in VLC
            </a>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.origin + '/api/stream/' + movieId);
                alert('Stream URL copied! Paste it into VLC → Open Network Stream');
              }}
              style={{ ...playerBtn, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            >
              📋 Copy Stream URL
            </button>
          </div>
        </div>
      )}

      {/* Big play indicator */}
      {!playing && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            ▶
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          padding: '32px 20px 20px',
          transform: showControls ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={seek}
          style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, cursor: 'pointer', marginBottom: 14, position: 'relative' }}
        >
          {/* Buffered */}
          <div style={{ position: 'absolute', height: '100%', width: `${buffered}%`, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          {/* Played */}
          <div style={{ position: 'absolute', height: '100%', width: `${progress}%`, background: '#E50914', borderRadius: 2 }}>
            <div style={{ position: 'absolute', right: -5, top: -4, width: 12, height: 12, borderRadius: '50%', background: '#E50914', boxShadow: '0 0 4px rgba(229,9,20,0.6)' }} />
          </div>
        </div>

        {/* Buttons row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Back */}
          <button onClick={() => router.back()} style={btnStyle}>← Back</button>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

          {/* Play/Pause */}
          <button onClick={togglePlay} style={{ ...iconBtn, fontSize: 18 }}>{playing ? '⏸' : '▶'}</button>

          {/* Skip */}
          <button onClick={() => skip(-10)} style={iconBtn} title="-10s">⏮ 10</button>
          <button onClick={() => skip(10)} style={iconBtn} title="+10s">10 ⏭</button>

          {/* Time */}
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, minWidth: 90 }}>
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Title */}
          <span style={{ flex: 1, color: '#fff', fontWeight: 600, fontSize: 14, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {movieTitle}
          </span>

          {/* Volume */}
          <button onClick={toggleMute} style={iconBtn}>{muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</button>
          <input
            type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
            onChange={changeVolume}
            style={{ width: 70, accentColor: '#E50914', cursor: 'pointer' }}
          />

          {/* Player toggle */}
          {driveFileId && (
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 3, marginLeft: 4 }}>
              <button onClick={() => setPlayerMode('drive')} style={{ ...toggleBtn, color: 'rgba(255,255,255,0.5)' }}>Drive</button>
              <button style={{ ...toggleBtn, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Browser</button>
            </div>
          )}

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} style={iconBtn}>{fullscreen ? '⛶' : '⛶'}</button>
        </div>
      </div>

      {/* Top back bar (always visible briefly) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        transform: showControls ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.25s ease',
        pointerEvents: showControls ? 'auto' : 'none',
      }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          ← Back
        </button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {movieTitle}
        </span>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontWeight: 700,
  padding: '6px 12px',
  borderRadius: 7,
  cursor: 'pointer',
  fontSize: 13,
};

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '4px 6px',
  fontSize: 16,
  borderRadius: 6,
  opacity: 0.85,
};

const toggleBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.15s',
};

const playerBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
};
