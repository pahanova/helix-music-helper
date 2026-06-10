// src/theory/notes.js
// Note names, chromatic helpers and enharmonic spelling primitives.

export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Natural letters in scale order and their pitch classes.
export const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LETTER_PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Pitch class for any spelling: chromatic names fast-path, then letter+accidentals
// (handles E#, B#, Cb, Fb, doubles — legit spellings in sharp/flat keys). -1 when unparseable.
export const noteIndex = (n) => {
  let i = NOTES_SHARP.indexOf(n);
  if (i >= 0) return i;
  i = NOTES_FLAT.indexOf(n);
  if (i >= 0) return i;
  if (typeof n !== 'string' || n.length === 0) return -1;
  let p = LETTER_PITCH[n[0]];
  if (p == null) return -1;
  for (let k = 1; k < n.length; k++) {
    if (n[k] === '#') p += 1;
    else if (n[k] === 'b') p -= 1;
    else return -1;
  }
  return ((p % 12) + 12) % 12;
};

export const noteName = (idx, useFlats = false) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[((idx % 12) + 12) % 12];

// Spell a pitch class on a given letter: spellPitch(10, 'B') → { name: 'Bb', acc: -1 }.
// acc is the signed accidental count (… -1 = b, 0 = natural, 1 = #, 2 = ## …).
export function spellPitch(pitchClass, letter) {
  let acc = (((pitchClass - LETTER_PITCH[letter]) % 12) + 12) % 12;
  if (acc > 6) acc -= 12;
  return { name: letter + (acc >= 0 ? '#'.repeat(acc) : 'b'.repeat(-acc)), acc };
}

// Returns the note at a specific fret on a string tuned to openNote
export function fretNote(openNote, fret) {
  return noteName(noteIndex(openNote) + fret);
}
