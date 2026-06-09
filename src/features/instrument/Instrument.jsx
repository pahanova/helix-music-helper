// Instrument.jsx — shell, picks guitar / bass / piano

import * as HelixAudio from '../../audio/index.js';
import Fretboard from './Fretboard.jsx';
import Piano from './Piano.jsx';
import './instrument.css';

export default function Instrument({ instrument, tuning, highlightedNotes, selectedPositions, onPositionClick, capoFret, frets, audioMuted }) {
  const playMidi = (midi) => {
    if (audioMuted || midi == null || !HelixAudio) return;
    HelixAudio.ensureUnlocked();
    HelixAudio.playNote(instrument, midi);
  };
  if (instrument === 'piano') {
    return <Piano startOctave={3} octaves={3} highlightedNotes={highlightedNotes} onKeyClick={() => {}} onPlayNote={playMidi} />;
  }
  const openMidis = HelixAudio
    ? HelixAudio.tuningOpenMidis(tuning, instrument)
    : [];
  return (
    <Fretboard
      tuning={tuning}
      frets={frets}
      highlightedNotes={highlightedNotes}
      selectedPositions={selectedPositions}
      onPositionClick={onPositionClick}
      onPlayNote={playMidi}
      openMidis={openMidis}
      capoFret={capoFret}
    />
  );
}
