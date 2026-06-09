// src/theory/piano-layout.js
// PIANO_NOTES — full keyboard layout helper

import { NOTES_SHARP } from './notes.js';

export function pianoOctave(startOctave = 3, octaves = 3) {
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
