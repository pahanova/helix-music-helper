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

// Build a chord from a constructor spec.
// spec = { root, quality, sus, ext7, maj7, ext9, alt9, ext11, alt11, ext13, alt13, alt5, omit3, omit5 }
//   quality: 'maj' | 'min' | 'dim' | 'aug'
//   sus:     null  | 'sus2' | 'sus4'    (replaces the 3rd)
//   ext7:    boolean — adds the 7th. Default flavour is dominant (♭7).
//   maj7:    boolean — when ext7 is on, raise to natural 7th (yields maj7 / m(maj7) / etc.)
//   ext9/11/13: booleans — each adds its own tone (no auto-implication of 7).
//   alt9:    null | 'b9' | '#9'
//   alt11:   null | '#11'
//   alt13:   null | 'b13'
//   alt5:    null | 'b5' | '#5'   (ignored when quality is dim/aug — those imply altered 5)
//   omit3, omit5: booleans
// Returns { intervals, labels, notes, name } or null when no root.
function buildChord(spec) {
  if (!spec || !spec.root) return null;
  const {
    quality = 'maj', sus = null,
    ext7 = false, maj7 = false,
    ext9 = false, alt9 = null,
    ext11 = false, alt11 = null,
    ext13 = false, alt13 = null,
    alt5 = null, omit3 = false, omit5 = false,
  } = spec;

  const intervals = [0];
  const labels = ['R'];

  // Third (or sus replacement). quality === '5' implies no third.
  if (sus === 'sus2') { intervals.push(2); labels.push('2'); }
  else if (sus === 'sus4') { intervals.push(5); labels.push('4'); }
  else if (!omit3 && quality !== '5') {
    if (quality === 'maj' || quality === 'aug') { intervals.push(4); labels.push('3'); }
    else { intervals.push(3); labels.push('♭3'); }
  }

  // Fifth
  if (!omit5) {
    if (quality === 'dim')      { intervals.push(6); labels.push('♭5'); }
    else if (quality === 'aug') { intervals.push(8); labels.push('♯5'); }
    else if (alt5 === 'b5')     { intervals.push(6); labels.push('♭5'); }
    else if (alt5 === '#5')     { intervals.push(8); labels.push('♯5'); }
    else                        { intervals.push(7); labels.push('5'); }
  }

  // Seventh — added if ext7 toggle is on
  if (ext7) {
    if (quality === 'dim' && !maj7) { intervals.push(9);  labels.push('♭♭7'); }
    else if (maj7)                   { intervals.push(11); labels.push('7');   }
    else                             { intervals.push(10); labels.push('♭7');  }
  }

  // Upper extensions — added independently of ext7 (lets you express add9/add11/add13)
  if (ext9) {
    if (alt9 === 'b9')      { intervals.push(13); labels.push('♭9'); }
    else if (alt9 === '#9') { intervals.push(15); labels.push('♯9'); }
    else                    { intervals.push(14); labels.push('9');  }
  }
  if (ext11) {
    if (alt11 === '#11') { intervals.push(18); labels.push('♯11'); }
    else                 { intervals.push(17); labels.push('11');  }
  }
  if (ext13) {
    if (alt13 === 'b13') { intervals.push(20); labels.push('♭13'); }
    else                 { intervals.push(21); labels.push('13');  }
  }

  const rootIdx = noteIndex(spec.root);
  const notes = intervals.map(iv => noteName(rootIdx + iv));

  return { root: spec.root, intervals, labels, notes, name: chordName(spec) };
}

// Canonical chord name from a spec. Tries to match common conventions; designed
// to land on CHORD_SHAPES keys for the standard shapes (C, Cmaj7, Am7, G7…).
function chordName(spec) {
  if (!spec || !spec.root) return '';
  const {
    quality = 'maj', sus = null,
    ext7 = false, maj7 = false,
    ext9 = false, alt9 = null,
    ext11 = false, alt11 = null,
    ext13 = false, alt13 = null,
    alt5 = null, omit3 = false, omit5 = false,
  } = spec;

  // Power-chord shortcut: when the spec collapses to root + perfect 5 only,
  // write "C5" regardless of which path got us there (quality='5' or quality+omit3).
  const noThird = sus == null && (omit3 || quality === '5');
  const plainFifth = !omit5 && quality !== 'dim' && quality !== 'aug' && !alt5;
  const noExtensions = !ext7 && !ext9 && !ext11 && !ext13;
  if (noThird && plainFifth && noExtensions) return spec.root + '5';

  // Highest unaltered extension to use as the headline number; otherwise drop one level.
  let headline = '';
  if (ext13 && !alt13) headline = '13';
  else if (ext11 && !alt11) headline = '11';
  else if (ext9 && !alt9) headline = '9';
  else if (ext7 || ext9 || ext11 || ext13) headline = '7';

  // The 7th must actually be present for jazz numbering (7/9/11/13). Without ext7,
  // upper extensions are "add" tones (e.g. Cadd9).
  let main = '';
  if (ext7) {
    if (sus) {
      main = (maj7 ? 'maj' : '') + headline + sus;
    } else if (quality === 'dim' && !maj7) {
      main = 'dim' + headline; // dim7 / dim9 / dim11 / dim13
    } else if (maj7) {
      if (quality === 'min')      main = 'm(maj' + headline + ')';
      else if (quality === 'aug') main = 'aug(maj' + headline + ')';
      else if (quality === 'dim') main = 'dim(maj' + headline + ')';
      else                        main = 'maj' + headline;
    } else {
      // dominant flavour: maj→'', min→'m', aug→'aug'
      const q = quality === 'min' ? 'm' : quality === 'aug' ? 'aug' : '';
      main = q + headline;
    }
  } else {
    // No 7th — base triad (or sus), plus "add" tones for upper extensions.
    if (sus) {
      main = sus;
    } else {
      if (quality === 'min')      main = 'm';
      else if (quality === 'dim') main = 'dim';
      else if (quality === 'aug') main = 'aug';
      // maj → ''
    }
    const adds = [];
    if (ext9) adds.push(alt9 === 'b9' ? '♭9' : alt9 === '#9' ? '♯9' : '9');
    if (ext11) adds.push(alt11 === '#11' ? '♯11' : '11');
    if (ext13) adds.push(alt13 === 'b13' ? '♭13' : '13');
    if (adds.length) main += 'add' + adds.join('add');
  }

  // Parenthesised: alterations and omits.
  const tail = [];
  if (alt5 === 'b5' && quality !== 'dim') tail.push('♭5');
  if (alt5 === '#5' && quality !== 'aug') tail.push('♯5');
  if (ext7 && ext9 && alt9 === 'b9') tail.push('♭9');
  if (ext7 && ext9 && alt9 === '#9') tail.push('♯9');
  if (ext7 && ext11 && alt11 === '#11') tail.push('♯11');
  if (ext7 && ext13 && alt13 === 'b13') tail.push('♭13');
  if ((omit3 || quality === '5') && !sus) tail.push('no3');
  if (omit5 && quality !== 'dim' && quality !== 'aug' && !alt5) tail.push('no5');

  const suffix = tail.length ? '(' + tail.join(',') + ')' : '';
  return spec.root + main + suffix;
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
  buildChord, chordName,
};
