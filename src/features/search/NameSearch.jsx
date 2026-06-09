// src/features/search/NameSearch.jsx — compact "by name" search:
// every chord expands into multiple voicing cards (one per inversion).

import { useMemo } from 'react';
import { CHORD_TYPES, NOTES_SHARP, chordNotes, voicingsForChord } from '../../theory/index.js';
import VoicingCard from './VoicingCard.jsx';
import SearchIcon from './SearchIcon.jsx';

export default function NameSearch({ q, setQ, instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick }) {
  const all = useMemo(() => buildAllChords(), []);
  const filtered = useMemo(() => filterByQuery(all, q), [all, q]);

  return (
    <div className="col" style={{gap: 8}}>
      <div className="search-bar">
        <SearchIcon dim/>
        <input value={q} onChange={e => setQ(e.target.value)}
               placeholder="Cmaj7, Am9, F#dim..." autoFocus/>
        {q && <button className="btn-ghost" onClick={() => setQ('')} style={{padding: '2px 6px'}}>×</button>}
      </div>
      {q.trim() && (
        <ResultsGrid filtered={filtered}
                     instrument={instrument} tuning={tuning}
                     scaleNotes={scaleNotes} keyName={keyName}
                     pinnedNames={pinnedNames} onPin={onPin} onChordClick={onChordClick} />
      )}
    </div>
  );
}

function ResultsGrid({ filtered, instrument, tuning, scaleNotes, keyName, pinnedNames, onPin, onChordClick }) {
  const cardProps = { instrument, tuning, scaleNotes, keyName, pinnedNames, onPin, onChordClick };
  return (
    <div className="results-grid">
      {filtered.length === 0 && (
        <div className="muted" style={{gridColumn: '1 / -1', fontSize: 11.5, padding: 8}}>Ничего не нашлось.</div>
      )}
      {filtered.flatMap(c => voicingCards(c, cardProps))}
    </div>
  );
}

// One base chord → a card per inversion (slash names: Cmaj7/E, Cmaj7/G, Cmaj7/B).
function voicingCards(c, { instrument, tuning, scaleNotes, keyName, pinnedNames, onPin, onChordClick }) {
  const inversions = voicingsForChord(c, instrument, tuning);
  return inversions.map((inv, i) => (
    <VoicingCard key={`${c.name}-${i}`}
                 chord={c}
                 inversion={inv}
                 instrument={instrument}
                 tuning={tuning}
                 scaleNotes={scaleNotes}
                 keyName={keyName}
                 pinnedNames={pinnedNames}
                 onPin={onPin}
                 onChordClick={onChordClick} />
  ));
}

function buildAllChords() {
  const list = [];
  NOTES_SHARP.forEach(root => {
    Object.keys(CHORD_TYPES).forEach(type => {
      const display = root + (type === 'maj' ? '' : type === 'min' ? 'm' : type);
      list.push({ root, type, name: display, notes: chordNotes(root, type) });
    });
  });
  return list;
}

function filterByQuery(all, q) {
  if (!q.trim()) return [];
  const Q = q.trim().toLowerCase();
  const starts = [];
  const inc = [];
  all.forEach(c => {
    const nm = c.name.toLowerCase();
    if (nm.startsWith(Q)) starts.push(c);
    else if (nm.includes(Q)) inc.push(c);
  });
  return [...starts, ...inc].slice(0, 8); // cap at 8 base chords (each expands to 3–4 cards)
}
