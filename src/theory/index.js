// src/theory/index.js
// Public surface of the theory layer (former window.MT).
// Components import from '<path>/theory' — never from the submodules directly.

export * from './notes.js';
export * from './scales.js';
export * from './chords.js';
export * from './circle-of-fifths.js';
export * from './tunings.js';
export * from './piano-layout.js';
export * from './voicings.js';
export { default as CHORD_SHAPES_DB } from './chord-shapes-data.js';
