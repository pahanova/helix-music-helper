// src/features/search/SearchIcon.jsx — magnifier icon, shared by the
// name-search toggle (ChordSearch) and the search bar (NameSearch).

export default function SearchIcon({ dim }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={dim ? {color: 'var(--text-dim)'} : {}}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
