// scripts/check-spelling.js — verification of enharmonic spelling (node scripts/check-spelling.js).
// Runs every selectable root × every mode through the spelling rules and asserts:
// pitch classes intact, letters used correctly, no double accidentals, diatonic
// chords / secondary dominants consistent, voicing lookups work for flat roots.

import {
  SCALES, NOTE_LETTERS,
  noteIndex, scaleNotes, diatonicChords, secondaryDominants,
  chordNotes, voicingsForChord, isChordInScale,
} from '../src/theory/index.js';

const ROOTS = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];
let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL  ' + msg); };

/* ─── 1. Structural checks: every root × every scale ─────────── */
for (const root of ROOTS) {
  for (const [scale, intervals] of Object.entries(SCALES)) {
    const ctx = `${root} ${scale}`;
    const notes = scaleNotes(root, scale);
    if (notes.length !== intervals.length) { fail(`${ctx}: length ${notes.length}`); continue; }

    const rootPc = noteIndex(root);
    notes.forEach((n, i) => {
      const pc = noteIndex(n);
      if (pc < 0) fail(`${ctx}: unparseable note '${n}'`);
      if (pc !== (rootPc + intervals[i]) % 12) fail(`${ctx}: degree ${i + 1} '${n}' wrong pitch`);
      if (n.includes('##') || n.includes('bb')) fail(`${ctx}: double accidental '${n}'`);
    });

    if (intervals.length === 7) {
      const letters = notes.map(n => n[0]);
      if (new Set(letters).size !== 7) fail(`${ctx}: letters not unique [${notes.join(' ')}]`);
      for (let i = 0; i < 6; i++) {
        const next = NOTE_LETTERS[(NOTE_LETTERS.indexOf(letters[i]) + 1) % 7];
        if (letters[i + 1] !== next) fail(`${ctx}: letters not consecutive [${notes.join(' ')}]`);
      }
      // Diatonic chords must reuse the scale spelling.
      const dia = diatonicChords(root, scaleKeyToMode(scale));
      dia.forEach((c, i) => {
        if (c.root !== notes[i]) fail(`${ctx}: diatonic ${i + 1} root '${c.root}' ≠ scale '${notes[i]}'`);
        if (!c.name.startsWith(c.root)) fail(`${ctx}: diatonic name '${c.name}' ≠ root '${c.root}'`);
      });
      // Secondary dominants: perfect fifth above their target, sanely spelled.
      for (const d of secondaryDominants(root, scaleKeyToMode(scale))) {
        const target = notes[d.target - 1];
        if (noteIndex(d.root) !== (noteIndex(target) + 7) % 12) fail(`${ctx}: ${d.label} root '${d.root}' not a fifth above '${target}'`);
        if (d.root.includes('##') || d.root.includes('bb')) fail(`${ctx}: ${d.label} root '${d.root}' double accidental`);
      }
    }
  }
}

// SCALES and MODES share keys; identity map, kept explicit in case they diverge.
function scaleKeyToMode(scale) { return scale; }

