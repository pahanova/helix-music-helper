// features/diagrams/chord-shapes-fallback.js
// Simple shape library (low E on left) — ~20 базовых форм, фоллбэк/совместимость.
// Перенесено дословно из корневого chord-diagram.jsx (бывший window.CHORD_SHAPES).

export const CHORD_SHAPES = {
  'C':       { baseFret: 1, positions: [{string:0,fret:-1},{string:1,fret:3,finger:3},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'G':       { baseFret: 1, positions: [{string:0,fret:3,finger:2},{string:1,fret:2,finger:1},{string:2,fret:0},{string:3,fret:0},{string:4,fret:0},{string:5,fret:3,finger:3}] },
  'D':       { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:1},{string:4,fret:3,finger:3},{string:5,fret:2,finger:2}] },
  'A':       { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:1},{string:3,fret:2,finger:2},{string:4,fret:2,finger:3},{string:5,fret:0}] },
  'E':       { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:2,finger:3},{string:3,fret:1,finger:1},{string:4,fret:0},{string:5,fret:0}] },
  'F':       { baseFret: 1, positions: [{string:0,fret:1,finger:1},{string:1,fret:3,finger:3},{string:2,fret:3,finger:4},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:1,finger:1}] },
  'Am':      { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:2},{string:3,fret:2,finger:3},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'Em':      { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:2,finger:3},{string:3,fret:0},{string:4,fret:0},{string:5,fret:0}] },
  'Dm':      { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:2},{string:4,fret:3,finger:3},{string:5,fret:1,finger:1}] },
  'Bm':      { baseFret: 2, positions: [{string:1,fret:2,finger:1},{string:2,fret:4,finger:3},{string:3,fret:4,finger:4},{string:4,fret:3,finger:2},{string:5,fret:2,finger:1}] },
  'Cmaj7':   { baseFret: 1, positions: [{string:1,fret:3,finger:3},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:0},{string:5,fret:0}] },
  'G7':      { baseFret: 1, positions: [{string:0,fret:3,finger:3},{string:1,fret:2,finger:2},{string:2,fret:0},{string:3,fret:0},{string:4,fret:0},{string:5,fret:1,finger:1}] },
  'D7':      { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:2,finger:3}] },
  'Am7':     { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'Dm7':     { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:1,finger:1}] },
  'Em7':     { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:0},{string:3,fret:0},{string:4,fret:0},{string:5,fret:0}] },
  'Fmaj7':   { baseFret: 1, positions: [{string:2,fret:3,finger:3},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'A7':      { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:2,finger:3},{string:5,fret:0}] },
  'E7':      { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:0},{string:3,fret:1,finger:1},{string:4,fret:0},{string:5,fret:0}] },
  'B7':      { baseFret: 1, positions: [{string:1,fret:2,finger:2},{string:2,fret:1,finger:1},{string:3,fret:2,finger:3},{string:4,fret:0},{string:5,fret:2,finger:4}] },
};
