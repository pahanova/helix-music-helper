// src/theory/voicings.js
// Inversion-aware voicing generation: fretboard enumerator, piano voicer,
// and the top-level voicingsForChord orchestrator (curated DB + generator).

import { noteIndex, noteName } from './notes.js';
import { chordNotes, chordInversions } from './chords.js';
import CHORD_SHAPES_DB from './chord-shapes-data.js';

// Enumerate playable fretboard voicings for a chord on a given tuning.
// chordNotes: ['C', 'E', 'G'] — the actual notes that must all appear.
// tuning:     ['E', 'A', 'D', 'G', 'B', 'E']  (low → high)
// opts:
//   bassNote   — lowest sounding string must play this note
//   maxFret    — search window (default 12)
//   maxSpan    — max distance between fretted positions (default 4)
//   minStrings — minimum sounding strings (default = chordNotes.length)
//   allowBarre — affects only score, not enumeration
//   maxResults — top N voicings to return (default 3)
export function generateFretboardVoicings(chordNotes, tuning, opts = {}) {
  const {
    maxFret = 12,
    maxSpan = 4,
    bassNote = chordNotes[0],
    minStrings = Math.min(chordNotes.length, tuning.length),
    maxResults = 3,
  } = opts;

  // For each string: list of options (muted, or a fret playing one of the chord
  // tones). Matched by pitch class so enharmonic spellings (Bb vs A#) don't matter;
  // the option carries the chord's own spelling of the tone.
  const tonePcs = chordNotes.map(n => noteIndex(n));
  const bassPc = noteIndex(bassNote);
  const stringOptions = tuning.map(open => {
    const opts = [{ fret: -1, note: null, toneIdx: null }]; // muted
    const openPc = noteIndex(open);
    for (let f = 0; f <= maxFret; f++) {
      const idx = tonePcs.indexOf((openPc + f) % 12);
      if (idx >= 0) opts.push({ fret: f, note: chordNotes[idx], toneIdx: idx });
    }
    return opts;
  });

  const results = [];

  function recur(stringIdx, picks) {
    if (stringIdx === tuning.length) {
      const sounding = picks.filter(p => p.fret >= 0);
      if (sounding.length < minStrings) return;
      const tones = new Set(sounding.map(p => p.toneIdx));
      if (tones.size < chordNotes.length) return;

      const lowest = sounding[0]; // strings ordered low→high
      if (noteIndex(lowest.note) !== bassPc) return;

      const fretted = sounding.filter(p => p.fret > 0);
      let span = 0;
      if (fretted.length > 0) {
        const fmin = Math.min(...fretted.map(p => p.fret));
        const fmax = Math.max(...fretted.map(p => p.fret));
        span = fmax - fmin;
        if (span > maxSpan) return;
      }

      // Internal muted strings — any mute between the lowest and highest sounding string.
      const lowIdx = picks.findIndex(p => p.fret >= 0);
      let highIdx = -1;
      for (let i = picks.length - 1; i >= 0; i--) if (picks[i].fret >= 0) { highIdx = i; break; }
      let internalMutes = 0;
      for (let i = lowIdx + 1; i < highIdx; i++) if (picks[i].fret === -1) internalMutes++;

      // Score (lower = better).
      const lowFret = fretted.length > 0 ? Math.min(...fretted.map(p => p.fret)) : 0;
      let score = 0;
      score += Math.max(0, lowFret - 3) * 1.0;   // open/low positions free; penalize going up the neck
      score += span * 1.5;                        // tight shapes preferred
      score += internalMutes * 4;                 // muted strings between sounding ones are awkward
      // Penalize too FEW strings; doubling chord tones is fine on guitar.
      score += Math.max(0, chordNotes.length - sounding.length) * 2.0;
      score += Math.max(0, 5 - sounding.length) * 0.4;  // mild bias toward fuller (4–6 string) voicings

      results.push({
        picks: picks.slice(),
        score,
        baseFret: lowFret >= 4 ? lowFret : 1,
      });
      return;
    }
    for (const opt of stringOptions[stringIdx]) {
      picks.push({ string: stringIdx, ...opt });
      recur(stringIdx + 1, picks);
      picks.pop();
    }
  }
  recur(0, []);

  results.sort((a, b) => a.score - b.score);

  // Dedupe by exact fret pattern.
  const seen = new Set();
  const top = [];
  for (const r of results) {
    const key = r.picks.map(p => p.fret).join(':');
    if (seen.has(key)) continue;
    seen.add(key);
    top.push(r);
    if (top.length >= maxResults) break;
  }

  return top.map(r => {
    const positions = r.picks
      .filter(p => p.fret >= 0)
      .map(p => ({ string: p.string, fret: p.fret, toneIdx: p.toneIdx, note: p.note }));
    const mutes = r.picks.filter(p => p.fret === -1).map(p => p.string);
    return {
      kind: 'fretboard',
      positions,
      mutes,
      baseFret: r.baseFret,
      tuning,
      score: r.score,
    };
  });
}

