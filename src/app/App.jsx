// src/app/App.jsx — application state + layout composition (thin on purpose:
// all markup lives in TopBar / LeftPanel / CenterColumn / PinnedBar / RightPanel).

import { useState, useEffect, useMemo } from 'react';
import * as HelixAudio from '../audio/index.js';
import {
  CHORD_TYPES, TUNINGS, keyLabel,
  chordNotes, voicingsForChord,
  scaleNotes as scaleNotesFor,
  diatonicChords as diatonicChordsFor,
  secondaryDominants as secondaryDominantsFor,
} from '../theory/index.js';
import { useTweaks } from '../tweaks/index.js';
import PinnedBar from '../features/pinned/PinnedBar.jsx';
import { useNarrow } from './useNarrow.js';
import TopBar from './TopBar.jsx';
import LeftPanel from './LeftPanel.jsx';
import CenterColumn from './CenterColumn.jsx';
import RightPanel from './RightPanel.jsx';
import AppTweaks from './AppTweaks.jsx';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "highlightMode": "degree",
  "circleVariant": "wheel",
  "density": "regular",
  "showRomanInWheel": true
}/*EDITMODE-END*/;

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const narrow = useNarrow(1024);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Music state
  const [rootNote, setRootNote] = useState('C');
  const [mode, setMode] = useState('major'); // any key in MODES
  const [instrument, setInstrument] = useState('guitar');
  const [tuningName, setTuningName] = useState('Standard');
  const [capoFret, setCapoFret] = useState(0);

  const [activeChord, setActiveChord] = useState(null); // { root, type, name } currently displayed on instrument
  const [pinned, setPinned] = useState([
    { name: 'C', root: 'C', type: 'maj' },
    { name: 'G', root: 'G', type: 'maj' },
    { name: 'Am', root: 'A', type: 'min' },
    { name: 'F', root: 'F', type: 'maj' },
  ]);
  const [circleCollapsed, setCircleCollapsed] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);

  // Audio
  const [audioMuted, setAudioMuted] = useState(false);
  const [chordPlayMode, setChordPlayMode] = useState('block'); // 'block' | 'arpeggio'

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.dark ? 'dark' : 'light');
  }, [tweaks.dark]);

  // Preload current instrument's soundfont (silent on failure; first user click retries).
  useEffect(() => {
    if (audioMuted) return;
    HelixAudio.load(instrument).catch(() => {});
  }, [instrument, audioMuted]);

  // Tuning resolution
  const tuning = useMemo(() => {
    if (instrument === 'guitar') return TUNINGS.guitar6[tuningName] || TUNINGS.guitar6['Standard'];
    if (instrument === 'bass') return TUNINGS.bass5[tuningName] || TUNINGS.bass5['Standard'];
    return [];
  }, [instrument, tuningName]);

  const tuningOptions = useMemo(() => {
    if (instrument === 'guitar') return Object.keys(TUNINGS.guitar6);
    if (instrument === 'bass') return Object.keys(TUNINGS.bass5);
    return [];
  }, [instrument]);

  useEffect(() => {
    if (!tuningOptions.includes(tuningName)) setTuningName(tuningOptions[0] || 'Standard');
  }, [instrument]);

  // Diatonic / chord notes for highlighting
  const scaleNotes = useMemo(() => scaleNotesFor(rootNote, mode), [rootNote, mode]);
  const diatonicChords = useMemo(() => diatonicChordsFor(rootNote, mode), [rootNote, mode]);
  const secondaryDoms = useMemo(() => secondaryDominantsFor(rootNote, mode), [rootNote, mode]);
  const hasDiatonic = diatonicChords.length > 0;

  const highlightedNotes = useMemo(() => {
    const hl = {};
    if (activeChord) {
      const cNotes = activeChord.notes || chordNotes(activeChord.root, activeChord.type);
      cNotes.forEach((n, i) => {
        // role: root vs other
        const degInScale = scaleNotes.indexOf(n) + 1;
        hl[n] = {
          degree: degInScale > 0 ? degInScale : 'x',
          label: i === 0 ? 'R' : (degInScale > 0 ? String(degInScale) : n),
          role: i === 0 ? 'is-root' : '',
        };
      });
    } else {
      // Highlight whole scale
      scaleNotes.forEach((n, i) => {
        hl[n] = { degree: i + 1, label: String(i + 1) };
      });
    }
    return hl;
  }, [scaleNotes, activeChord]);

  function handleSelectKey(note, m) {
    setRootNote(note);
    setMode(m);
    setActiveChord(null);
  }

  function handleChordClick(chord, voicing) {
    setActiveChord(chord);
    if (audioMuted || !HelixAudio) return;
    HelixAudio.ensureUnlocked();
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
      // Fallback: synth chord from intervals at sensible octave for the instrument.
      const intervals = chord.intervals
        || CHORD_TYPES[chord.type]
        || [0, 4, 7];
      const baseOct = instrument === 'bass' ? 2 : 3;
      const root = HelixAudio.noteToMidi(chord.root, baseOct);
      midis = intervals.map(i => root + i);
    }
    HelixAudio.playChord(instrument, midis, { mode: chordPlayMode });
  }

  function handlePin(c) {
    setPinned(prev => {
      const exists = prev.some(p => p.name === c.name);
      if (exists) return prev.filter(p => p.name !== c.name);
      return [...prev, c];
    });
  }

  const pinnedNames = pinned.map(p => p.name);

  const appCls = `app ${narrow ? 'app-narrow' : ''} ${!narrow && leftCollapsed ? 'left-collapsed' : ''} ${!narrow && rightCollapsed ? 'right-collapsed' : ''} density-${tweaks.density}`;

  return (
    <div className={appCls}>
      <TopBar
        narrow={narrow}
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        onToggleLeft={() => narrow ? setLeftOpen(o => !o) : setLeftCollapsed(c => !c)}
        onToggleRight={() => narrow ? setRightOpen(o => !o) : setRightCollapsed(c => !c)}
        rootNote={rootNote}
        mode={mode}
        onKeyChange={(r, m) => { setRootNote(r); setMode(m); setActiveChord(null); }}
        scaleNotes={scaleNotes}
        chordPlayMode={chordPlayMode}
        onTogglePlayMode={() => setChordPlayMode(m => m === 'block' ? 'arpeggio' : 'block')}
        audioMuted={audioMuted}
        onToggleMute={() => setAudioMuted(m => !m)}
        dark={tweaks.dark}
        onToggleDark={() => setTweak('dark', !tweaks.dark)}
      />

      <LeftPanel
        open={leftOpen}
        instrument={instrument}
        onSelectInstrument={setInstrument}
        tuningName={tuningName}
        onSelectTuning={setTuningName}
        tuningOptions={tuningOptions}
        tuning={tuning}
        capoFret={capoFret}
        onSetCapo={setCapoFret}
        mode={mode}
        rootNote={rootNote}
        onSelectMode={(m) => { setMode(m); setActiveChord(null); }}
        onSelectRoot={(n) => { setRootNote(n); setActiveChord(null); }}
        diatonicChords={diatonicChords}
        secondaryDoms={secondaryDoms}
        hasDiatonic={hasDiatonic}
        activeChord={activeChord}
        onChordClick={handleChordClick}
      />

      <main className="pane-main">
        <CenterColumn
          narrow={narrow}
          instrument={instrument}
          tuning={tuning}
          capoFret={capoFret}
          highlightedNotes={highlightedNotes}
          audioMuted={audioMuted}
          activeChord={activeChord}
          onClearActiveChord={() => setActiveChord(null)}
          highlightMode={tweaks.highlightMode}
          rootNote={rootNote}
          mode={mode}
          onSelectKey={handleSelectKey}
          circleCollapsed={circleCollapsed}
          onToggleCircle={() => setCircleCollapsed(c => !c)}
          diatonicChords={diatonicChords}
          hasDiatonic={hasDiatonic}
          onChordClick={handleChordClick}
        />
        <PinnedBar
          pinned={pinned}
          collapsed={pinnedCollapsed}
          onToggleCollapsed={() => setPinnedCollapsed(c => !c)}
          instrument={instrument}
          tuning={tuning}
          onChordClick={handleChordClick}
          onUnpin={handlePin}
        />
      </main>

      <RightPanel
        open={rightOpen}
        collapsed={searchCollapsed}
        onToggleCollapsed={() => setSearchCollapsed(c => !c)}
        instrument={instrument}
        tuning={tuning}
        scaleNotes={scaleNotes}
        keyName={keyLabel(rootNote, mode)}
        onPin={handlePin}
        pinnedNames={pinnedNames}
        onChordClick={handleChordClick}
      />

      {/* Narrow scrim */}
      {narrow && (leftOpen || rightOpen) && (
        <div onClick={() => { setLeftOpen(false); setRightOpen(false); }}
             style={{position: 'fixed', inset: '44px 0 0 0', background: 'rgba(0,0,0,0.3)', zIndex: 40}} />
      )}

      <AppTweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}
