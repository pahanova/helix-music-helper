// chord-search.jsx — chord constructor + name search.
// Each chord expands into multiple voicing cards (one per inversion).

const { useState: useS, useMemo: useM } = React;

const EMPTY_SPEC = {
  root: null,
  quality: 'maj',
  sus: null,
  ext7: false,
  maj7: false,
  ext9: false,
  alt9: null,
  ext11: false,
  alt11: null,
  ext13: false,
  alt13: null,
  alt5: null,
  omit3: false,
  omit5: false,
};

function ChordSearch({ instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick }) {
  const [tab, setTab] = useS('notes'); // 'notes' | 'position'
  const [spec, setSpec] = useS(EMPTY_SPEC);
  const [nameOpen, setNameOpen] = useS(false);
  const [nameQ, setNameQ] = useS('');

  const update = (patch) => setSpec(s => ({ ...s, ...patch }));
  const setEnum = (key, value) => setSpec(s => ({ ...s, [key]: s[key] === value ? null : value }));

  const built = useM(() => window.MT.buildChord(spec), [spec]);

  function switchTab(t) { setTab(t); if (t !== 'notes') setNameOpen(false); }

  return (
    <div className="col" style={{gap: 10}}>
      <div className="row" style={{justifyContent: 'space-between'}}>
        <div className="inst-tabs">
          <button className={tab === 'notes' ? 'is-active' : ''} onClick={() => switchTab('notes')}>По нотам</button>
          <button className={tab === 'position' ? 'is-active' : ''} onClick={() => switchTab('position')}>По позиции</button>
        </div>
        <button className={`btn-ghost ${nameOpen ? 'is-active' : ''}`}
                onClick={() => setNameOpen(o => !o)}
                title="Поиск по имени"
                style={{padding: 4}}>
          <SearchIcon />
        </button>
      </div>

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

/* ─── Constructor ───────────────────────────────────────────── */

function Constructor({ spec, setSpec, update, setEnum, built, instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick }) {
  const fifthForced = spec.quality === 'dim' || spec.quality === 'aug';
  const susOn = !!spec.sus;
  const isPower = spec.quality === '5';
  const thirdOmitted = spec.omit3 || isPower;
  const reset = () => setSpec(EMPTY_SPEC);

  return (
    <div className="col" style={{gap: 12}}>
      <Group label="Корень" right={spec.root && (
        <button className="btn-ghost" onClick={reset} style={{fontSize: 11, padding: '0 6px'}}>сброс</button>
      )}>
        <div className="root-grid">
          {window.MT.NOTES_SHARP.map(n => (
            <button key={n}
                    className={`filter-chip ${spec.root === n ? 'is-on' : ''}`}
                    onClick={() => update({ root: spec.root === n ? null : n })}
                    style={{fontFamily: 'var(--font-mono)'}}>{n}</button>
          ))}
        </div>
      </Group>

      <Group label="Качество">
        <div className="filter-row">
          {[['maj','maj'],['min','min'],['dim','dim'],['aug','aug'],['5','5']].map(([v,l]) => (
            <button key={v}
                    className={`filter-chip ${spec.quality === v ? 'is-on' : ''}`}
                    disabled={susOn}
                    onClick={() => update({ quality: v })}
                    title={v === '5' ? 'Power chord — без терции' : undefined}>{l}</button>
          ))}
          {susOn && <span className="dim" style={{fontSize: 10.5, alignSelf: 'center', marginLeft: 6}}>заменено sus</span>}
        </div>
      </Group>

      <Group label="Sus" hint={isPower ? 'недоступно при качестве 5' : 'заменяет терцию'}>
        <div className="filter-row">
          <button className={`filter-chip ${!spec.sus ? 'is-on' : ''}`}
                  disabled={isPower}
                  onClick={() => update({ sus: null })}>—</button>
          <button className={`filter-chip ${spec.sus === 'sus2' ? 'is-on' : ''}`}
                  disabled={isPower}
                  onClick={() => update({ sus: spec.sus === 'sus2' ? null : 'sus2' })}>sus2</button>
          <button className={`filter-chip ${spec.sus === 'sus4' ? 'is-on' : ''}`}
                  disabled={isPower}
                  onClick={() => update({ sus: spec.sus === 'sus4' ? null : 'sus4' })}>sus4</button>
        </div>
      </Group>

      <Group label="Расширения" hint={spec.ext7 ? null : '[7] делает 7-ку доминантной'}>
        <div className="filter-row">
          <button className={`filter-chip ${spec.ext7 ? 'is-on' : ''}`}
                  onClick={() => update({ ext7: !spec.ext7, maj7: spec.ext7 ? false : spec.maj7 })}>7</button>
          {spec.ext7 && (
            <button className={`filter-chip ${spec.maj7 ? 'is-on' : ''}`}
                    onClick={() => update({ maj7: !spec.maj7 })}
                    title="Поднять до натуральной 7-й (maj7)">♮7</button>
          )}
          <span className="chip-sep" />
          <button className={`filter-chip ${spec.ext9 ? 'is-on' : ''}`}
                  onClick={() => update({ ext9: !spec.ext9, alt9: spec.ext9 ? null : spec.alt9 })}>9</button>
          {spec.ext9 && (
            <>
              <button className={`filter-chip ${spec.alt9 === 'b9' ? 'is-on' : ''}`}
                      onClick={() => setEnum('alt9', 'b9')}>♭9</button>
              <button className={`filter-chip ${spec.alt9 === '#9' ? 'is-on' : ''}`}
                      onClick={() => setEnum('alt9', '#9')}>♯9</button>
            </>
          )}
        </div>
        <div className="filter-row" style={{marginTop: 4}}>
          <button className={`filter-chip ${spec.ext11 ? 'is-on' : ''}`}
                  onClick={() => update({ ext11: !spec.ext11, alt11: spec.ext11 ? null : spec.alt11 })}>11</button>
          {spec.ext11 && (
            <button className={`filter-chip ${spec.alt11 === '#11' ? 'is-on' : ''}`}
                    onClick={() => setEnum('alt11', '#11')}>♯11</button>
          )}
          <span className="chip-sep" />
          <button className={`filter-chip ${spec.ext13 ? 'is-on' : ''}`}
                  onClick={() => update({ ext13: !spec.ext13, alt13: spec.ext13 ? null : spec.alt13 })}>13</button>
          {spec.ext13 && (
            <button className={`filter-chip ${spec.alt13 === 'b13' ? 'is-on' : ''}`}
                    onClick={() => setEnum('alt13', 'b13')}>♭13</button>
          )}
        </div>
      </Group>

      <Group label="5-я ступень" hint={fifthForced ? `задана качеством ${spec.quality}` : null}>
        <div className="filter-row">
          <button className={`filter-chip ${!spec.alt5 ? 'is-on' : ''}`}
                  disabled={fifthForced}
                  onClick={() => update({ alt5: null })}>—</button>
          <button className={`filter-chip ${spec.alt5 === 'b5' ? 'is-on' : ''}`}
                  disabled={fifthForced}
                  onClick={() => setEnum('alt5', 'b5')}>♭5</button>
          <button className={`filter-chip ${spec.alt5 === '#5' ? 'is-on' : ''}`}
                  disabled={fifthForced}
                  onClick={() => setEnum('alt5', '#5')}>♯5</button>
        </div>
      </Group>

      <Group label="Omit" hint={isPower ? 'нет 3 — задано качеством 5' : null}>
        <div className="filter-row">
          <button className={`filter-chip ${thirdOmitted ? 'is-on' : ''}`}
                  disabled={susOn || isPower}
                  onClick={() => update({ omit3: !spec.omit3 })}>нет 3</button>
          <button className={`filter-chip ${spec.omit5 ? 'is-on' : ''}`}
                  disabled={fifthForced}
                  onClick={() => update({ omit5: !spec.omit5 })}>нет 5</button>
        </div>
      </Group>

      <ConstructorResult built={built}
                         instrument={instrument} tuning={tuning}
                         scaleNotes={scaleNotes} keyName={keyName}
                         onPin={onPin} pinnedNames={pinnedNames} onChordClick={onChordClick} />
    </div>
  );
}

function Group({ label, hint, right, children }) {
  return (
    <div>
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', margin: '0 2px 6px'}}>
        <span style={{fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)'}}>{label}</span>
        {hint && <span className="dim" style={{fontSize: 10.5}}>{hint}</span>}
        {right}
      </div>
      {children}
    </div>
  );
}

function ConstructorResult({ built, instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick }) {
  if (!built) {
    return (
      <div className="muted" style={{
        fontSize: 11.5, padding: '14px 8px', border: '1px dashed var(--border)',
        borderRadius: 8, textAlign: 'center', marginTop: 6,
      }}>
        Выбери корень — соберём аккорд.
      </div>
    );
  }
  // Determine type — try to round-trip via a simple lookup against CHORD_TYPES based on intervals.
  const baseChord = { root: built.root, type: deriveTypeFromBuilt(built), name: built.name, notes: built.notes };
  const inversions = window.MT.voicingsForChord(baseChord, instrument, tuning);
  const inScale = window.MT.isChordInScale(built.notes, scaleNotes);

  return (
    <div className="constructor-result">
      <div className="row" style={{gap: 4, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center'}}>
        {built.notes.map((n, i) => (
          <span key={i} className="note-pill">
            <span className="note-pill-deg">{built.labels[i]}</span>
            <span className="mono">{n}</span>
          </span>
        ))}
        {inScale && <InKeyBadge keyName={keyName} />}
      </div>
      {inversions.length === 0 ? (
        <div className="dim" style={{fontSize: 11, marginTop: 8, textAlign: 'center'}}>
          не нашлось играбельной аппликатуры для этого инструмента
        </div>
      ) : (
        <div className="col" style={{gap: 8}}>
          {inversions.map((inv, idx) => (
            <VoicingCard key={idx}
                         chord={baseChord}
                         inversion={inv}
                         instrument={instrument}
                         tuning={tuning}
                         pinnedNames={pinnedNames}
                         onPin={onPin}
                         onChordClick={onChordClick}
                         layout="row" />
          ))}
        </div>
      )}
    </div>
  );
}

// Map a buildChord result back to a CHORD_TYPES key (best-effort) for downstream lookup.
function deriveTypeFromBuilt(built) {
  if (!built) return 'maj';
  const intervals = built.intervals.slice().sort((a, b) => a - b).join(',');
  for (const [t, ivs] of Object.entries(window.MT.CHORD_TYPES)) {
    if (ivs.slice().sort((a, b) => a - b).join(',') === intervals) return t;
  }
  return 'maj';
}

/* ─── Voicing card (used everywhere a chord+inversion shows up) ─── */

function VoicingCard({ chord, inversion, instrument, tuning, scaleNotes, keyName, pinnedNames, onPin, onChordClick, layout = 'card' }) {
  const { fullName, voicing, source, label, bassNote } = inversion;
  const pinned = pinnedNames && pinnedNames.includes(fullName);
  const chordObj = { ...chord, name: fullName, bassNote, notes: chord.notes };
  const inScale = window.MT.isChordInScale(chord.notes, scaleNotes);

  const diag = voicing.kind === 'piano'
    ? <window.PianoChordDiagram voicing={voicing} name="" width={layout === 'row' ? 180 : 124} height={layout === 'row' ? 80 : 70} />
    : <window.ChordDiagram shape={voicing} name="" source={source}
                           width={layout === 'row' ? 132 : 104} height={layout === 'row' ? 116 : 100} />;

  if (layout === 'row') {
    return (
      <div className="voicing-row" onClick={() => onChordClick && onChordClick(chordObj)}>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="row" style={{gap: 8, alignItems: 'baseline'}}>
            <span className="mono" style={{fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em'}}>{fullName}</span>
            <span className="dim" style={{fontSize: 10.5, fontFamily: 'var(--font-mono)'}}>
              {label}{source === 'auto' ? ' · auto' : ''}
            </span>
          </div>
          <div className="dim" style={{fontSize: 10.5, marginTop: 2, fontFamily: 'var(--font-mono)'}}>
            бас: {bassNote}
          </div>
        </div>
        <div onClick={e => e.stopPropagation()} style={{flexShrink: 0}}>{diag}</div>
        <button className="btn-ghost"
                onClick={(e) => { e.stopPropagation(); onPin && onPin(chordObj); }}
                style={{padding: 3, color: pinned ? 'var(--text)' : 'var(--text-dim)', alignSelf: 'flex-start'}}
                title={pinned ? 'Открепить' : 'Закрепить'}>
          <PinIcon filled={pinned}/>
        </button>
      </div>
    );
  }

  // Default card layout (used in NameSearch grid)
  return (
    <div className={`chord-card ${pinned ? 'is-pinned' : ''} ${inScale ? 'is-in-key' : ''}`}
         onClick={() => onChordClick && onChordClick(chordObj)}>
      <div className="chord-name">
        <span className="row" style={{gap: 6, alignItems: 'center'}}>
          <span>{fullName}</span>
          {inScale && <InKeyDot keyName={keyName} />}
        </span>
        <button className="btn-ghost"
                onClick={(e) => { e.stopPropagation(); onPin && onPin(chordObj); }}
                style={{padding: 2, color: pinned ? 'var(--text)' : 'var(--text-dim)'}}
                title={pinned ? 'Открепить' : 'Закрепить'}>
          <PinIcon filled={pinned}/>
        </button>
      </div>
      {diag}
      <div className="chord-roman">
        {label}{source === 'auto' ? ' · auto' : ''}
      </div>
    </div>
  );
}

/* ─── Compact "by name" search ──────────────────────────────── */

function NameSearch({ q, setQ, instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick }) {
  const all = useM(() => {
    const list = [];
    window.MT.NOTES_SHARP.forEach(root => {
      Object.keys(window.MT.CHORD_TYPES).forEach(type => {
        const display = root + (type === 'maj' ? '' : type === 'min' ? 'm' : type);
        list.push({ root, type, name: display, notes: window.MT.chordNotes(root, type) });
      });
    });
    return list;
  }, []);

  const filtered = useM(() => {
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
  }, [all, q]);

  return (
    <div className="col" style={{gap: 8}}>
      <div className="search-bar">
        <SearchIcon dim/>
        <input value={q} onChange={e => setQ(e.target.value)}
               placeholder="Cmaj7, Am9, F#dim..." autoFocus/>
        {q && <button className="btn-ghost" onClick={() => setQ('')} style={{padding: '2px 6px'}}>×</button>}
      </div>
      {q.trim() && (
        <div className="results-grid">
          {filtered.length === 0 && (
            <div className="muted" style={{gridColumn: '1 / -1', fontSize: 11.5, padding: 8}}>
              Ничего не нашлось.
            </div>
          )}
          {filtered.flatMap(c => {
            const inversions = window.MT.voicingsForChord(c, instrument, tuning);
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
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Position tab placeholder ──────────────────────────────── */

function PositionPlaceholder() {
  return (
    <div className="muted" style={{
      fontSize: 11.5, padding: '14px 8px', border: '1px dashed var(--border)',
      borderRadius: 8, textAlign: 'center',
    }}>
      Кликай по ладам на грифе — мы определим аккорд по выбранным нотам.
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────────── */

function SearchIcon({ dim }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={dim ? {color: 'var(--text-dim)'} : {}}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

function InKeyBadge({ keyName }) {
  return (
    <span className="in-key-badge" title={keyName ? `Все ноты в тональности ${keyName}` : 'Все ноты в текущей тональности'}>
      <CheckIcon />
      <span>в тональности</span>
    </span>
  );
}

function InKeyDot({ keyName }) {
  return (
    <span className="in-key-dot" title={keyName ? `Все ноты в тональности ${keyName}` : 'Все ноты в текущей тональности'} />
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}

function PinIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5"/>
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
    </svg>
  );
}

window.ChordSearch = ChordSearch;
window.VoicingCard = VoicingCard;
