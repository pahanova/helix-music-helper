// src/features/search/ChordSearch.jsx — shell of the chord search panel:
// tabs («По нотам | По позиции»), the name-search toggle, and active sub-mode.
// Quirk preserved from the prototype: while name search is open, its results
// are shown regardless of which tab is highlighted.

import { useState, useMemo } from 'react';
import { buildChord } from '../../theory/index.js';
import Constructor, { EMPTY_SPEC } from './Constructor.jsx';
import NameSearch from './NameSearch.jsx';
import PositionPlaceholder from './PositionPlaceholder.jsx';
import SearchIcon from './SearchIcon.jsx';
import './search.css';

export default function ChordSearch({ instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick }) {
  const [tab, setTab] = useState('notes'); // 'notes' | 'position'
  const [spec, setSpec] = useState(EMPTY_SPEC);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameQ, setNameQ] = useState('');

  const update = (patch) => setSpec(s => ({ ...s, ...patch }));
  const setEnum = (key, value) => setSpec(s => ({ ...s, [key]: s[key] === value ? null : value }));

  const built = useMemo(() => buildChord(spec), [spec]);

  function switchTab(t) { setTab(t); if (t !== 'notes') setNameOpen(false); }

  return (
    <div className="col" style={{gap: 10}}>
      <SearchTabs tab={tab} onSwitch={switchTab}
                  nameOpen={nameOpen} onToggleName={() => setNameOpen(o => !o)} />

      {nameOpen && (
        <NameSearch q={nameQ} setQ={setNameQ}
                    instrument={instrument} tuning={tuning}
                    scaleNotes={scaleNotes} keyName={keyName}
                    onPin={onPin} pinnedNames={pinnedNames} onChordClick={onChordClick} />
      )}

      {!nameOpen && tab === 'notes' && (
        <Constructor spec={spec} setSpec={setSpec} update={update} setEnum={setEnum}
                     built={built}
                     instrument={instrument} tuning={tuning}
                     scaleNotes={scaleNotes} keyName={keyName}
                     onPin={onPin} pinnedNames={pinnedNames} onChordClick={onChordClick} />
      )}

      {!nameOpen && tab === 'position' && <PositionPlaceholder />}
    </div>
  );
}

function SearchTabs({ tab, onSwitch, nameOpen, onToggleName }) {
  return (
    <div className="row" style={{justifyContent: 'space-between'}}>
      <div className="inst-tabs">
        <button className={tab === 'notes' ? 'is-active' : ''} onClick={() => onSwitch('notes')}>По нотам</button>
        <button className={tab === 'position' ? 'is-active' : ''} onClick={() => onSwitch('position')}>По позиции</button>
      </div>
      <button className={`btn-ghost ${nameOpen ? 'is-active' : ''}`}
              onClick={onToggleName}
              title="Поиск по имени"
              style={{padding: 4}}>
        <SearchIcon />
      </button>
    </div>
  );
}
