// src/app/CenterColumn.jsx — scrolling center column: instrument header
// (label + active-chord chip + highlight mode) + instrument + circle section.

import Instrument from '../features/instrument/Instrument.jsx';
import CircleSection from './CircleSection.jsx';

function instrumentLabel(i) {
  return i === 'guitar' ? 'Гитара' : i === 'bass' ? 'Бас гитара (5)' : 'Фортепиано';
}

// Active-chord chip is always tinted --deg-1 regardless of degree —
// prototype quirk, intentionally NOT fixed.
function ActiveChordChip({ activeChord, onClear }) {
  return (
    <div className="row" style={{gap: 6, padding: '3px 8px', background: 'var(--deg-1-bg)', borderRadius: 999, fontSize: 11.5, color: 'var(--deg-1)', border: '1px solid var(--deg-1)'}}>
      <span className="mono" style={{fontWeight: 600}}>{activeChord.name}</span>
      <button className="btn-ghost" onClick={onClear} style={{padding: 0, color: 'inherit'}}>×</button>
    </div>
  );
}

function InstrumentBar({ instrument, activeChord, onClearActiveChord, highlightMode }) {
  return (
    <div className="inst-bar">
      <div className="row" style={{gap: 8}}>
        <span className="sec-h" style={{margin: 0}}>{instrumentLabel(instrument)}</span>
        {activeChord && <ActiveChordChip activeChord={activeChord} onClear={onClearActiveChord} />}
      </div>
      <div className="inst-meta">
        <span>Подсветка: <strong>{highlightMode === 'degree' ? 'ступени' : 'ноты'}</strong></span>
      </div>
    </div>
  );
}

function InstrumentBlock({ instrument, tuning, highlightedNotes, capoFret, audioMuted, activeChord, onClearActiveChord, highlightMode }) {
  return (
    <div>
      <InstrumentBar instrument={instrument} activeChord={activeChord}
                     onClearActiveChord={onClearActiveChord} highlightMode={highlightMode} />
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

export default function CenterColumn({
  narrow, instrument, tuning, capoFret, highlightedNotes, audioMuted,
  activeChord, onClearActiveChord, highlightMode,
  rootNote, mode, onSelectKey, circleCollapsed, onToggleCircle,
  diatonicChords, hasDiatonic, onChordClick,
}) {
  return (
    <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto'}}>
      <InstrumentBlock instrument={instrument} tuning={tuning} highlightedNotes={highlightedNotes}
                       capoFret={capoFret} audioMuted={audioMuted} activeChord={activeChord}
                       onClearActiveChord={onClearActiveChord} highlightMode={highlightMode} />
      <CircleSection collapsed={circleCollapsed} onToggle={onToggleCircle} narrow={narrow}
                     rootNote={rootNote} mode={mode} onSelectKey={onSelectKey}
                     hasDiatonic={hasDiatonic} diatonicChords={diatonicChords}
                     instrument={instrument} tuning={tuning} onChordClick={onChordClick} />
    </div>
  );
}
