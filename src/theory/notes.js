// src/theory/notes.js
// Note names and chromatic helpers.

export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const noteIndex = (n) => NOTES_SHARP.indexOf(n) >= 0 ? NOTES_SHARP.indexOf(n) : NOTES_FLAT.indexOf(n);
export const noteName = (idx, useFlats = false) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[((idx % 12) + 12) % 12];

// Returns the note at a specific fret on a string tuned to openNote
export function fretNote(openNote, fret) {
  return noteName(noteIndex(openNote) + fret);
}
