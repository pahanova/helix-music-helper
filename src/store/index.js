// src/store/index.js — app-wide state (zustand): music / audio / panel layout.
// Components subscribe to individual fields. Derived values (tuning, scale,
// diatonic chords, highlights) are NOT stored — they're exposed as memoized
// hooks below, so theory stays the single source of truth.

import { useMemo } from 'react';
import { create } from 'zustand';
import * as HelixAudio from '../audio/index.js';
import {
  CHORD_TYPES, TUNINGS, keyLabel,
  chordNotes, voicingsForChord,
  scaleNotes as scaleNotesFor,
  diatonicChords as diatonicChordsFor,
  secondaryDominants as secondaryDominantsFor,
} from '../theory/index.js';

const BREAKPOINT = 1024;

function tuningFor(instrument, tuningName) {
  if (instrument === 'guitar') return TUNINGS.guitar6[tuningName] || TUNINGS.guitar6['Standard'];
  if (instrument === 'bass') return TUNINGS.bass5[tuningName] || TUNINGS.bass5['Standard'];
  return [];
}

function tuningOptionsFor(instrument) {
  if (instrument === 'guitar') return Object.keys(TUNINGS.guitar6);
  if (instrument === 'bass') return Object.keys(TUNINGS.bass5);
  return [];
}

export const useStore = create((set, get) => ({
  // Music
  rootNote: 'C',
  mode: 'major', // any key in MODES
  instrument: 'guitar',
  tuningName: 'Standard',
  capoFret: 0,
  activeChord: null, // { root, type, name } currently displayed on the instrument
  pinned: [
    { name: 'C', root: 'C', type: 'maj' },
    { name: 'G', root: 'G', type: 'maj' },
    { name: 'Am', root: 'A', type: 'min' },
    { name: 'F', root: 'F', type: 'maj' },
  ],

  // Audio
  audioMuted: false,
  chordPlayMode: 'block', // 'block' | 'arpeggio'

  // Layout: narrow viewport drawers, wide-screen collapses, section collapses
  narrow: window.innerWidth < BREAKPOINT,
  leftOpen: false,
  rightOpen: false,
  leftCollapsed: false,
  rightCollapsed: false,
  circleCollapsed: false,
  searchCollapsed: false,
  pinnedCollapsed: false,

  selectKey: (rootNote, mode) => set({ rootNote, mode, activeChord: null }),
  selectRoot: (rootNote) => set({ rootNote, activeChord: null }),
  selectMode: (mode) => set({ mode, activeChord: null }),
  selectInstrument: (instrument) => set(s => {
    const options = tuningOptionsFor(instrument);
    if (options.includes(s.tuningName)) return { instrument };
    return { instrument, tuningName: options[0] || 'Standard' };
  }),
  selectTuning: (tuningName) => set({ tuningName }),
  setCapo: (capoFret) => set({ capoFret }),
  clearActiveChord: () => set({ activeChord: null }),

  toggleMute: () => set(s => ({ audioMuted: !s.audioMuted })),
  togglePlayMode: () => set(s => ({ chordPlayMode: s.chordPlayMode === 'block' ? 'arpeggio' : 'block' })),

  togglePin: (c) => set(s => {
    const exists = s.pinned.some(p => p.name === c.name);
    return { pinned: exists ? s.pinned.filter(p => p.name !== c.name) : [...s.pinned, c] };
  }),

  // Topbar togglers: drawers on narrow viewports, grid collapse on wide.
  toggleLeftPane: () => set(s => s.narrow ? { leftOpen: !s.leftOpen } : { leftCollapsed: !s.leftCollapsed }),
  toggleRightPane: () => set(s => s.narrow ? { rightOpen: !s.rightOpen } : { rightCollapsed: !s.rightCollapsed }),
  closeDrawers: () => set({ leftOpen: false, rightOpen: false }),
  toggleCircleCollapsed: () => set(s => ({ circleCollapsed: !s.circleCollapsed })),
  toggleSearchCollapsed: () => set(s => ({ searchCollapsed: !s.searchCollapsed })),
  togglePinnedCollapsed: () => set(s => ({ pinnedCollapsed: !s.pinnedCollapsed })),

  // Click on any chord card: show it on the instrument + play the shown voicing.
  // Without a voicing — the root inversion; with nothing playable — synthesize
  // from CHORD_TYPES intervals at a sensible octave.
  playChord: (chord, voicing) => {
    set({ activeChord: chord });
    const { audioMuted, instrument, tuningName, chordPlayMode } = get();
    if (audioMuted) return;
    HelixAudio.ensureUnlocked();
    const tuning = tuningFor(instrument, tuningName);
    let v = voicing;
    if (!v) {
      const inv = voicingsForChord(chord, instrument, tuning)[0];
      v = inv ? inv.voicing : null;
    }
    let midis;
    if (v) {
      const openMidis = HelixAudio.tuningOpenMidis(tuning, instrument);
      midis = HelixAudio.voicingToMidis(v, openMidis);
    } else {
      const intervals = chord.intervals || CHORD_TYPES[chord.type] || [0, 4, 7];
      const baseOct = instrument === 'bass' ? 2 : 3;
      const root = HelixAudio.noteToMidi(chord.root, baseOct);
      midis = intervals.map(i => root + i);
    }
    HelixAudio.playChord(instrument, midis, { mode: chordPlayMode });
  },
}));

