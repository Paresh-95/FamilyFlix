'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Constants ────────────────────────────────────────────────────────────────
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];
const SYNC_DRIFT_THRESHOLD = 2;   // seconds before we force-seek
const SYNC_HEARTBEAT_MS   = 5000; // host broadcasts every 5s

// ── Types ────────────────────────────────────────────────────────────────────
type PeerInfo = {
  pc: RTCPeerConnection;
  stream: MediaStream | null;
  name: string;
  connState: RTCPeerConnectionState;
};

type ChatMsg = { id: string; name: string; text: string; time: number; self: boolean };

// ── Audio level hook (speaking detection) ───────────────────────────────────
function useSpeaking(stream: MediaStream | null, enabled: boolean): boolean {
  const [speaking, setSpeaking] = useState(false);
  const rafRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !enabled) { setSpeaking(false); return; }
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      setSpeaking(avg > 18);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close().catch(() => {});
    };
  }, [stream, enabled]);

  return speaking;
}

// ── CameraFeed component ─────────────────────────────────────────────────────
function CameraFeed({
  stream, name, muted = false, mirrored = false, label, isSelf = false,
  micOff = false, camOff = false, connState,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  mirrored?: boolean;
  label?: string;
  isSelf?: boolean;
  micOff?: boolean;
  camOff?: boolean;
  connState?: RTCPeerConnectionState;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const speaking = useSpeaking(stream, !micOff);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null;
  }, [stream]);

  const initial = (name[0] ?? '?').toUpperCase();
  const showVideo = !!stream && !camOff;
  const isConnecting = connState === 'connecting' || connState === 'new';

  const dotColor =
    connState === 'connected'    ? 'bg-green-400' :
    isConnecting                  ? 'bg-yellow-400 animate-pulse' :
    connState === 'failed'        ? 'bg-red-500' : 'bg-zinc-500';

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden bg-zinc-900 transition-all duration-200 ${
      speaking ? 'ring-2 ring-green-400' : 'ring-2 ring-transparent'
    }`}>
      {showVideo ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          {isConnecting ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white/40 text-xs">Connecting</span>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-lg">
              {initial}
            </div>
          )}
        </div>
      )}

      {/* Bottom label bar */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
        <span className="text-white text-xs font-semibold truncate flex items-center gap-1">
          {label ?? name}
          {isSelf && <span className="text-yellow-400 text-xs">👑</span>}
        </span>
        <div className="flex items-center gap-1">
          {micOff  && <span className="text-red-400 text-xs">🔇</span>}
          {camOff  && !isSelf && <span className="text-zinc-400 text-xs">📷</span>}
          {connState && !isSelf && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
        </div>
      </div>
    </div>
  );
}

// ── Name modal ───────────────────────────────────────────────────────────────
function NameModal({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [value, setValue] = useState('');
  const submit = () => { const n = value.trim(); if (n) onConfirm(n); };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-4xl mb-4 text-center">🎉</div>
        <h2 className="text-white font-bold text-xl text-center mb-1">Join Watch Party</h2>
        <p className="text-white/40 text-sm text-center mb-6">What should we call you?</p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Your name"
          maxLength={20}
          className="w-full bg-zinc-800 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 mb-4"
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Join Party
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function WatchPartyClient({
  roomId, streamUrl, title,
}: {
  roomId: string; streamUrl: string; title: string;
}) {
  // Identity
  const [peerId]   = useState(() => crypto.randomUUID());
  const [myName, setMyName] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('wp-name') : null
  );

  // Peers
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});

  // Media
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Video player
  const videoRef    = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [buffering, setBuffering] = useState(false);

  // Sync
  const syncingRef    = useRef(false);
  const isHostRef     = useRef(false);
  const heartbeatRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chat
  const [chatOpen, setChatOpen]   = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages]   = useState<ChatMsg[]>([]);
  const [unread, setUnread]       = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // UI
  const [copied, setCopied]           = useState(false);
  const [peerNames, setPeerNames]     = useState<Record<string, string>>({});
  const [peerCount, setPeerCount]     = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase   = createBrowserClient();

  const localSpeaking = useSpeaking(localStream, micOn);

  // ── Broadcast playback state ───────────────────────────────────────────
  const broadcastSync = useCallback((force = false) => {
    const v = videoRef.current;
    if (!v || (!isHostRef.current && !force)) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'sync',
      payload: { from: peerId, playing: !v.paused, currentTime: v.currentTime, serverTime: Date.now() },
    });
  }, [peerId]);

  // ── Apply received sync ────────────────────────────────────────────────
  const applySync = useCallback((payload: {
    from: string; playing: boolean; currentTime: number; serverTime: number;
  }) => {
    const v = videoRef.current;
    if (!v || payload.from === peerId) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    const latency = (Date.now() - payload.serverTime) / 1000;
    const target  = payload.currentTime + latency;

    if (Math.abs(v.currentTime - target) > SYNC_DRIFT_THRESHOLD) {
      v.currentTime = Math.max(0, target);
    }
    if (payload.playing && v.paused && videoReady)  v.play().catch(() => {});
    if (!payload.playing && !v.paused) v.pause();

    setTimeout(() => { syncingRef.current = false; }, 800);
  }, [peerId, videoReady]);

  // ── Create RTCPeerConnection ───────────────────────────────────────────
  const createPC = useCallback((remotePeerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStreamRef.current?.getTracks().forEach((t) => {
      pc.addTrack(t, localStreamRef.current!);
    });

    pc.ontrack = (e) => {
      setPeers((prev) => ({
        ...prev,
        [remotePeerId]: { ...prev[remotePeerId], pc, stream: e.streams[0] ?? null },
      }));
    };

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      channelRef.current?.send({
        type: 'broadcast', event: 'webrtc',
        payload: { to: remotePeerId, from: peerId, kind: 'ice', candidate: e.candidate },
      });
    };

    pc.onconnectionstatechange = () => {
      setPeers((prev) => prev[remotePeerId]
        ? { ...prev, [remotePeerId]: { ...prev[remotePeerId], connState: pc.connectionState } }
        : prev
      );
      // Auto-retry on failure
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    pcsRef.current[remotePeerId] = pc;
    return pc;
  }, [peerId]);

  // ── Initiate offer ────────────────────────────────────────────────────
  const initiateConnection = useCallback(async (remotePeerId: string, remoteName: string) => {
    if (pcsRef.current[remotePeerId]) return; // already connected
    const pc = createPC(remotePeerId);
    setPeers((prev) => ({
      ...prev,
      [remotePeerId]: { pc, stream: null, name: remoteName, connState: 'new' },
    }));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    channelRef.current?.send({
      type: 'broadcast', event: 'webrtc',
      payload: { to: remotePeerId, from: peerId, fromName: myName, kind: 'offer', sdp: offer },
    });
  }, [createPC, peerId, myName]);

  // ── Handle WebRTC signal ──────────────────────────────────────────────
  const handleWebRTCSignal = useCallback(async (payload: {
    from: string; fromName?: string; kind: string;
    sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit;
  }) => {
    const { from, fromName, kind, sdp, candidate } = payload;
    let pc = pcsRef.current[from];

    if (kind === 'offer') {
      if (!pc) {
        pc = createPC(from);
        setPeers((prev) => ({
          ...prev,
          [from]: { pc, stream: null, name: fromName ?? 'Guest', connState: 'new' },
        }));
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp!));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channelRef.current?.send({
        type: 'broadcast', event: 'webrtc',
        payload: { to: from, from: peerId, fromName: myName, kind: 'answer', sdp: answer },
      });
      // Send current sync to the new peer
      setTimeout(() => broadcastSync(true), 500);
    } else if (kind === 'answer' && pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp!));
    } else if (kind === 'ice' && pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
  }, [createPC, peerId, myName, broadcastSync]);

  // ── Start camera + mic ────────────────────────────────────────────────
  useEffect(() => {
    if (!myName) return;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch((err) => {
        setMediaError(err.name === 'NotAllowedError'
          ? 'Camera/mic access denied. You can still watch together.'
          : 'Could not access camera/mic.');
        // Try audio only
        navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
          localStreamRef.current = s;
          setLocalStream(s);
        }).catch(() => {});
      });

    return () => localStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, [myName]);

  // ── Join Supabase Realtime channel ────────────────────────────────────
  useEffect(() => {
    if (!myName) return;

    const ch = supabase.channel(`watch:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: peerId } },
    });

    ch
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<{ peerId: string; name: string }>();
        const ids   = Object.keys(state);
        setPeerCount(ids.length);

        // Lexicographically first peer = host
        const sorted = [...ids].sort();
        isHostRef.current = sorted[0] === peerId;

        // Build name map
        const names: Record<string, string> = {};
        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (p.peerId) names[p.peerId] = p.name;
          }
        }
        setPeerNames(names);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const p of newPresences as Array<{ peerId?: string; name?: string }>) {
          const id = p.peerId;
          if (id && id !== peerId) initiateConnection(id, p.name ?? 'Guest');
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences as Array<{ peerId?: string }>) {
          const id = p.peerId;
          if (!id) continue;
          pcsRef.current[id]?.close();
          delete pcsRef.current[id];
          setPeers((prev) => { const n = { ...prev }; delete n[id]; return n; });
        }
      })
      .on('broadcast', { event: 'webrtc' }, ({ payload }) => {
        if (payload.to !== peerId) return;
        handleWebRTCSignal(payload);
      })
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        applySync(payload);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        const msg: ChatMsg = {
          id: payload.id, name: payload.name, text: payload.text,
          time: payload.time, self: false,
        };
        setMessages((prev) => [...prev, msg]);
        setUnread((n) => chatOpen ? 0 : n + 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ peerId, name: myName, joinedAt: Date.now() });
        }
      });

    channelRef.current = ch;

    return () => {
      ch.unsubscribe();
      Object.values(pcsRef.current).forEach((pc) => pc.close());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myName, roomId, peerId]);

  // ── Host heartbeat (sync every 5s) ────────────────────────────────────
  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      if (isHostRef.current) broadcastSync();
    }, SYNC_HEARTBEAT_MS);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [broadcastSync]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'm' || e.key === 'M') toggleMic();
      if (e.key === 'v' || e.key === 'V') toggleCam();
      if (e.key === 'c' || e.key === 'C') { setChatOpen((o) => !o); setUnread(0); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  // ── Fullscreen ────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Auto-hide controls on mouse inactivity ────────────────────────────
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // ── Scroll chat to bottom ─────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatOpen) setUnread(0);
  }, [chatOpen]);

  // ── Controls ──────────────────────────────────────────────────────────
  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((v) => !v);
  };

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((v) => !v);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    const msg: ChatMsg = { id: crypto.randomUUID(), name: myName!, text, time: Date.now(), self: true };
    setMessages((prev) => [...prev, msg]);
    setChatInput('');
    channelRef.current?.send({
      type: 'broadcast', event: 'chat',
      payload: { id: msg.id, name: myName, text, time: msg.time },
    });
  };

  const confirmName = (name: string) => {
    localStorage.setItem('wp-name', name);
    setMyName(name);
  };

  const remotePeers = Object.entries(peers);
  const isHost = isHostRef.current;

  // ── Name modal ────────────────────────────────────────────────────────
  if (!myName) return <NameModal onConfirm={confirmName} />;

  return (
    <div ref={containerRef} className="h-screen bg-black flex flex-col overflow-hidden select-none">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950/95 border-b border-white/8 shrink-0 z-10">
        <a href="/" className="text-white/40 hover:text-white text-sm transition-colors shrink-0">←</a>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-red-500 font-black text-sm">FF</span>
          <span className="text-white/20">·</span>
          <span className="text-white/80 font-semibold text-sm truncate">{title}</span>
          {isHost && <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-semibold shrink-0">Host</span>}
        </div>
        <span className="text-white/30 text-xs shrink-0">
          {peerCount} {peerCount === 1 ? 'viewer' : 'viewers'}
        </span>
        <button
          onClick={() => { setChatOpen((o) => !o); setUnread(0); }}
          className="relative shrink-0 text-white/50 hover:text-white text-sm transition-colors p-1.5"
          title="Chat (C)"
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </button>
        <button
          onClick={copyLink}
          className="shrink-0 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? '✓ Copied!' : '🔗 Invite'}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Video player ── */}
        <div
          className="flex-1 relative bg-black flex items-center justify-center min-w-0"
          onMouseMove={resetControlsTimer}
        >
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full h-full object-contain"
            playsInline
            onCanPlay={() => setVideoReady(true)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onPlay={() => { setBuffering(false); if (!syncingRef.current) broadcastSync(); }}
            onPause={() => { if (!syncingRef.current) broadcastSync(); }}
            onSeeked={() => { if (!syncingRef.current) broadcastSync(); }}
          />

          {/* Buffering spinner */}
          {buffering && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Floating controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <div className="px-4 pb-3 pt-8 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3">
              <button
                onClick={toggleMic}
                title={`${micOn ? 'Mute' : 'Unmute'} (M)`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                  micOn ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {micOn ? '🎤' : '🔇'}
              </button>
              <button
                onClick={toggleCam}
                title={`${camOn ? 'Camera off' : 'Camera on'} (V)`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                  camOn ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {camOn ? '📷' : '🚫'}
              </button>
              <div className="flex-1" />
              {!isHost && (
                <span className="text-white/30 text-xs">Synced · host controls</span>
              )}
              <button
                onClick={toggleFullscreen}
                title="Fullscreen (F)"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-sm transition-all"
              >
                {isFullscreen ? '⛶' : '⛶'}
              </button>
            </div>
          </div>

          {/* Media error toast */}
          {mediaError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-600/90 text-white text-xs px-4 py-2 rounded-xl max-w-xs text-center">
              {mediaError}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-56 lg:w-64 flex flex-col bg-zinc-950 border-l border-white/8 shrink-0">

          {/* Camera grid */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
            {/* Local */}
            <CameraFeed
              stream={localStream}
              name={myName}
              muted
              mirrored
              label={myName}
              isSelf
              micOff={!micOn}
              camOff={!camOn || !localStream?.getVideoTracks().length}
            />

            {/* Remote peers */}
            {remotePeers.map(([id, peer], i) => (
              <CameraFeed
                key={id}
                stream={peer.stream}
                name={peer.name || peerNames[id] || `Guest ${i + 1}`}
                connState={peer.connState}
              />
            ))}

            {remotePeers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-white/20 text-xs">No one else here yet</p>
                <button
                  onClick={copyLink}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline transition-colors"
                >
                  Copy invite link
                </button>
              </div>
            )}
          </div>

          {/* ── Chat panel ── */}
          {chatOpen && (
            <div className="h-56 flex flex-col border-t border-white/8">
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.length === 0 && (
                  <p className="text-white/20 text-xs text-center pt-4">No messages yet</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.self ? 'items-end' : 'items-start'}`}>
                    {!m.self && (
                      <span className="text-white/40 text-xs mb-0.5">{m.name}</span>
                    )}
                    <span className={`text-xs px-3 py-1.5 rounded-2xl max-w-[90%] break-words ${
                      m.self
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/80'
                    }`}>
                      {m.text}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-1.5 p-2 border-t border-white/8">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Message…"
                  maxLength={200}
                  className="flex-1 bg-white/8 text-white text-xs placeholder-white/30 rounded-lg px-3 py-2 outline-none focus:bg-white/12 min-w-0"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-30 text-white text-xs font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          )}

          {/* Controls strip */}
          <div className="p-2 border-t border-white/8 flex gap-2 shrink-0">
            <button
              onClick={toggleMic}
              title={`${micOn ? 'Mute' : 'Unmute'} (M)`}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                micOn ? 'bg-white/8 text-white/70 hover:bg-white/15' : 'bg-red-600/90 text-white'
              } ${localSpeaking && micOn ? 'ring-2 ring-green-400' : ''}`}
            >
              {micOn ? '🎤' : '🔇'}
              <span>{micOn ? 'Mic' : 'Muted'}</span>
            </button>
            <button
              onClick={toggleCam}
              title={`${camOn ? 'Off' : 'On'} (V)`}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                camOn ? 'bg-white/8 text-white/70 hover:bg-white/15' : 'bg-red-600/90 text-white'
              }`}
            >
              {camOn ? '📷' : '🚫'}
              <span>{camOn ? 'Cam' : 'Off'}</span>
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="px-3 pb-2 text-center">
            <span className="text-white/15 text-xs">M · V · C · F</span>
          </div>
        </div>
      </div>
    </div>
  );
}
