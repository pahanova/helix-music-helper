// music-theory.js
// Core music-theory data: notes, scales, chords, fretboard helpers.

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Scale interval patterns (semitones from root)
const SCALES = {
  major:        [0, 2, 4, 5, 7, 9, 11],
  minor:        [0, 2, 3, 5, 7, 8, 10],
  dorian:       [0, 2, 3, 5, 7, 9, 10],
  phrygian:     [0, 1, 3, 5, 7, 8, 10],
  lydian:       [0, 2, 4, 6, 7, 9, 11],
  mixolydian:   [0, 2, 4, 5, 7, 9, 10],
  locrian:      [0, 1, 3, 5, 6, 8, 10],
  harmonicMinor:[0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
};

// Diatonic chord qualities for major / minor
const DIATONIC_QUALITIES = {
  major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
  minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
};
const ROMAN_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const ROMAN_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

// Chord intervals (semitones from root)
const CHORD_TYPES = {
  'maj':    [0, 4, 7],
  'min':    [0, 3, 7],
  'dim':    [0, 3, 6],
  'aug':    [0, 4, 8],
  'sus2':   [0, 2, 7],
  'sus4':   [0, 5, 7],
  'maj7':   [0, 4, 7, 11],
  'min7':   [0, 3, 7, 10],
  '7':      [0, 4, 7, 10],
  'dim7':   [0, 3, 6, 9],
  'm7b5':   [0, 3, 6, 10],
  'maj9':   [0, 4, 7, 11, 14],
  'min9':   [0, 3, 7, 10, 14],
  '9':      [0, 4, 7, 10, 14],
  '6':      [0, 4, 7, 9],
  'm6':     [0, 3, 7, 9],
  'add9':   [0, 4, 7, 14],
  '11':     [0, 4, 7, 10, 14, 17],
  '13':     [0, 4, 7, 10, 14, 17, 21],
};

// Circle of fifths order, starting from C, going clockwise
const CIRCLE_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const CIRCLE_MINOR = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

// Standard tunings (low → high), as note names
const TUNINGS = {
  guitar6: {
    'Standard':  ['E', 'A', 'D', 'G', 'B', 'E'],
    'Drop D':    ['D', 'A', 'D', 'G', 'B', 'E'],
    'DADGAD':    ['D', 'A', 'D', 'G', 'A', 'D'],
    'Open G':    ['D', 'G', 'D', 'G', 'B', 'D'],
    'Open D':    ['D', 'A', 'D', 'F#', 'A', 'D'],
    'Half-step down': ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'],
  },
  bass5: {
    'Standard':  ['B', 'E', 'A', 'D', 'G'],
    'Drop A':    ['A', 'E', 'A', 'D', 'G'],
    'Tenor':     ['E', 'A', 'D', 'G', 'C'],
  },
};

// Helpers
const noteIndex = (n) => NOTES_SHARP.indexOf(n) >= 0 ? NOTES_SHARP.indexOf(n) : NOTES_FLAT.indexOf(n);
const noteName = (idx, useFlats = false) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[((idx % 12) + 12) % 12];

// Returns array of 7 note names for a key
function scaleNotes(rootNote, scaleName = 'major', useFlats = false) {
  const root = noteIndex(rootNote);
  return SCALES[scaleName].map(iv => noteName(root + iv, useFlats));
}

// Returns array of 7 diatonic chord objects: { root, quality, roman, degree }
function diatonicChords(rootNote, mode = 'major') {
  const notes = scaleNotes(rootNote, mode);
  const qualities = DIATONIC_QUALITIES[mode];
  const romans = mode === 'major' ? ROMAN_MAJOR : ROMAN_MINOR;
  return notes.map((n, i) => ({
    root: n,
    quality: qualities[i],
    roman: romans[i],
    degree: i + 1,
    name: n + (qualities[i] === 'maj' ? '' : qualities[i] === 'min' ? 'm' : qualities[i] === 'dim' ? '°' : ''),
  }));
}

// Secondary dominants — V/ii, V/iii, V/IV, V/V, V/vi for major key
function secondaryDominants(rootNote, mode = 'major') {
  const notes = scaleNotes(rootNote, mode);
  const targets = mode === 'major' ? [1, 2, 3, 4, 5] : [2, 3, 4, 5, 6]; // skip i and vii°
  return targets.map(deg => {
    const targetNote = notes[deg];
    const dominantRoot = noteName(noteIndex(targetNote) + 7);
    return {
      root: dominantRoot,
      quality: '7',
      target: deg + 1,
      name: dominantRoot + '7',
      label: `V/${(mode === 'major' ? ROMAN_MAJOR : ROMAN_MINOR)[deg]}`,
    };
  });
}

// Returns the notes of a chord
function chordNotes(rootNote, type) {
  const root = noteIndex(rootNote);
  const intervals = CHORD_TYPES[type] || CHORD_TYPES['maj'];
  return intervals.map(iv => noteName(root + iv));
}

// Returns the note at a specific fret on a string tuned to openNote
function fretNote(openNote, fret) {
  return noteName(noteIndex(openNote) + fret);
}

// Find chord identity from a set of notes
function identifyChord(noteList) {
  if (!noteList || noteList.length < 2) return null;
  const unique = [...new Set(noteList.map(n => noteIndex(n)))];
  if (unique.length < 2) return null;
  // try every note as potential root
  for (const root of unique) {
    const intervals = unique.map(n => ((n - root) % 12 + 12) % 12).sort((a, b) => a - b);
    for (const [type, pattern] of Object.entries(CHORD_TYPES)) {
      const patMod = pattern.map(p => p % 12).sort((a, b) => a - b);
      if (patMod.length === intervals.length && patMod.every((v, i) => v === intervals[i])) {
        return { root: noteName(root), type, name: noteName(root) + (type === 'maj' ? '' : type) };
      }
    }
  }
  return null;
}

// PIANO_NOTES — full keyboard layout helper
function pianoOctave(startOctave = 3, octaves = 3) {
  const keys = [];
  for (let o = 0; o < octaves; o++) {
    for (let i = 0; i < 12; i++) {
      const name = NOTES_SHARP[i];
      keys.push({
        name,
        octave: startOctave + o,
        isBlack: name.includes('#'),
        midi: (startOctave + o + 1) * 12 + i,
      });
    }
  }
  return keys;
}

window.MT = {
  NOTES_SHARP, NOTES_FLAT, SCALES, CHORD_TYPES,
  CIRCLE_MAJOR, CIRCLE_MINOR,
  TUNINGS, ROMAN_MAJOR, ROMAN_MINOR,
  noteIndex, noteName, scaleNotes,
  diatonicChords, secondaryDominants, chordNotes,
  fretNote, identifyChord, pianoOctave,
};
