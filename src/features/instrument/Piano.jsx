// Piano.jsx — piano keyboard with note highlighting

import * as HelixAudio from '../../audio/index.js';
import { flashPulse } from '../../ui/pulse.js';

// Build white-key list and figure positions for black keys
const whiteOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const blackBetween = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' };

export default function Piano({ startOctave = 3, octaves = 3, highlightedNotes = {}, selectedNotes = [], onKeyClick, onPlayNote }) {
  const whites = [];
  for (let o = 0; o < octaves; o++) {
    for (const w of whiteOrder) {
      whites.push({ name: w, octave: startOctave + o });
    }
  }

  const renderWhite = (k, i) => (
    <WhiteKey
      key={`w-${i}`}
      k={k}
      highlightedNotes={highlightedNotes}
      selectedNotes={selectedNotes}
      onKeyClick={onKeyClick}
      onPlayNote={onPlayNote}
    />
  );

  const renderBlack = (k, i) => (
    <BlackKey
      key={`b-${i}`}
      k={k}
      index={i}
      count={whites.length}
      highlightedNotes={highlightedNotes}
      selectedNotes={selectedNotes}
      onKeyClick={onKeyClick}
      onPlayNote={onPlayNote}
    />
  );

  return (
    <div className="pn-wrap">
      <div className="pn-whites" style={{ gridTemplateColumns: `repeat(${whites.length}, 1fr)` }}>
        {whites.map(renderWhite)}
      </div>
      {/* Black keys overlay */}
      <div className="pn-blacks">
        {whites.map(renderBlack)}
      </div>
    </div>
  );
}

function WhiteKey({ k, highlightedNotes, selectedNotes, onKeyClick, onPlayNote }) {
  const hl = highlightedNotes[k.name];
  const sel = selectedNotes.includes(`${k.name}${k.octave}`);

  const handleClick = (e) => {
    if (flashPulse) flashPulse(e.currentTarget);
    if (onPlayNote) onPlayNote(HelixAudio ? HelixAudio.noteToMidi(k.name, k.octave) : null);
    if (onKeyClick) onKeyClick({ name: k.name, octave: k.octave });
  };

  return (
    <div className={`pn-key pn-white ${hl ? 'has-hl' : ''} ${sel ? 'is-sel' : ''}`} onClick={handleClick}>
      {hl && <KeyDot hl={hl} fallback={k.name} />}
      {!hl && k.name === 'C' && <div className="pn-octave-label">C{k.octave}</div>}
    </div>
  );
}

function BlackKey({ k, index, count, highlightedNotes, selectedNotes, onKeyClick, onPlayNote }) {
  const bn = blackBetween[k.name];
  if (!bn) return null;
  // Position over the gap between this white and next: index + 1 boundary
  const left = ((index + 1) / count) * 100;
  const hl = highlightedNotes[bn];
  const sel = selectedNotes.includes(`${bn}${k.octave}`);

  const handleClick = (e) => {
    if (flashPulse) flashPulse(e.currentTarget);
    if (onPlayNote) onPlayNote(HelixAudio ? HelixAudio.noteToMidi(bn, k.octave) : null);
    if (onKeyClick) onKeyClick({ name: bn, octave: k.octave });
  };

  return (
    <div
      className={`pn-key pn-black ${hl ? 'has-hl' : ''} ${sel ? 'is-sel' : ''}`}
      style={{ left: `calc(${left}% - 11px)` }}
      onClick={handleClick}
    >
      {hl && <KeyDot hl={hl} fallback={bn} black />}
    </div>
  );
}

function KeyDot({ hl, fallback, black }) {
  return (
    <div className={black ? 'pn-dot pn-dot-b' : 'pn-dot'} style={{ background: `var(--deg-${hl.degree || 'x'})` }}>
      <span>{hl.label || fallback}</span>
    </div>
  );
}
