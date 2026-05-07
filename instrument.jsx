// instrument.jsx — guitar, bass, piano with note highlighting

const { useState, useMemo, useRef, useEffect } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Fretboard (guitar / bass)
// ─────────────────────────────────────────────────────────────────────────────

function Fretboard({
  tuning,                // [low, ..., high] note names
  frets = 16,
  highlightedNotes = {}, // { 'C': { degree: 1, label: '1' }, ... }
  selectedPositions = [],// [{ string, fret }]
  onPositionClick,       // ({ string, fret, note }) => void
  capoFret = 0,
  showFretNumbers = true,
}) {
  const FRET_DOTS_SINGLE = [3, 5, 7, 9, 15];
  const FRET_DOTS_DOUBLE = [12];
  const stringCount = tuning.length;
  // Frets are wider near the nut, narrower toward the bridge — fake using progression
  const fretWidths = useMemo(() => {
    const widths = [];
    let cur = 1;
    for (let i = 0; i < frets; i++) {
      widths.push(cur);
      cur *= 0.945; // perceptual taper
    }
    return widths;
  }, [frets]);
  const totalW = fretWidths.reduce((a, b) => a + b, 0);

  return (
    <div className="fb">
      <div className="fb-grid" style={{ gridTemplateColumns: `28px ${fretWidths.map(w => `${(w / totalW) * 100}fr`).join(' ')}` }}>
        {/* Header — fret numbers */}
        {showFretNumbers && (
          <>
            <div className="fb-corner" />
            {fretWidths.map((_, i) => {
              const isMarker = FRET_DOTS_SINGLE.includes(i + 1) || FRET_DOTS_DOUBLE.includes(i + 1);
              return (
                <div key={`fn-${i}`} className={`fb-fnum ${isMarker ? 'is-marker' : ''}`}>
                  {(i + 1) % 2 === 1 || isMarker ? i + 1 : ''}
                </div>
              );
            })}
          </>
        )}

        {/* Strings rendered top-to-bottom: high string first */}
        {[...tuning].reverse().map((openNote, revIdx) => {
          const stringIdx = stringCount - 1 - revIdx;
          const isThick = stringIdx <= 1;
          return (
            <React.Fragment key={`s-${stringIdx}`}>
              {/* Open / nut cell */}
              <FretCell
                isOpen
                stringIdx={stringIdx}
                fret={0}
                openNote={openNote}
                highlightedNotes={highlightedNotes}
                selectedPositions={selectedPositions}
                onClick={onPositionClick}
                capoFret={capoFret}
                isThick={isThick}
              />
              {/* Fretted cells */}
              {fretWidths.map((_, fi) => {
                const fret = fi + 1;
                return (
                  <FretCell
                    key={`f-${stringIdx}-${fret}`}
                    stringIdx={stringIdx}
                    fret={fret}
                    openNote={openNote}
                    highlightedNotes={highlightedNotes}
                    selectedPositions={selectedPositions}
                    onClick={onPositionClick}
                    capoFret={capoFret}
                    isThick={isThick}
                    showInlay={revIdx === Math.floor(stringCount / 2) - 1 || (stringCount % 2 === 1 && revIdx === Math.floor(stringCount / 2))}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function FretCell({ isOpen, stringIdx, fret, openNote, highlightedNotes, selectedPositions, onClick, capoFret, isThick, showInlay }) {
  const note = window.MT.fretNote(openNote, fret);
  const hl = highlightedNotes[note];
  const isSelected = selectedPositions.some(p => p.string === stringIdx && p.fret === fret);
  const FRET_DOTS_SINGLE = [3, 5, 7, 9, 15];
  const FRET_DOTS_DOUBLE = [12];
  const showSingleDot = FRET_DOTS_SINGLE.includes(fret) && showInlay;
  const showDoubleDot = FRET_DOTS_DOUBLE.includes(fret) && showInlay;

  return (
    <div
      className={`fb-cell ${isOpen ? 'is-open' : ''} ${hl ? 'has-hl' : ''} ${isSelected ? 'is-selected' : ''} ${capoFret === fret ? 'has-capo' : ''}`}
      onClick={() => onClick && onClick({ string: stringIdx, fret, note })}
    >
      {/* String line */}
      <div className={`fb-string ${isThick ? 'is-thick' : ''}`} />
      {/* Fret wire */}
      {!isOpen && <div className={`fb-wire ${fret === 12 ? 'is-octave' : ''}`} />}
      {isOpen && <div className="fb-nut" />}
      {/* Inlay */}
      {showSingleDot && <div className="fb-inlay" />}
      {showDoubleDot && (
        <>
          <div className="fb-inlay double top" />
          <div className="fb-inlay double bot" />
        </>
      )}
      {/* Note marker */}
      {hl && (
        <div
          className={`fb-note deg-${hl.degree || 'x'} ${hl.role || ''} ${isSelected ? 'is-sel' : ''}`}
          style={hl.degree ? { background: `var(--deg-${hl.degree})` } : {}}
        >
          <span className="fb-note-label">{hl.label || note}</span>
        </div>
      )}
      {!hl && isSelected && (
        <div className="fb-note is-sel-only">
          <span className="fb-note-label">{note}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Piano
// ─────────────────────────────────────────────────────────────────────────────

function Piano({ startOctave = 3, octaves = 3, highlightedNotes = {}, selectedNotes = [], onKeyClick }) {
  // Build white-key list and figure positions for black keys
  const whiteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackBetween = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' };
  const whites = [];
  for (let o = 0; o < octaves; o++) {
    for (const w of whiteOrder) {
      whites.push({ name: w, octave: startOctave + o });
    }
  }

  return (
    <div className="pn-wrap">
      <div className="pn-whites" style={{ gridTemplateColumns: `repeat(${whites.length}, 1fr)` }}>
        {whites.map((k, i) => {
          const hl = highlightedNotes[k.name];
          const sel = selectedNotes.includes(`${k.name}${k.octave}`);
          return (
            <div
              key={`w-${i}`}
              className={`pn-key pn-white ${hl ? 'has-hl' : ''} ${sel ? 'is-sel' : ''}`}
              onClick={() => onKeyClick && onKeyClick({ name: k.name, octave: k.octave })}
            >
              {hl && (
                <div className="pn-dot" style={{ background: `var(--deg-${hl.degree || 'x'})` }}>
                  <span>{hl.label || k.name}</span>
                </div>
              )}
              {!hl && k.name === 'C' && <div className="pn-octave-label">C{k.octave}</div>}
            </div>
          );
        })}
      </div>
      {/* Black keys overlay */}
      <div className="pn-blacks">
        {whites.map((k, i) => {
          const bn = blackBetween[k.name];
          if (!bn) return null;
          // Position over the gap between this white and next: i + 1 boundary
          const left = ((i + 1) / whites.length) * 100;
          const hl = highlightedNotes[bn];
          const sel = selectedNotes.includes(`${bn}${k.octave}`);
          return (
            <div
              key={`b-${i}`}
              className={`pn-key pn-black ${hl ? 'has-hl' : ''} ${sel ? 'is-sel' : ''}`}
              style={{ left: `calc(${left}% - 11px)` }}
              onClick={() => onKeyClick && onKeyClick({ name: bn, octave: k.octave })}
            >
              {hl && (
                <div className="pn-dot pn-dot-b" style={{ background: `var(--deg-${hl.degree || 'x'})` }}>
                  <span>{hl.label || bn}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Instrument shell — picks guitar / bass / piano
// ─────────────────────────────────────────────────────────────────────────────

function Instrument({ instrument, tuning, highlightedNotes, selectedPositions, onPositionClick, capoFret, frets }) {
  if (instrument === 'piano') {
    return <Piano startOctave={3} octaves={3} highlightedNotes={highlightedNotes} onKeyClick={() => {}} />;
  }
  return (
    <Fretboard
      tuning={tuning}
      frets={frets}
      highlightedNotes={highlightedNotes}
      selectedPositions={selectedPositions}
      onPositionClick={onPositionClick}
      capoFret={capoFret}
    />
  );
}

window.Instrument = Instrument;
window.Fretboard = Fretboard;
window.Piano = Piano;