window.addEventListener('resize', () => {
  const narrow = window.innerWidth < BREAKPOINT;
  if (narrow !== useStore.getState().narrow) useStore.setState({ narrow });
});

/* ─── Derived state hooks ───────────────────────────────────── */

export function useTuning() {
  const instrument = useStore(s => s.instrument);
  const tuningName = useStore(s => s.tuningName);
  return useMemo(() => tuningFor(instrument, tuningName), [instrument, tuningName]);
}

export function useTuningOptions() {
  const instrument = useStore(s => s.instrument);
  return useMemo(() => tuningOptionsFor(instrument), [instrument]);
}

export function useScaleNotes() {
  const rootNote = useStore(s => s.rootNote);
  const mode = useStore(s => s.mode);
  return useMemo(() => scaleNotesFor(rootNote, mode), [rootNote, mode]);
}

export function useDiatonicChords() {
  const rootNote = useStore(s => s.rootNote);
  const mode = useStore(s => s.mode);
  return useMemo(() => diatonicChordsFor(rootNote, mode), [rootNote, mode]);
}

export function useSecondaryDoms() {
  const rootNote = useStore(s => s.rootNote);
  const mode = useStore(s => s.mode);
  return useMemo(() => secondaryDominantsFor(rootNote, mode), [rootNote, mode]);
}

export function useKeyName() {
  return useStore(s => keyLabel(s.rootNote, s.mode));
}

// Notes to tint on the instrument: active chord (R/2/3/5/7 labels) or the whole scale.
export function useHighlightedNotes() {
  const scaleNotes = useScaleNotes();
  const activeChord = useStore(s => s.activeChord);
  return useMemo(() => {
    const hl = {};
    if (activeChord) {
      const cNotes = activeChord.notes || chordNotes(activeChord.root, activeChord.type);
      cNotes.forEach((n, i) => {
        const degInScale = scaleNotes.indexOf(n) + 1;
        hl[n] = {
          degree: degInScale > 0 ? degInScale : 'x',
          label: i === 0 ? 'R' : (degInScale > 0 ? String(degInScale) : n),
          role: i === 0 ? 'is-root' : '',
        };
      });
    } else {
      scaleNotes.forEach((n, i) => {
        hl[n] = { degree: i + 1, label: String(i + 1) };
      });
    }
    return hl;
  }, [scaleNotes, activeChord]);
}
