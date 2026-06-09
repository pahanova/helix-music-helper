// src/app/CenterColumn.jsx — scrolling center column: instrument header
// (label + active-chord chip + highlight mode) + instrument + circle section.
// highlightMode is the only prop — it comes from the tweaks state in App.

import Instrument from '../features/instrument/Instrument.jsx';
import { useStore, useTuning, useHighlightedNotes } from '../store/index.js';
import CircleSection from './CircleSection.jsx';

function instrumentLabel(i) {
  return i === 'guitar' ? 'Гитара' : i === 'bass' ? 'Бас гитара (5)' : 'Фортепиано';
}

// Active-chord chip is always tinted --deg-1 regardless of degree —
// prototype quirk, intentionally NOT fixed.
function ActiveChordChip() {
  const activeChord = useStore(s => s.activeChord);
  const clearActiveChord = useStore(s => s.clearActiveChord);
  if (!activeChord) return null;
  return (
    <div className="row" style={{gap: 6, padding: '3px 8px', background: 'var(--deg-1-bg)', borderRadius: 999, fontSize: 11.5, color: 'var(--deg-1)', border: '1px solid var(--deg-1)'}}>
      <span className="mono" style={{fontWeight: 600}}>{activeChord.name}</span>
      <button className="btn-ghost" onClick={clearActiveChord} style={{padding: 0, color: 'inherit'}}>×</button>
    </div>
  );
}

function InstrumentBar({ highlightMode }) {
  const instrument = useStore(s => s.instrument);
  return (
    <div className="inst-bar">
      <div className="row" style={{gap: 8}}>
        <span className="sec-h" style={{margin: 0}}>{instrumentLabel(instrument)}</span>
        <ActiveChordChip />
      </div>
      <div className="inst-meta">
        <span>Подсветка: <strong>{highlightMode === 'degree' ? 'ступени' : 'ноты'}</strong></span>
      </div>
    </div>
  );
}

function InstrumentBlock({ highlightMode }) {
  const instrument = useStore(s => s.instrument);
  const tuning = useTuning();
  const highlightedNotes = useHighlightedNotes();
  const capoFret = useStore(s => s.capoFret);
  const audioMuted = useStore(s => s.audioMuted);
  return (
    <div>
      <InstrumentBar highlightMode={highlightMode} />
      <Instrument
        instrument={instrument}
        tuning={tuning}
        highlightedNotes={highlightedNotes}
        capoFret={capoFret}
        frets={instrument === 'bass' ? 18 : 16}
        selectedPositions={[]}
        onPositionClick={() => {}}
        audioMuted={audioMuted}
      />
    </div>
  );
}

export default function CenterColumn({ highlightMode }) {
  return (
    <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto'}}>
      <InstrumentBlock highlightMode={highlightMode} />
      <CircleSection />
    </div>
  );
}
