// src/app/LeftPanel.jsx — left panel: instrument picker / tuning + capo /
// key (mode + circle-of-fifths roots) / diatonic rows / secondary dominants.

import { MODES } from '../theory/index.js';
import { flashPulse } from '../ui/pulse.js';
import Section from './Section.jsx';

// Left-panel roots follow the circle of fifths WITH flats —
// intentionally different from the top-bar picker (sharps). Do not unify.
const CIRCLE_ROOTS = ['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'];

function InstrumentTab({ id, instrument, onSelect }) {
  return (
    <button className={instrument === id ? 'is-active' : ''}
            onClick={() => onSelect(id)} style={{flex: 1}}>
      {id === 'guitar' ? 'Гитара' : id === 'bass' ? 'Бас 5' : 'Фортепиано'}
    </button>
  );
}

function InstrumentPicker({ instrument, onSelect }) {
  return (
    <Section title="Инструмент">
      <div className="inst-tabs" style={{width: '100%', justifyContent: 'space-between', display: 'flex'}}>
        {['guitar', 'bass', 'piano'].map(i => <InstrumentTab key={i} id={i} instrument={instrument} onSelect={onSelect} />)}
      </div>
    </Section>
  );
}

function CapoChip({ fret, capoFret, onSetCapo }) {
  return (
    <button className={`filter-chip ${capoFret === fret ? 'is-on' : ''}`}
            onClick={() => onSetCapo(fret)}>{fret === 0 ? '×' : fret}</button>
  );
}

function CapoControl({ capoFret, onSetCapo }) {
  return (
    <div style={{marginTop: 12}}>
      <div className="row" style={{justifyContent: 'space-between'}}>
        <span className="muted" style={{fontSize: 11}}>Каподастр</span>
        <span className="mono tnum" style={{fontSize: 11}}>{capoFret > 0 ? `${capoFret}fr` : 'нет'}</span>
      </div>
      <div className="row" style={{gap: 4, marginTop: 6, flexWrap: 'wrap'}}>
        {[0,1,2,3,4,5,7].map(f => <CapoChip key={f} fret={f} capoFret={capoFret} onSetCapo={onSetCapo} />)}
      </div>
    </div>
  );
}

function TuningSection({ instrument, tuningName, onSelectTuning, tuningOptions, tuning, capoFret, onSetCapo }) {
  return (
    <Section title="Строй">
      <select value={tuningName} onChange={e => onSelectTuning(e.target.value)} style={{width: '100%'}}>
        {tuningOptions.map(t => <option key={t}>{t}</option>)}
      </select>
      <div className="tuning-pills" style={{marginTop: 8}}>
        {[...tuning].reverse().map((n, i) => <span key={i} className="tp">{n}</span>)}
      </div>
      {instrument === 'guitar' && <CapoControl capoFret={capoFret} onSetCapo={onSetCapo} />}
    </Section>
  );
}

function ModeSelect({ mode, onSelectMode }) {
  return (
    <select value={mode} onChange={e => onSelectMode(e.target.value)} style={{width: '100%'}}>
      {Object.entries(MODES).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}
    </select>
  );
}

function RootChip({ note, rootNote, onSelectRoot }) {
  return (
    <button className={`filter-chip ${rootNote === note ? 'is-on' : ''}`}
            onClick={() => onSelectRoot(note)}
            style={{minWidth: 28, fontFamily: 'var(--font-mono)'}}>{note}</button>
  );
}

function RootChips({ rootNote, onSelectRoot }) {
  return (
    <div className="row-wrap" style={{marginTop: 4}}>
      {CIRCLE_ROOTS.map(n => <RootChip key={n} note={n} rootNote={rootNote} onSelectRoot={onSelectRoot} />)}
    </div>
  );
}

function KeySection({ mode, rootNote, onSelectMode, onSelectRoot }) {
  return (
    <Section title="Тональность">
      <div className="col" style={{gap: 6}}>
        <ModeSelect mode={mode} onSelectMode={onSelectMode} />
        <RootChips rootNote={rootNote} onSelectRoot={onSelectRoot} />
      </div>
    </Section>
  );
}

function DiatonicRow({ c, i, activeChord, onChordClick }) {
  const isActive = activeChord && activeChord.root === c.root && activeChord.quality === c.quality;
  return (
    <button className={`row ${isActive ? 'is-active' : ''}`}
            onClick={(e) => { flashPulse(e.currentTarget); onChordClick({ root: c.root, type: c.quality, name: c.name }); }}
            style={{justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6}}>
      <span className="row" style={{gap: 8}}>
        <span className="deg-chip" style={{background: `var(--deg-${i+1})`}}>{i+1}</span>
        <span className="mono" style={{fontWeight: 600}}>{c.name}</span>
      </span>
      <span className="dim mono" style={{fontSize: 10.5}}>{c.roman}</span>
    </button>
  );
}

function DiatonicSection({ diatonicChords, activeChord, onChordClick }) {
  return (
    <Section title="Диатоника">
      <div className="col" style={{gap: 4}}>
        {diatonicChords.map((c, i) => <DiatonicRow key={c.name + i} c={c} i={i} activeChord={activeChord} onChordClick={onChordClick} />)}
      </div>
    </Section>
  );
}

function SecondaryDomRow({ d, onChordClick }) {
  return (
    <button className="row"
            onClick={(e) => { flashPulse(e.currentTarget); onChordClick({ root: d.root, type: '7', name: d.name }); }}
            style={{justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6}}>
      <span className="mono" style={{fontWeight: 600}}>{d.name}</span>
      <span className="dim mono" style={{fontSize: 10.5}}>{d.label}</span>
    </button>
  );
}

function SecondaryDomsSection({ secondaryDoms, onChordClick }) {
  return (
    <Section title="Втор. доминанты" subtle>
      <div className="col" style={{gap: 4}}>
        {secondaryDoms.map((d, i) => <SecondaryDomRow key={d.name + i} d={d} onChordClick={onChordClick} />)}
      </div>
    </Section>
  );
}

export default function LeftPanel({
  open, instrument, onSelectInstrument,
  tuningName, onSelectTuning, tuningOptions, tuning, capoFret, onSetCapo,
  mode, rootNote, onSelectMode, onSelectRoot,
  diatonicChords, secondaryDoms, hasDiatonic, activeChord, onChordClick,
}) {
  return (
    <aside className={`pane-left ${open ? 'is-open' : ''}`}>
      <InstrumentPicker instrument={instrument} onSelect={onSelectInstrument} />
      {instrument !== 'piano' && (
        <TuningSection instrument={instrument} tuningName={tuningName} onSelectTuning={onSelectTuning}
                       tuningOptions={tuningOptions} tuning={tuning} capoFret={capoFret} onSetCapo={onSetCapo} />
      )}
      <KeySection mode={mode} rootNote={rootNote} onSelectMode={onSelectMode} onSelectRoot={onSelectRoot} />
      {hasDiatonic && <DiatonicSection diatonicChords={diatonicChords} activeChord={activeChord} onChordClick={onChordClick} />}
      {secondaryDoms.length > 0 && <SecondaryDomsSection secondaryDoms={secondaryDoms} onChordClick={onChordClick} />}
    </aside>
  );
}
