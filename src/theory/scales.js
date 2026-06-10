// src/theory/scales.js
// Scale interval patterns, mode metadata, diatonic chords and secondary dominants.

import { noteIndex, noteName, NOTE_LETTERS, spellPitch } from './notes.js';
import { qualitySuffix } from './chords.js';

// Scale interval patterns (semitones from root)
export const SCALES = {
  major:           [0, 2, 4, 5, 7, 9, 11],
  minor:           [0, 2, 3, 5, 7, 8, 10],
  dorian:          [0, 2, 3, 5, 7, 9, 10],
  phrygian:        [0, 1, 3, 5, 7, 8, 10],
  lydian:          [0, 2, 4, 6, 7, 9, 11],
  mixolydian:      [0, 2, 4, 5, 7, 9, 10],
  locrian:         [0, 1, 3, 5, 6, 8, 10],
  harmonicMinor:   [0, 2, 3, 5, 7, 8, 11],
  melodicMinor:    [0, 2, 3, 5, 7, 9, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
};

// Mode metadata. `qualities` is null for scales without diatonic triads (pentatonic);
// in that case `diatonicChords` and `secondaryDominants` return [].
//   short — appended to root for display ("Am", "C dor", "Am pent")
//   family — 'major'-like vs 'minor'-like (for grouping in pickers; doesn't affect theory)
export const MODES = {
  major:           { label: 'major',           short: '',         family: 'major',  qualities: ['maj','min','min','maj','maj','min','dim'], romans: ['I','ii','iii','IV','V','vi','vii°'] },
  minor:           { label: 'minor',           short: 'm',        family: 'minor',  qualities: ['min','dim','maj','min','min','maj','maj'], romans: ['i','ii°','III','iv','v','VI','VII'] },
  dorian:          { label: 'dorian',          short: ' dor',     family: 'minor',  qualities: ['min','min','maj','maj','min','dim','maj'], romans: ['i','ii','♭III','IV','v','vi°','♭VII'] },
  phrygian:        { label: 'phrygian',        short: ' phr',     family: 'minor',  qualities: ['min','maj','maj','min','dim','maj','min'], romans: ['i','♭II','♭III','iv','v°','♭VI','♭vii'] },
  lydian:          { label: 'lydian',          short: ' lyd',     family: 'major',  qualities: ['maj','maj','min','dim','maj','min','min'], romans: ['I','II','iii','♯iv°','V','vi','vii'] },
  mixolydian:      { label: 'mixolydian',      short: ' mix',     family: 'major',  qualities: ['maj','min','dim','maj','min','min','maj'], romans: ['I','ii','iii°','IV','v','vi','♭VII'] },
  locrian:         { label: 'locrian',         short: ' loc',     family: 'minor',  qualities: ['dim','maj','min','min','maj','maj','min'], romans: ['i°','♭II','♭iii','iv','♭V','♭VI','♭vii'] },
  harmonicMinor:   { label: 'harmonic minor',  short: 'm harm',   family: 'minor',  qualities: ['min','dim','aug','min','maj','maj','dim'], romans: ['i','ii°','♭III+','iv','V','♭VI','vii°'] },
  melodicMinor:    { label: 'melodic minor',   short: 'm mel',    family: 'minor',  qualities: ['min','min','aug','maj','maj','dim','dim'], romans: ['i','ii','♭III+','IV','V','vi°','vii°'] },
  majorPentatonic: { label: 'major pentatonic',short: ' pent',    family: 'major',  qualities: null, romans: null },
  minorPentatonic: { label: 'minor pentatonic',short: 'm pent',   family: 'minor',  qualities: null, romans: null },
};

export function keyLabel(rootNote, mode) {
  return rootNote + (MODES[mode] ? MODES[mode].short : '');
}

/* ─── Enharmonic spelling ───────────────────────────────────── */
// A scale is spelled letter-wise: 7-note scales use each letter exactly once
// (D minor = D E F G A Bb C, never A#); pentatonics map each interval to its
// diatonic letter step. When the picked root produces a bad spelling (doubles,
// or E#/B#/Cb/Fb pile-up), the enharmonic root is tried (D# major → Eb major).

// Diatonic letter step for pentatonic intervals (no tritone there, so unambiguous).
const PENTA_LETTER_STEP = { 0: 0, 2: 1, 3: 2, 4: 2, 5: 3, 7: 4, 9: 5, 10: 6 };

const ENHARMONIC_ROOT = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#', 'F#': 'Gb',
  'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#',
};