// Normalize a chord name's root and slash bass to sharp chromatic spelling —
// chord-shapes-data keys are sharp-spelled ("A#m7"), so "Bbm7/Db" → "A#m7/C#".
function sharpChordName(name) {
  const m = /^([A-G](?:#{1,2}|b{1,2})?)([^/]*)(?:\/(.+))?$/.exec(name);
  if (!m) return name;
  const rootPc = noteIndex(m[1]);
  if (rootPc < 0) return name;
  const bassPc = m[3] != null ? noteIndex(m[3]) : -1;
  return noteName(rootPc) + (m[2] || '') + (bassPc >= 0 ? '/' + noteName(bassPc) : '');
}

// Piano voicing for an inversion: bass note + close-position upper voices.
// Returns { kind:'piano', notes: [{ name, octave, isBass }], range: { startOctave, octaves } }
export function generatePianoVoicing(chordNotes, bassNote, opts = {}) {
  if (!chordNotes || chordNotes.length === 0) return null;
  const { startOctave = 3 } = opts;
  const bassIdx = chordNotes.indexOf(bassNote);
  if (bassIdx < 0) return null;

  // Reorder so bass note is first; keep ascending order from there.
  const ordered = [...chordNotes.slice(bassIdx), ...chordNotes.slice(0, bassIdx)];
  const out = [];

  // Place bass at startOctave, then each subsequent note at the lowest pitch above the previous.
  let prevPitch = -1;
  ordered.forEach((n, i) => {
    let oct = startOctave;
    let pitch = oct * 12 + noteIndex(n);
    if (i === 0) {
      prevPitch = pitch;
      out.push({ name: n, octave: oct, isBass: true });
      return;
    }
    while (pitch <= prevPitch) { oct += 1; pitch = oct * 12 + noteIndex(n); }
    prevPitch = pitch;
    out.push({ name: n, octave: oct, isBass: false });
  });

  // Determine display range (cover from bass to top + a little margin).
  const minOct = Math.min(...out.map(o => o.octave));
  const maxOct = Math.max(...out.map(o => o.octave));
  return {
    kind: 'piano',
    notes: out,
    range: { startOctave: minOct, octaves: Math.max(2, maxOct - minOct + 1) },
    bassNote,
  };
}

// Top-level orchestrator. Returns one entry per inversion that has at least
// one playable voicing. Each entry: { degree, label, bassNote, slashSuffix, voicing }
//
// Curated voicings (from chord-shapes-data) are looked up first; if found
// they're used and `source` is 'curated'. Otherwise we generate and mark `source: 'auto'`.
export function voicingsForChord(chord, instrument, tuning) {
  if (!chord || !chord.root) return [];
  const type = chord.type || 'maj';
  const notes = chord.notes || chordNotes(chord.root, type);
  const inversions = chordInversions(notes);
  // 'min' → 'm', 'maj' → '' for display; other types kept as-is.
  const typeSuffix = type === 'maj' ? '' : type === 'min' ? 'm' : type;
  const baseName = chord.name || (chord.root + typeSuffix);

  return inversions.map(inv => {
    const fullName = baseName + inv.slashSuffix;
    let voicing = null;
    let source = 'auto';

    if (instrument === 'piano') {
      voicing = generatePianoVoicing(notes, inv.bassNote);
    } else {
      // Curated lookup: only for guitar in standard tuning, since chords-db is fixed.
      const isStandardGuitar = instrument === 'guitar'
        && Array.isArray(tuning)
        && tuning.length === 6
        && tuning.join('') === 'EADGBE';
      if (isStandardGuitar) {
        const curated = CHORD_SHAPES_DB[fullName] || CHORD_SHAPES_DB[sharpChordName(fullName)]
          || (inv.degree === 0 && (CHORD_SHAPES_DB[baseName] || CHORD_SHAPES_DB[sharpChordName(baseName)]));
        if (curated) {
          voicing = { kind: 'fretboard', tuning, allowBarre: true, ...curated };
          source = 'curated';
        }
      }
      if (!voicing) {
        const generated = generateFretboardVoicings(notes, tuning, {
          bassNote: inv.bassNote,
          maxResults: 1,
        });
        if (generated.length > 0) {
          voicing = { ...generated[0], allowBarre: instrument !== 'bass' };
        }
      }
    }

    return voicing ? { ...inv, fullName, voicing, source } : null;
  }).filter(Boolean);
}
