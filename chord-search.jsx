// chord-search.jsx — search by name, by notes, by position

const { useState: useS, useMemo: useM } = React;

function ChordSearch({ onPin, pinnedNames }) {
  const [tab, setTab] = useS('name'); // 'name' | 'notes' | 'position'
  const [q, setQ] = useS('');
  const [filterType, setFilterType] = useS(''); // 'maj' | 'min' | 'dim' | 'sus'
  const [filterExt, setFilterExt] = useS('');   // '7' | '9' | '11'
  const [pickedNotes, setPickedNotes] = useS([]);

  const allChords = useM(() => {
    const chords = [];
    window.MT.NOTES_SHARP.forEach(root => {
      Object.keys(window.MT.CHORD_TYPES).forEach(type => {
        const name = root + (type === 'maj' ? '' : type);
        chords.push({ root, type, name, notes: window.MT.chordNotes(root, type) });
      });
    });
    return chords;
  }, []);

  const filtered = useM(() => {
    let list = allChords;
    if (tab === 'name' && q.trim()) {
      const Q = q.trim().toLowerCase();
      list = list.filter(c => c.name.toLowerCase().startsWith(Q) || c.name.toLowerCase().includes(Q));
    }
    if (filterType) {
      list = list.filter(c => {
        if (filterType === 'maj') return c.type === 'maj' || c.type === 'maj7' || c.type === 'maj9';
        if (filterType === 'min') return c.type.startsWith('min') || c.type === 'm6' || c.type === 'm7b5';
        if (filterType === 'dim') return c.type.includes('dim');
        if (filterType === 'sus') return c.type.startsWith('sus');
        return true;
      });
    }
    if (filterExt) {
      list = list.filter(c => c.type.includes(filterExt));
    }
    if (tab === 'notes' && pickedNotes.length >= 2) {
      list = list.filter(c => {
        const cs = new Set(c.notes);
        return pickedNotes.every(n => cs.has(n)) && c.notes.length === pickedNotes.length;
      });
    }
    return list.slice(0, 24);
  }, [allChords, tab, q, filterType, filterExt, pickedNotes]);

  function togglePicked(n) {
    setPickedNotes(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  }

  return (
    <div className="col" style={{gap: 10}}>
      {/* Tabs */}
      <div className="inst-tabs" style={{alignSelf: 'start'}}>
        <button className={tab === 'name' ? 'is-active' : ''} onClick={() => setTab('name')}>По имени</button>
        <button className={tab === 'notes' ? 'is-active' : ''} onClick={() => setTab('notes')}>По нотам</button>
        <button className={tab === 'position' ? 'is-active' : ''} onClick={() => setTab('position')}>По позиции</button>
      </div>

      {tab === 'name' && (
        <>
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--text-dim)'}}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cmaj7, Am9, F#dim..." />
            {q && <button className="btn-ghost" onClick={() => setQ('')} style={{padding: '2px 6px'}}>×</button>}
          </div>
          <div className="filter-row">
            {['maj','min','dim','sus'].map(t => (
              <button key={t} className={`filter-chip ${filterType === t ? 'is-on' : ''}`}
                      onClick={() => setFilterType(filterType === t ? '' : t)}>{t}</button>
            ))}
            <span style={{width: 8}} />
            {['7','9','11'].map(t => (
              <button key={t} className={`filter-chip ${filterExt === t ? 'is-on' : ''}`}
                      onClick={() => setFilterExt(filterExt === t ? '' : t)}>{t}</button>
            ))}
          </div>
        </>
      )}

      {tab === 'notes' && (
        <>
          <div className="muted" style={{fontSize: 11}}>Выбери ноты — найдём аккорд.</div>
          <div className="note-picker">
            {window.MT.NOTES_SHARP.map(n => (
              <button key={n} className={pickedNotes.includes(n) ? 'is-on' : ''}
                      onClick={() => togglePicked(n)}>{n}</button>
            ))}
          </div>
          {pickedNotes.length > 0 && (
            <div className="row" style={{justifyContent: 'space-between'}}>
              <span className="muted" style={{fontSize: 11}}>{pickedNotes.length} выбрано</span>
              <button className="btn-ghost" onClick={() => setPickedNotes([])} style={{fontSize: 11}}>Сбросить</button>
            </div>
          )}
        </>
      )}

      {tab === 'position' && (
        <div className="muted" style={{fontSize: 11.5, padding: '14px 8px', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center'}}>
          Кликай по ладам на грифе — мы определим аккорд по выбранным нотам.
        </div>
      )}

      {/* Results */}
      <div className="results-grid">
        {filtered.length === 0 && (
          <div className="muted" style={{gridColumn: '1 / -1', fontSize: 11.5, padding: '8px'}}>
            Ничего не нашлось.
          </div>
        )}
        {filtered.map(c => {
          const shape = window.CHORD_SHAPES[c.name];
          const pinned = pinnedNames.includes(c.name);
          return (
            <div key={c.name} className={`chord-card ${pinned ? 'is-pinned' : ''}`}>
              <div className="chord-name">
                <span>{c.name}</span>
                <button className="btn-ghost" onClick={() => onPin && onPin(c)} style={{padding: 2, color: pinned ? 'var(--text)' : 'var(--text-dim)'}} title="Закрепить">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
                  </svg>
                </button>
              </div>
              {shape ? (
                <window.ChordDiagram shape={shape} name="" />
              ) : (
                <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)'}}>
                  {c.notes.join(' · ')}
                </div>
              )}
              <div className="chord-roman">{c.notes.slice(0, 5).join(' · ')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ChordSearch = ChordSearch;
