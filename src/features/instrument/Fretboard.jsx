// Fretboard.jsx — guitar / bass fretboard with note highlighting

import { useMemo } from 'react';
import { fretNote } from '../../theory/index.js';
import { flashPulse } from '../../ui/pulse.js';

const FRET_DOTS_SINGLE = [3, 5, 7, 9, 15];
const FRET_DOTS_DOUBLE = [12];

export default function Fretboard({
  tuning,                // [low, ..., high] note names
  frets = 16,
  highlightedNotes = {}, // { 'C': { degree: 1, label: '1' }, ... }
  selectedPositions = [],// [{ string, fret }]
  onPositionClick,       // ({ string, fret, note }) => void
  onPlayNote,            // (midi) => void  — invoked on cell click for sound
  openMidis = [],        // absolute MIDI for each open string (low → high)
  capoFret = 0,
  showFretNumbers = true,
}) {
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

  // Strings rendered top-to-bottom: high string first
  const renderString = (openNote, revIdx) => (
    <StringRow
      key={`s-${stringCount - 1 - revIdx}`}
      openNote={openNote}
      revIdx={revIdx}
      stringCount={stringCount}
      fretWidths={fretWidths}
      highlightedNotes={highlightedNotes}
      selectedPositions={selectedPositions}
      onPositionClick={onPositionClick}
      onPlayNote={onPlayNote}
      openMidis={openMidis}
      capoFret={capoFret}
    />
  );

  return (
    <div className="fb">
      <div className="fb-grid" style={{ gridTemplateColumns: `28px ${fretWidths.map(w => `${(w / totalW) * 100}fr`).join(' ')}` }}>
        {showFretNumbers && <FretNumbersRow fretWidths={fretWidths} />}
        {[...tuning].reverse().map(renderString)}
      </div>
    </div>
  );
}

// Header — fret numbers
function FretNumbersRow({ fretWidths }) {
  return (
    <>
      <div className="fb-corner" />
      {fretWidths.map((_, i) => <FretNumber key={`fn-${i}`} fret={i + 1} />)}
    </>
  );
}

function FretNumber({ fret }) {
  const isMarker = FRET_DOTS_SINGLE.includes(fret) || FRET_DOTS_DOUBLE.includes(fret);
  return (
    <div className={`fb-fnum ${isMarker ? 'is-marker' : ''}`}>
      {fret % 2 === 1 || isMarker ? fret : ''}
    </div>
  );
}

// One string: open / nut cell + fretted cells
function StringRow({ openNote, revIdx, stringCount, fretWidths, highlightedNotes, selectedPositions, onPositionClick, onPlayNote, openMidis, capoFret }) {
  const stringIdx = stringCount - 1 - revIdx;
  const isThick = stringIdx <= 1;
  const showInlay = revIdx === Math.floor(stringCount / 2) - 1 || (stringCount % 2 === 1 && revIdx === Math.floor(stringCount / 2));

  const renderFret = (_, fi) => (
    <FretCell
      key={`f-${stringIdx}-${fi + 1}`}
      stringIdx={stringIdx}
      fret={fi + 1}
      openNote={openNote}
      highlightedNotes={highlightedNotes}
      selectedPositions={selectedPositions}
      onClick={onPositionClick}
      onPlayNote={onPlayNote}
      openMidi={openMidis[stringIdx]}
      capoFret={capoFret}
      isThick={isThick}
      showInlay={showInlay}
    />
  );

  return (
    <>
      {/* Open / nut cell */}
      <FretCell
        isOpen
        stringIdx={stringIdx}
        fret={0}
        openNote={openNote}
        highlightedNotes={highlightedNotes}
        selectedPositions={selectedPositions}
        onClick={onPositionClick}
        onPlayNote={onPlayNote}
        openMidi={openMidis[stringIdx]}
        capoFret={capoFret}
        isThick={isThick}
      />
      {/* Fretted cells */}
      {fretWidths.map(renderFret)}
    </>
  );
}

function FretCell({ isOpen, stringIdx, fret, openNote, highlightedNotes, selectedPositions, onClick, onPlayNote, openMidi, capoFret, isThick, showInlay }) {
  const note = fretNote(openNote, fret);
  const hl = highlightedNotes[note];
  const isSelected = selectedPositions.some(p => p.string === stringIdx && p.fret === fret);
  const showSingleDot = FRET_DOTS_SINGLE.includes(fret) && showInlay;
  const showDoubleDot = FRET_DOTS_DOUBLE.includes(fret) && showInlay;

  const handleClick = (e) => {
    if (flashPulse) flashPulse(e.currentTarget);
    if (onPlayNote && openMidi != null) onPlayNote(openMidi + fret);
    if (onClick) onClick({ string: stringIdx, fret, note });
  };

  return (
    <div
      className={`fb-cell ${isOpen ? 'is-open' : ''} ${hl ? 'has-hl' : ''} ${isSelected ? 'is-selected' : ''} ${capoFret === fret ? 'has-capo' : ''}`}
      onClick={handleClick}
    >
      {/* String line */}
      <div className={`fb-string ${isThick ? 'is-thick' : ''}`} />
      {/* Fret wire */}
      {!isOpen && <div className={`fb-wire ${fret === 12 ? 'is-octave' : ''}`} />}
      {isOpen && <div className="fb-nut" />}
      {/* Inlay */}
      {showSingleDot && <div className="fb-inlay" />}
      {showDoubleDot && <DoubleInlay />}
      {/* Note marker */}
      {hl && <NoteMarker hl={hl} note={note} isSelected={isSelected} />}
      {!hl && isSelected && <SelectedOnlyMarker note={note} />}
    </div>
  );
}

function DoubleInlay() {
  return (
    <>
      <div className="fb-inlay double top" />
      <div className="fb-inlay double bot" />
    </>
  );
}

function NoteMarker({ hl, note, isSelected }) {
  return (
    <div
      className={`fb-note deg-${hl.degree || 'x'} ${hl.role || ''} ${isSelected ? 'is-sel' : ''}`}
      style={hl.degree ? { background: `var(--deg-${hl.degree})` } : {}}
    >
      <span className="fb-note-label">{hl.label || note}</span>
    </div>
  );
}

function SelectedOnlyMarker({ note }) {
  return (
    <div className="fb-note is-sel-only">
      <span className="fb-note-label">{note}</span>
    </div>
  );
}
