'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, Clapperboard, Images, ArrowRight, Tv, PlusCircle } from 'lucide-react';
import { Movie, Series } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const [movies,     setMovies]     = useState<Movie[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  const fetchMovies = useCallback(async () => {
    const res = await fetch('/api/movies');
    setMovies(await res.json());
  }, []);

  const fetchSeries = useCallback(async () => {
    const res = await fetch('/api/series');
    setSeriesList(await res.json());
  }, []);

  useEffect(() => { fetchMovies(); fetchSeries(); }, [fetchMovies, fetchSeries]);

  const cards = [
    { href: '/admin/sync',       icon: RefreshCw,   label: 'Sync Drive',     desc: 'Auto-detect & add new content',      gradient: 'from-violet-600/20 to-violet-900/5', border: 'border-violet-500/20', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
    { href: '/admin/movies',     icon: Clapperboard, label: 'Manage Movies',  desc: `${movies.length} movies in library`, gradient: 'from-blue-600/20 to-blue-900/5',     border: 'border-blue-500/20',   iconBg: 'bg-blue-500/15',   iconColor: 'text-blue-400'   },
    { href: '/admin/series',     icon: Tv,           label: 'Manage Series',  desc: `${seriesList.length} series in library`, gradient: 'from-teal-600/20 to-teal-900/5', border: 'border-teal-500/20', iconBg: 'bg-teal-500/15', iconColor: 'text-teal-400' },
    { href: '/admin/albums',     icon: Images,       label: 'Photo Albums',   desc: 'Manage Drive photo folders',         gradient: 'from-amber-600/20 to-amber-900/5', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  ];

  const addCards = [
    { href: '/admin/add-movie',  icon: Clapperboard, label: 'Add Movie',      desc: 'Link a Drive file + TMDB metadata',  gradient: 'from-netflix-red/15 to-red-900/5',  border: 'border-netflix-red/20', iconBg: 'bg-netflix-red/15', iconColor: 'text-netflix-red' },
    { href: '/admin/add-series', icon: Tv,           label: 'Add Web Series', desc: 'Link a Drive folder + TMDB metadata', gradient: 'from-teal-600/15 to-teal-900/5',   border: 'border-teal-500/20',   iconBg: 'bg-teal-500/15',   iconColor: 'text-teal-400'   },
  ];

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-red/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-netflix-red/4 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <p className="text-netflix-red text-xs font-bold uppercase tracking-widest mb-2">Dashboard</p>
          <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">Admin Panel</h1>
          <p className="text-white/30 mt-2 text-base">
            {movies.length} movie{movies.length !== 1 ? 's' : ''} · {seriesList.length} series in your library
          </p>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24 space-y-10 max-w-5xl mx-auto">

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {cards.map(({ href, icon: Icon, label, desc, gradient, border, iconBg, iconColor }) => (
            <Link key={href} href={href}
              className={`group flex items-center gap-3 bg-gradient-to-br ${gradient} border ${border} rounded-2xl px-4 py-4 transition-all duration-200 hover:scale-[1.02] hover:brightness-110`}
            >
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-white/40 text-xs mt-0.5 truncate">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs uppercase tracking-widest font-semibold flex items-center gap-2"><PlusCircle size={12} /> Add Manually</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Add cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {addCards.map(({ href, icon: Icon, label, desc, gradient, border, iconBg, iconColor }) => (
            <Link key={href} href={href}
              className={`group flex items-center gap-4 bg-gradient-to-br ${gradient} border ${border} rounded-2xl px-6 py-5 transition-all duration-200 hover:scale-[1.02] hover:brightness-110`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base">{label}</p>
                <p className="text-white/40 text-sm mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
