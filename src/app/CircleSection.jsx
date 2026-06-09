// src/app/CircleSection.jsx — collapsible card with the circle of fifths and the
// «Аккорды тональности» mini-cards. Lives in app/ (not features/circle): it
// composes the circle feature with the diagrams feature and store state
// (collapse, current instrument/tuning, chord clicks → audio). Collapsing the
// card hides the key chords too — prototype behavior, keep as is.

import { MODES, chordNotes, voicingsForChord } from '../theory/index.js';
import { flashPulse } from '../ui/pulse.js';
import { useStore, useTuning, useDiatonicChords, useKeyName } from '../store/index.js';
import CircleOfFifths from '../features/circle/CircleOfFifths.jsx';
import ChordDiagram from '../features/diagrams/ChordDiagram.jsx';
import PianoChordDiagram from '../features/diagrams/PianoChordDiagram.jsx';
import Icon from './Icon.jsx';

function MiniDiagram({ inv }) {
  if (inv.voicing.kind === 'piano') return <PianoChordDiagram voicing={inv.voicing} name="" width={92} height={62}/>;
  return <ChordDiagram shape={inv.voicing} name="" source={inv.source} width={92} height={88}/>;
}

function MiniNotesFallback({ c }) {
  return (
    <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)'}}>
      {chordNotes(c.root, c.quality).join(' ')}
    </div>
  );
}

function DiatonicMiniCard({ c, i }) {
  const instrument = useStore(s => s.instrument);
  const tuning = useTuning();
  const playChord = useStore(s => s.playChord);
  const inversions = voicingsForChord({ root: c.root, type: c.quality }, instrument, tuning);
  const root = inversions[0];
  return (
    <div className="chord-card" style={{width: 92}}
         onClick={(e) => { flashPulse(e.currentTarget); playChord({root: c.root, type: c.quality, name: c.name}, root && root.voicing); }}>
      <div className="chord-name" style={{fontSize: 13}}>
        <span>{c.name}</span>
      </div>
      {root ? <MiniDiagram inv={root} /> : <MiniNotesFallback c={c} />}
      <div className="chord-roman row" style={{justifyContent: 'space-between'}}>
        <span className="deg-chip" style={{background: `var(--deg-${i+1})`}}>{i+1}</span>
        <span>{c.roman}</span>
      </div>
    </div>
  );
}

function PentatonicNote() {
  return (
    <div className="muted" style={{
      fontSize: 11.5, padding: '14px 8px', border: '1px dashed var(--border)',
      borderRadius: 8, textAlign: 'center',
    }}>
      В пентатонике нет полного набора триад на каждой ступени.
    </div>
  );
}

function KeyChords() {
  const diatonicChords = useDiatonicChords();
  return (
    <div>
      <div className="sec-h" style={{margin: '0 0 8px 0'}}>Аккорды тональности</div>
      {diatonicChords.length === 0 && <PentatonicNote />}
      <div className="row-wrap">
        {diatonicChords.map((c, i) => <DiatonicMiniCard key={i} c={c} i={i} />)}
      </div>
    </div>
  );
}

function CircleBody() {
  const narrow = useStore(s => s.narrow);
  const rootNote = useStore(s => s.rootNote);
  const mode = useStore(s => s.mode);
  const selectKey = useStore(s => s.selectKey);
  return (
    <div style={{display: 'grid', gridTemplateColumns: narrow ? '1fr' : '320px 1fr', gap: 20, paddingTop: 12, alignItems: 'start'}}>
      <CircleOfFifths
        rootNote={rootNote}
        mode={mode}
        onSelectKey={selectKey}
        showSecondaryDominants={true}
        size={300}
      />
      <div className="col" style={{gap: 12}}>
        <KeyChords />
      </div>
    </div>
  );
}

export default function CircleSection() {
  const collapsed = useStore(s => s.circleCollapsed);
  const toggle = useStore(s => s.toggleCircleCollapsed);
  const mode = useStore(s => s.mode);
  const keyName = useKeyName();
  return (
    <div className="card">
      <button className="collapse-btn" onClick={toggle}>
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} />
        <span>Квинтово-квартовый круг</span>
        <span className="dim" style={{marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 400}}>{keyName} · {MODES[mode].label}</span>
      </button>
      {!collapsed && <CircleBody />}
    </div>
  );
}
