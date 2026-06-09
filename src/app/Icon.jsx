// src/app/Icon.jsx — small stroke icon set (lucide-style paths).

export default function Icon({ name, size = 14 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'menu': return <svg {...props}><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'sun': return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
    case 'moon': return <svg {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-up': return <svg {...props}><path d="m18 15-6-6-6 6"/></svg>;
    case 'chevron-right': return <svg {...props}><path d="m9 18 6-6-6-6"/></svg>;
    case 'sidebar-left': return <svg {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>;
    case 'sidebar-right': return <svg {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>;
    case 'volume': return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>;
    case 'volume-x': return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>;
    default: return null;
  }
}
