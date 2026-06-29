export function DriveIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.65 10.85z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.43 54.5 0 52.85 0H34.45c-1.65 0-3.2.43-4.55 1.2z" fill="#00832d"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.77 2.9 1.2 4.55 1.2h50.7c1.65 0 3.2-.43 4.55-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5l-12.65-21.9c-.8-1.4-1.95-2.55-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

export function IINAIcon({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/iina-icon.png"
      alt="IINA"
      width={size}
      height={size}
      className="rounded-xl object-cover"
    />
  );
}

export function VLCIcon({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vlc-icon.png"
      alt="VLC"
      width={size}
      height={size}
      className="rounded-xl object-cover"
    />
  );
}
