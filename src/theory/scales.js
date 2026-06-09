// src/theory/scales.js
// Scale interval patterns, mode metadata, diatonic chords and secondary dominants.

import { noteIndex, noteName } from './notes.js';
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

// Returns array of 7 note names for a key
export function scaleNotes(rootNote, scaleName = 'major', useFlats = false) {
  const root = noteIndex(rootNote);
  return SCALES[scaleName].map(iv => noteName(root + iv, useFlats));
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
    const dominantRoot = noteName(noteIndex(targetNote) + 7);
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

// True when every chord note belongs to the scale (compared by pitch class).
export function isChordInScale(chordNotes, scaleNotes) {
  if (!chordNotes || !chordNotes.length || !scaleNotes || !scaleNotes.length) return false;
  const set = new Set(scaleNotes.map(n => noteIndex(n)));
  return chordNotes.every(n => set.has(noteIndex(n)));
}
