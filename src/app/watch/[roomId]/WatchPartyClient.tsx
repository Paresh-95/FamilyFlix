'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

type PeerState = { stream: MediaStream | null; pc: RTCPeerConnection };

function RemoteVideo({ stream, label }: { stream: MediaStream | null; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-4xl">👤</div>
      )}
      <span className="absolute bottom-1 left-2 text-white text-xs font-semibold drop-shadow">{label}</span>
    </div>
  );
}

export default function WatchPartyClient({
  roomId,
  streamUrl,
  title,
}: {
  roomId: string;
  streamUrl: string;
  title: string;
}) {
  const [peerId] = useState<string>(() => crypto.randomUUID());
  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [peerCount, setPeerCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [camError, setCamError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const syncingRef = useRef(false);

  const supabase = createBrowserClient();

  // ── Create a peer connection for a remote peer ─────────────────────────
  const createPC = useCallback(
    (remotePeerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      localStreamRef.current
        ?.getTracks()
        .forEach((t) => pc.addTrack(t, localStreamRef.current!));

      pc.ontrack = (e) => {
        setPeers((prev) => ({
          ...prev,
          [remotePeerId]: { pc, stream: e.streams[0] ?? null },
        }));
      };

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc',
          payload: { to: remotePeerId, from: peerId, kind: 'ice', candidate: e.candidate },
        });
      };

      pcsRef.current[remotePeerId] = pc;
      return pc;
    },
    [peerId]
  );

  // ── Initiate offer to a newly-joined peer ─────────────────────────────
  const initiateConnection = useCallback(
    async (remotePeerId: string) => {
      const pc = createPC(remotePeerId);
      setPeers((prev) => ({ ...prev, [remotePeerId]: { pc, stream: null } }));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'webrtc',
        payload: { to: remotePeerId, from: peerId, kind: 'offer', sdp: offer },
      });
    },
    [createPC, peerId]
  );

  // ── Handle incoming WebRTC signal ─────────────────────────────────────
  const handleWebRTCSignal = useCallback(
    async (payload: {
      from: string;
      kind: string;
      sdp?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
    }) => {
      const { from, kind, sdp, candidate } = payload;
      let pc = pcsRef.current[from];

      if (kind === 'offer') {
        if (!pc) {
          pc = createPC(from);
          setPeers((prev) => ({ ...prev, [from]: { pc, stream: null } }));
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp!));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc',
          payload: { to: from, from: peerId, kind: 'answer', sdp: answer },
        });
      } else if (kind === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp!));
      } else if (kind === 'ice' && pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },
    [createPC, peerId]
  );

  // ── Broadcast current playback state ─────────────────────────────────
  const broadcastSync = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'sync',
      payload: {
        from: peerId,
        playing: !v.paused,
        currentTime: v.currentTime,
        serverTime: Date.now(),
      },
    });
  }, [peerId]);

  // ── Apply received sync to local player ──────────────────────────────
  const applySync = useCallback(
    (payload: { from: string; playing: boolean; currentTime: number; serverTime: number }) => {
      const v = videoRef.current;
      if (!v || syncingRef.current || payload.from === peerId) return;

      syncingRef.current = true;
      const latency = (Date.now() - payload.serverTime) / 1000;
      const target = payload.currentTime + latency;

      if (Math.abs(v.currentTime - target) > 1.5) v.currentTime = target;
      if (payload.playing && v.paused) v.play().catch(() => {});
      if (!payload.playing && !v.paused) v.pause();

      setTimeout(() => { syncingRef.current = false; }, 500);
    },
    [peerId]
  );

  // ── Start camera + mic ────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(() => setCamError(true));

    return () => localStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ── Join Supabase Realtime channel ────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel(`watch:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: peerId } },
    });

    ch
      .on('presence', { event: 'sync' }, () => {
        setPeerCount(Object.keys(ch.presenceState()).length);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const p of newPresences as Array<{ peerId?: string }>) {
          const id = p.peerId;
          if (id && id !== peerId) initiateConnection(id);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences as Array<{ peerId?: string }>) {
          const id = p.peerId;
          if (!id) continue;
          pcsRef.current[id]?.close();
          delete pcsRef.current[id];
          setPeers((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
        setPeerCount(Object.keys(ch.presenceState()).length);
      })
      .on('broadcast', { event: 'webrtc' }, ({ payload }) => {
        if (payload.to !== peerId) return;
        handleWebRTCSignal(payload);
      })
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        applySync(payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ peerId, joinedAt: Date.now() });
        }
      });

    channelRef.current = ch;

    return () => {
      ch.unsubscribe();
      Object.values(pcsRef.current).forEach((pc) => pc.close());
    };
  }, [roomId, peerId, initiateConnection, handleWebRTCSignal, applySync]);

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

  const remotePeers = Object.entries(peers);

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/90 border-b border-white/10 shrink-0">
        <a href="/" className="text-white/50 hover:text-white text-sm transition-colors shrink-0">← Back</a>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-red-500 font-black text-sm">FF</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-white font-semibold text-sm truncate">{title}</span>
        </div>
        <span className="text-white/40 text-xs shrink-0">{peerCount} watching</span>
        <button
          onClick={copyLink}
          className="shrink-0 text-xs bg-netflix-red hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {copied ? '✓ Link copied!' : '🔗 Invite'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ── Movie player ── */}
        <div className="flex-1 flex items-center justify-center bg-black min-h-0">
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full h-full object-contain"
            controls
            playsInline
            onPlay={broadcastSync}
            onPause={broadcastSync}
            onSeeked={broadcastSync}
          />
        </div>

        {/* ── Camera sidebar ── */}
        <div className="md:w-56 lg:w-64 flex flex-col bg-zinc-950 border-t md:border-t-0 md:border-l border-white/10 shrink-0">

          {/* Camera feeds */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-row md:flex-col gap-2">

            {/* Local feed */}
            <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden shrink-0 w-32 md:w-full">
              {!camError ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover scale-x-[-1] transition-opacity ${camOn ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {!camOn && (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">👤</div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">👤</div>
              )}
              <div className="absolute bottom-1 left-2 flex items-center gap-1">
                <span className="text-white text-xs font-semibold drop-shadow">You</span>
                {!micOn && <span className="text-red-400 text-xs">🔇</span>}
              </div>
            </div>

            {/* Remote feeds */}
            {remotePeers.map(([id, peer], i) => (
              <div key={id} className="shrink-0 w-32 md:w-full">
                <RemoteVideo stream={peer.stream} label={`Guest ${i + 1}`} />
              </div>
            ))}

            {remotePeers.length === 0 && (
              <div className="hidden md:flex flex-1 items-center justify-center text-center px-4 py-8">
                <p className="text-white/20 text-xs">Share the invite link to watch together</p>
              </div>
            )}
          </div>

          {/* Mic / Cam controls */}
          {!camError && (
            <div className="p-2 border-t border-white/10 flex gap-2 shrink-0">
              <button
                onClick={toggleMic}
                title={micOn ? 'Mute mic' : 'Unmute mic'}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                  micOn ? 'bg-white/8 text-white/70 hover:bg-white/15' : 'bg-red-600/80 text-white'
                }`}
              >
                {micOn ? '🎤 Mic' : '🔇 Muted'}
              </button>
              <button
                onClick={toggleCam}
                title={camOn ? 'Turn off camera' : 'Turn on camera'}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                  camOn ? 'bg-white/8 text-white/70 hover:bg-white/15' : 'bg-red-600/80 text-white'
                }`}
              >
                {camOn ? '📷 Cam' : '📷 Off'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
