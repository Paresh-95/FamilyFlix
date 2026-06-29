'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FolderOpen, Images, ChevronRight, X, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import type { DriveItem } from '@/app/api/photos/route';

type Album = { id: string; name: string; drive_folder_id: string };
type Crumb = { id: string; name: string };
type PhotosResponse = { items: DriveItem[]; nextPageToken: string | null };

const PAGE_SIZE = 60;

export default function PhotosPage() {
  const [albums, setAlbums]               = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [activeAlbum, setActiveAlbum]     = useState<Album | null>(null);
  const [breadcrumbs, setBreadcrumbs]     = useState<Crumb[]>([]);
  const [items, setItems]                 = useState<DriveItem[]>([]);
  const [itemsLoading, setItemsLoading]   = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError]                 = useState('');
  const [lightbox, setLightbox]           = useState<number | null>(null);

  const photos  = items.filter((i) => !i.isFolder);
  const folders = items.filter((i) => i.isFolder);

  const currentFolderId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : null;

  useEffect(() => {
    fetch('/api/albums')
      .then((r) => r.json())
      .then((d) => setAlbums(Array.isArray(d) ? d : []))
      .catch(() => setError('Failed to load albums.'))
      .finally(() => setAlbumsLoading(false));
  }, []);

  const loadFolder = useCallback((folderId: string) => {
    setItems([]);
    setNextPageToken(null);
    setError('');
    setItemsLoading(true);
    setLightbox(null);
    const params = new URLSearchParams({ folderId, pageSize: String(PAGE_SIZE) });
    fetch(`/api/photos?${params}`)
      .then((r) => r.json())
      .then((d: PhotosResponse | { error: string }) => {
        if ('error' in d) { setError(d.error); return; }
        setItems(d.items);
        setNextPageToken(d.nextPageToken);
      })
      .catch(() => setError('Failed to load photos.'))
      .finally(() => setItemsLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    if (!currentFolderId || !nextPageToken || loadingMore) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ folderId: currentFolderId, pageToken: nextPageToken, pageSize: String(PAGE_SIZE) });
    fetch(`/api/photos?${params}`)
      .then((r) => r.json())
      .then((d: PhotosResponse | { error: string }) => {
        if ('error' in d) return;
        setItems((prev) => [...prev, ...d.items]);
        setNextPageToken(d.nextPageToken);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [currentFolderId, nextPageToken, loadingMore]);

  function openAlbum(album: Album) {
    setActiveAlbum(album);
    setBreadcrumbs([{ id: album.drive_folder_id, name: album.name }]);
    loadFolder(album.drive_folder_id);
  }

  function enterSubfolder(folder: DriveItem) {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    loadFolder(folder.id);
  }

  function navigateToCrumb(index: number) {
    const crumb = breadcrumbs[index];
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    loadFolder(crumb.id);
  }

  function closeAlbum() {
    setActiveAlbum(null);
    setBreadcrumbs([]);
    setItems([]);
    setNextPageToken(null);
    setError('');
    setLightbox(null);
  }

  const prev = useCallback(() => setLightbox((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const next = useCallback(() => setLightbox((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prev, next]);

  return (
    <div className="min-h-screen bg-netflix-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-10 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          {/* Breadcrumb trail */}
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            {!activeAlbum ? (
              <span className="text-white/30">Photos</span>
            ) : (
              <>
                <button onClick={closeAlbum} className="text-white/40 hover:text-white transition-colors">Photos</button>
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-2">
                    <ChevronRight size={13} className="text-white/20" />
                    {i < breadcrumbs.length - 1 ? (
                      <button onClick={() => navigateToCrumb(i)} className="text-white/40 hover:text-white transition-colors truncate max-w-[140px]">{crumb.name}</button>
                    ) : (
                      <span className="text-white/70 truncate max-w-[200px]">{crumb.name}</span>
                    )}
                  </span>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Images size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">
                {activeAlbum ? breadcrumbs[breadcrumbs.length - 1]?.name : 'Photos'}
              </h1>
              {activeAlbum && !itemsLoading && (
                <p className="text-white/30 text-sm mt-0.5">
                  {folders.length > 0 && `${folders.length} folder${folders.length !== 1 ? 's' : ''} · `}
                  {photos.length}{nextPageToken ? '+' : ''} photo{photos.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-24">

        {/* Albums grid */}
        {!activeAlbum && (
          <>
            {albumsLoading && <Spinner label="Loading albums…" />}

            {!albumsLoading && albums.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 border border-white/5 rounded-2xl gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <FolderOpen size={28} className="text-white/20" />
                </div>
                <div className="text-center">
                  <p className="text-white/40 font-semibold">No photo albums yet.</p>
                  <Link href="/admin/albums" className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block transition-colors">
                    Add an album in Admin →
                  </Link>
                </div>
              </div>
            )}

            {albums.length > 0 && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {albums.map((album) => (
                  <button key={album.id} onClick={() => openAlbum(album)}
                    className="group text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-amber-500/25 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <div className="h-36 flex items-center justify-center bg-amber-500/8 group-hover:bg-amber-500/12 transition-colors">
                      <FolderOpen size={52} className="text-amber-400/50 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-white font-semibold text-sm truncate">{album.name}</p>
                      <p className="text-white/20 text-xs font-mono mt-0.5 truncate">{album.drive_folder_id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Folder contents */}
        {activeAlbum && (
          <>
            {itemsLoading && <Spinner label="Loading…" />}

            {error && (
              <div className="flex items-center gap-3 bg-netflix-red/8 border border-netflix-red/25 text-red-400 px-5 py-4 rounded-xl text-sm mt-4">
                ⚠ {error}
              </div>
            )}

            {!itemsLoading && !error && items.length === 0 && (
              <div className="text-center py-24 border border-white/5 rounded-2xl">
                <p className="text-white/30">This folder is empty.</p>
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-8">
                {/* Subfolders */}
                {folders.length > 0 && (
                  <div>
                    <p className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-3">Folders</p>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {folders.map((folder) => (
                        <button key={folder.id} onClick={() => enterSubfolder(folder)}
                          className="group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-amber-500/25 rounded-xl px-4 py-3 transition-all text-left focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <FolderOpen size={18} className="text-amber-400/60 group-hover:text-amber-400 transition-colors shrink-0" />
                          <span className="text-white text-sm font-medium truncate">{folder.name}</span>
                          <ChevronRight size={14} className="ml-auto text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <div>
                    {folders.length > 0 && (
                      <p className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-3">Photos</p>
                    )}
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {photos.map((photo, i) => (
                        <button key={photo.id} onClick={() => setLightbox(i)}
                          className="group relative overflow-hidden rounded-xl bg-netflix-surface border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white aspect-square"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/photos/${photo.id}`}
                            alt={photo.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <p className="text-white text-xs truncate leading-tight">{photo.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Load more */}
                    {nextPageToken && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white/70 hover:text-white text-sm font-medium px-6 py-3 rounded-xl transition-all"
                        >
                          {loadingMore ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                              Loading…
                            </>
                          ) : (
                            <>
                              <RefreshCw size={14} />
                              Load more photos
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {!nextPageToken && photos.length >= PAGE_SIZE && (
                      <p className="text-center text-white/20 text-xs mt-6">{photos.length} photos</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10">
            <X size={20} />
          </button>
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-sm z-10 select-none">
            {lightbox + 1} / {photos.length}
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/25 text-xs z-10 max-w-xs truncate text-center">
            {photos[lightbox].name}
          </div>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10">
            <ChevronLeftIcon size={28} />
          </button>
          <div className="max-w-5xl w-full mx-16 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${photos[lightbox].id}`} alt={photos[lightbox].name} className="max-h-[88vh] max-w-full object-contain rounded-xl shadow-2xl" />
          </div>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10">
            <ChevronRightIcon size={28} />
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-24 gap-3">
      <span className="w-5 h-5 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
      <span className="text-white/35 text-sm">{label}</span>
    </div>
  );
}