/* ─── 2. Golden spellings ────────────────────────────────────── */
const GOLDEN = [
  ['D',  'minor',           'D E F G A Bb C'],
  ['F',  'major',           'F G A Bb C D E'],
  ['Bb', 'major',           'Bb C D Eb F G A'],
  ['Eb', 'major',           'Eb F G Ab Bb C D'],
  ['Db', 'major',           'Db Eb F Gb Ab Bb C'],
  ['F#', 'major',           'F# G# A# B C# D# E#'],
  ['B',  'major',           'B C# D# E F# G# A#'],
  ['C#', 'major',           'Db Eb F Gb Ab Bb C'],   // respelled: Db major (5b) beats C# major (E#+B#)
  ['D#', 'major',           'Eb F G Ab Bb C D'],     // respelled: D# major needs F## C##
  ['G#', 'major',           'Ab Bb C Db Eb F G'],    // respelled
  ['A#', 'major',           'Bb C D Eb F G A'],      // respelled
  ['C#', 'minor',           'C# D# E F# G# A B'],
  ['D#', 'minor',           'D# E# F# G# A# B C#'],  // kept: tie with Eb minor (Cb)
  ['A#', 'minor',           'Bb C Db Eb F Gb Ab'],   // respelled: Bb minor beats A# minor (B#+E#)
  ['Ab', 'minor',           'G# A# B C# D# E F#'],   // respelled: G# minor beats Ab minor (Cb+Fb)
  ['Db', 'locrian',         'C# D E F# G A B'],      // respelled: Db locrian needs Ebb Abb Bbb
  ['D',  'dorian',          'D E F G A B C'],
  ['E',  'phrygian',        'E F G A B C D'],
  ['F',  'lydian',          'F G A B C D E'],
  ['G',  'mixolydian',      'G A B C D E F'],
  ['B',  'locrian',         'B C D E F G A'],
  ['A',  'harmonicMinor',   'A B C D E F G#'],
  ['A',  'melodicMinor',    'A B C D E F# G#'],
  ['C',  'minorPentatonic', 'C Eb F G Bb'],
  ['A',  'majorPentatonic', 'A B C# E F#'],
  ['A#', 'majorPentatonic', 'Bb C D F G'],           // respelled (A# pent needs C##)
];
for (const [root, scale, expected] of GOLDEN) {
  const got = scaleNotes(root, scale).join(' ');
  if (got !== expected) fail(`golden ${root} ${scale}: got [${got}], want [${expected}]`);
}

/* ─── 3. Chord spelling follows the root ─────────────────────── */
const CHORD_GOLDEN = [
  ['Bb', 'maj', 'Bb D F'],
  ['Bb', 'min', 'Bb Db F'],
  ['Eb', 'min', 'Eb Gb Bb'],
  ['E#', 'dim', 'E# G# B'],
  ['C#', 'maj', 'C# F G#'],   // sharp roots stay in the sharp family
  ['A',  '7',   'A C# E G'],
];
for (const [root, type, expected] of CHORD_GOLDEN) {
  const got = chordNotes(root, type).join(' ');
  if (got !== expected) fail(`chordNotes ${root}${type}: got [${got}], want [${expected}]`);
}

/* ─── 4. Pitch-class plumbing with flat spellings ────────────── */
const STD = ['E','A','D','G','B','E'];
const bb = voicingsForChord({ root: 'Bb', type: 'maj' }, 'guitar', STD);
if (bb.length === 0) fail('voicingsForChord Bb guitar: no inversions');
if (bb[0] && bb[0].source !== 'curated') fail(`voicingsForChord Bb guitar: root inversion source '${bb[0].source}', want curated (A# alias)`);
const ebm = voicingsForChord({ root: 'Eb', type: 'min' }, 'guitar', STD);
if (ebm.length === 0 || ebm[0].source !== 'curated') fail('voicingsForChord Ebm guitar: curated lookup via D#m alias failed');
if (voicingsForChord({ root: 'Bb', type: 'maj' }, 'guitar', ['D','A','D','G','B','E']).length === 0) fail('generator: Bb on drop D found nothing');
if (voicingsForChord({ root: 'Bb', type: 'maj' }, 'piano', []).length === 0) fail('piano voicing for Bb failed');
if (voicingsForChord({ root: 'Eb', type: 'maj' }, 'bass', ['B','E','A','D','G']).length === 0) fail('bass voicing for Eb failed');

if (!isChordInScale(['Bb','D','F'], scaleNotes('F', 'major'))) fail('isChordInScale: Bb in F major (flat spelling)');
if (!isChordInScale(['A#','D','F'], scaleNotes('F', 'major'))) fail('isChordInScale: A# in F major (pitch-class match)');
if (noteIndex('E#') !== 5 || noteIndex('Cb') !== 11 || noteIndex('B#') !== 0 || noteIndex('Fb') !== 4) fail('noteIndex: white-key accidentals');

const dbDoms = secondaryDominants('Db', 'major').map(d => d.name);
if (!dbDoms.includes('Bb7')) fail(`secondaryDominants Db major: want Bb7 among [${dbDoms.join(' ')}]`);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('All spelling checks passed: ' + ROOTS.length + ' roots × ' + Object.keys(SCALES).length + ' modes + golden cases.');
