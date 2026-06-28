'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, LogOut, ShieldOff } from 'lucide-react';
import AdminPinModal from './AdminPinModal';

export default function Navbar() {
  const [query,       setQuery]       = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [adminModal,  setAdminModal]  = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`);
      else router.push('/');
      setSearchOpen(false);
    },
    [query, router]
  );

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  }

  async function lockAdmin() {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    router.replace('/');
  }

  function handleAdminClick(e: React.MouseEvent) {
    // If already on an admin page, allow normal navigation
    if (pathname.startsWith('/admin')) return;
    e.preventDefault();
    setAdminModal(true);
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-2 px-6 py-3 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(10,10,10,0.97)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <Link href="/" className="logo-text font-extrabold text-xl tracking-tight shrink-0 mr-2">
          FamilyFlix
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-0.5">
          <NavLink href="/" active={pathname === '/'}>Home</NavLink>
          <NavLink href="/photos" active={pathname.startsWith('/photos')}>Photos</NavLink>
          {/* Admin link — shows modal if not already in admin */}
          <Link
            href="/admin"
            onClick={handleAdminClick}
            className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith('/admin') ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/6'
            }`}
          >
            Admin
            {pathname.startsWith('/admin') && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-netflix-red" />
            )}
          </Link>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                  placeholder="Search movies…"
                  className="w-52 bg-white/10 backdrop-blur-sm text-white text-sm rounded-xl pl-8 pr-3 py-2 outline-none border border-white/15 focus:border-white/30 placeholder:text-white/30 transition-all"
                />
              </div>
              <button type="button" onClick={closeSearch}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
                <X size={15} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-colors"
            >
              <Search size={17} />
            </button>
          )}
        </div>

        {/* Lock admin (only on admin pages) */}
        {pathname.startsWith('/admin') && (
          <button
            onClick={lockAdmin}
            title="Lock admin"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-amber-400 hover:bg-amber-500/8 transition-colors"
          >
            <ShieldOff size={16} />
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </nav>

      {adminModal && <AdminPinModal onClose={() => setAdminModal(false)} />}
    </>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
        active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/6'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-netflix-red" />
      )}
    </Link>
  );
}