function spellFromRoot(rootNote, intervals) {
  const li = NOTE_LETTERS.indexOf(rootNote[0]);
  const rootPc = noteIndex(rootNote);
  if (li < 0 || rootPc < 0) return null;
  const steps = intervals.length === 7
    ? intervals.map((_, i) => i)
    : intervals.map(iv => PENTA_LETTER_STEP[iv]);
  if (steps.some(s => s == null)) return null;
  return intervals.map((iv, i) => spellPitch((rootPc + iv) % 12, NOTE_LETTERS[(li + steps[i]) % 7]));
}

// Lower is better: double accidentals are unacceptable, white-key accidentals
// (E#, B#, Cb, Fb) are merely awkward. Ties keep the user's root spelling.
function spellingScore(spelled) {
  let score = 0;
  for (const s of spelled) {
    if (Math.abs(s.acc) >= 2) score += 10;
    else if (s.acc === 1 && (s.name[0] === 'E' || s.name[0] === 'B')) score += 1;
    else if (s.acc === -1 && (s.name[0] === 'C' || s.name[0] === 'F')) score += 1;
  }
  return score;
}

// Returns scale note names for a key, spelled for the key context.
export function scaleNotes(rootNote, scaleName = 'major') {
  const intervals = SCALES[scaleName];
  if (!intervals) return [];
  const main = spellFromRoot(rootNote, intervals);
  const altRoot = ENHARMONIC_ROOT[rootNote];
  const alt = altRoot ? spellFromRoot(altRoot, intervals) : null;
  let best = main;
  if (main && alt && spellingScore(alt) < spellingScore(main)) best = alt;
  if (!best) best = alt;
  if (best && spellingScore(best) < 10) return best.map(s => s.name);
  // Defensive fallback (unreachable for the app's root set): chromatic sharps.
  const root = noteIndex(rootNote);
  return intervals.map(iv => noteName(root + iv));
}

// Returns array of diatonic chord objects: { root, quality, roman, degree, name }.
// Empty array for scales without a diatonic triad set (e.g. pentatonics).
export function diatonicChords(rootNote, mode = 'major') {
  const info = MODES[mode];
  if (!info || !info.qualities) return [];
  const notes = scaleNotes(rootNote, mode);
  return notes.map((n, i) => ({
    root: n,
    quality: info.qualities[i],
    roman: info.romans[i],
    degree: i + 1,
    name: n + qualitySuffix(info.qualities[i]),
  }));
}

// Secondary dominants for the current mode. Skips the tonic (V/I = ordinary V)
// and any degree whose triad is dim/aug (V/vii° doesn't function as a dominant).
export function secondaryDominants(rootNote, mode = 'major') {
  const info = MODES[mode];
  if (!info || !info.qualities) return [];
  const notes = scaleNotes(rootNote, mode);
  const out = [];
  for (let deg = 1; deg < 7; deg++) {
    const q = info.qualities[deg];
    if (q === 'dim' || q === 'aug') continue;
    const targetNote = notes[deg];
    const dominantRoot = fifthAbove(targetNote);
    out.push({
      root: dominantRoot,
      quality: '7',
      target: deg + 1,
      name: dominantRoot + '7',
      label: `V/${info.romans[deg]}`,
    });
  }
  return out;
}

// Perfect fifth above a note, spelled letter-wise (V/Eb is Bb7, not A#7).
function fifthAbove(note) {
  const li = NOTE_LETTERS.indexOf(note[0]);
  const pc = noteIndex(note);
  if (li < 0 || pc < 0) return noteName(pc + 7);
  const s = spellPitch((pc + 7) % 12, NOTE_LETTERS[(li + 4) % 7]);
  return Math.abs(s.acc) >= 2 ? noteName(pc + 7) : s.name;
}

// True when every chord note belongs to the scale (compared by pitch class).
export function isChordInScale(chordNotes, scaleNotes) {
  if (!chordNotes || !chordNotes.length || !scaleNotes || !scaleNotes.length) return false;
  const set = new Set(scaleNotes.map(n => noteIndex(n)));
  return chordNotes.every(n => set.has(noteIndex(n)));
}
