'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TMDB_IMAGE_BASE } from '@/lib/tmdb';
import { Series, Episode } from '@/lib/supabase';

export default function SeriesDetailClient({ series, episodes }: { series: Series; episodes: Episode[] }) {
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);

  const seasons = useMemo(() => {
    const set = new Set(episodes.map((e) => e.season_number));
    return Array.from(set).sort((a, b) => a - b);
  }, [episodes]);

  const filteredEpisodes = useMemo(
    () => episodes.filter((e) => e.season_number === selectedSeason),
    [episodes, selectedSeason]
  );

  const backdrop = series.backdrop_path ? `${TMDB_IMAGE_BASE}/original${series.backdrop_path}` : null;
  const poster   = series.poster_path   ? `${TMDB_IMAGE_BASE}/original${series.poster_path}`   : null;

  if (playingEpisode) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(0,0,0,0.9)' }}>
          <button
            onClick={() => setPlayingEpisode(null)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            ← Back
          </button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, opacity: 0.85 }}>
            {series.title} · S{String(playingEpisode.season_number).padStart(2, '0')}E{String(playingEpisode.episode_number).padStart(2, '0')} · {playingEpisode.title}
          </span>
        </div>
        <video
          key={playingEpisode.id}
          src={`/api/stream/episode/${playingEpisode.id}`}
          style={{ flex: 1, width: '100%', background: '#000' }}
          controls
          autoPlay
          playsInline
        />
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[360px]">
        {backdrop ? (
          <Image src={backdrop} alt={series.title} fill priority className="object-cover object-top" sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-zinc-900" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.4) 60%, transparent 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 pb-24 -mt-48 relative z-10">
        <div className="max-w-6xl">

          {/* Header row */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            {poster && (
              <div className="shrink-0 self-start">
                <div className="relative w-44 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
                  <Image src={poster} alt={series.title} fill className="object-cover" sizes="224px" />
                </div>
              </div>
            )}

            <div className="flex-1 pt-2">
              {series.genres && series.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {series.genres.map((g) => (
                    <span key={g} className="text-xs font-semibold uppercase tracking-wider text-white/50 bg-white/8 border border-white/10 px-3 py-1 rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
                {series.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                {series.rating && (
                  <span className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 font-bold px-3 py-1.5 rounded-lg">
                    ★ {series.rating}
                  </span>
                )}
                {series.first_air_year && (
                  <span className="text-white/50 font-medium">{series.first_air_year}</span>
                )}
                <span className="text-white/50 font-medium">{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</span>
              </div>

              {series.overview && (
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">{series.overview}</p>
              )}

              {episodes.length > 0 && (
                <button
                  onClick={() => setPlayingEpisode(filteredEpisodes[0] ?? episodes[0])}
                  className="flex items-center gap-3 bg-white text-black font-bold text-lg px-10 py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-black/30 mb-4"
                >
                  <span className="text-xl">▶</span> Play First Episode
                </button>
              )}

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          {/* Season tabs */}
          {seasons.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedSeason === s
                      ? 'bg-white text-black'
                      : 'bg-white/8 text-white/60 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>
          )}

          {/* Episode list */}
          {filteredEpisodes.length === 0 ? (
            <div className="text-center py-16 text-white/30">No episodes found for this season.</div>
          ) : (
            <div className="grid gap-3">
              {filteredEpisodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => setPlayingEpisode(ep)}
                  className="w-full flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/6 hover:bg-white/8 hover:border-white/15 transition-all text-left group"
                >
                  {/* Thumbnail or episode number */}
                  <div className="shrink-0 relative w-32 md:w-40 aspect-video rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {ep.still_path ? (
                      <Image
                        src={`${TMDB_IMAGE_BASE}/w300${ep.still_path}`}
                        alt={ep.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="160px"
                      />
                    ) : (
                      <span className="text-white/20 text-2xl font-black">
                        {String(ep.episode_number).padStart(2, '0')}
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white text-sm ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/30 text-xs font-bold uppercase tracking-wider">
                        E{String(ep.episode_number).padStart(2, '0')}
                      </span>
                      {ep.air_date && (
                        <span className="text-white/20 text-xs">{ep.air_date.slice(0, 4)}</span>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm md:text-base leading-snug mb-1 truncate">{ep.title}</p>
                    {ep.overview && (
                      <p className="text-white/40 text-xs md:text-sm leading-relaxed line-clamp-2">{ep.overview}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
