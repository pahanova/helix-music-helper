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

// ─────────────────────────────────────────────────────────────────────────────
// Inversions and voicings
// ─────────────────────────────────────────────────────────────────────────────

const INVERSION_LABELS = ['root', '1st', '2nd', '3rd'];

// Returns inversion descriptors for a chord. Limited to the first 4 chord tones
// (R/3/5/7) — upper extensions like 9/11/13 aren't conventionally put in the bass.
function chordInversions(notes) {
  if (!notes || notes.length === 0) return [];
  const max = Math.min(notes.length, 4);
  return Array.from({ length: max }, (_, i) => ({
    degree: i,
    bassNote: notes[i],
    label: INVERSION_LABELS[i],
    slashSuffix: i === 0 ? '' : '/' + notes[i],
  }));
}

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
function generateFretboardVoicings(chordNotes, tuning, opts = {}) {
  const {
    maxFret = 12,
    maxSpan = 4,
    bassNote = chordNotes[0],
    minStrings = Math.min(chordNotes.length, tuning.length),
    maxResults = 3,
  } = opts;

  // For each string: list of options (muted, or a fret playing one of the chord tones).
  const stringOptions = tuning.map(open => {
    const opts = [{ fret: -1, note: null, toneIdx: null }]; // muted
    for (let f = 0; f <= maxFret; f++) {
      const note = fretNote(open, f);
      const idx = chordNotes.indexOf(note);
      if (idx >= 0) opts.push({ fret: f, note, toneIdx: idx });
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
      if (lowest.note !== bassNote) return;

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

// Piano voicing for an inversion: bass note + close-position upper voices.
// Returns { kind:'piano', notes: [{ name, octave, isBass }], range: { startOctave, octaves } }
function generatePianoVoicing(chordNotes, bassNote, opts = {}) {
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
// Curated voicings (from window.CHORD_SHAPES_DB) are looked up first; if found
// they're used and `source` is 'curated'. Otherwise we generate and mark `source: 'auto'`.
function voicingsForChord(chord, instrument, tuning) {
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
      if (isStandardGuitar && typeof window !== 'undefined' && window.CHORD_SHAPES_DB) {
        const curated = window.CHORD_SHAPES_DB[fullName] || (inv.degree === 0 && window.CHORD_SHAPES_DB[baseName]);
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

window.MT = {
  NOTES_SHARP, NOTES_FLAT, SCALES, CHORD_TYPES,
  CIRCLE_MAJOR, CIRCLE_MINOR,
  TUNINGS, ROMAN_MAJOR, ROMAN_MINOR,
  noteIndex, noteName, scaleNotes,
  diatonicChords, secondaryDominants, chordNotes,
  fretNote, identifyChord, pianoOctave,
  buildChord, chordName,
  chordInversions, generateFretboardVoicings, generatePianoVoicing, voicingsForChord,
};
