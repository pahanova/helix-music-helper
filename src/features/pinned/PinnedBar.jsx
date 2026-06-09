// src/features/pinned/PinnedBar.jsx — bottom strip with pinned chords:
// collapse toggle + counter + horizontally scrolling cards. Each card renders
// the voicing matching the pinned bassNote (or the root inversion) for the
// CURRENT instrument/tuning; click plays exactly that voicing.

import { chordNotes, voicingsForChord } from '../../theory/index.js';
import { flashPulse } from '../../ui/pulse.js';
import ChordDiagram from '../diagrams/ChordDiagram.jsx';
import PianoChordDiagram from '../diagrams/PianoChordDiagram.jsx';
import Icon from '../../app/Icon.jsx';
import './pinned.css';

function PinnedDiagram({ inv, isPiano }) {
  if (isPiano) return <PianoChordDiagram voicing={inv.voicing} name="" width={104} height={66}/>;
  return <ChordDiagram shape={inv.voicing} name="" source={inv.source} width={104} height={100}/>;
}

function PinnedNotesFallback({ c }) {
  return (
    <div style={{height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)'}}>
      {(c.notes || chordNotes(c.root, c.type)).join(' ')}
    </div>
  );
}

function PinnedCard({ c, instrument, tuning, onChordClick, onUnpin }) {
  const bassNote = c.bassNote || c.root;
  const inversions = voicingsForChord(c, instrument, tuning);
  const inv = inversions.find(v => v.bassNote === bassNote) || inversions[0];
  const isPiano = inv && inv.voicing.kind === 'piano';
  return (
    <div className="chord-card is-pinned"
         onClick={(e) => { flashPulse(e.currentTarget); onChordClick(c, inv && inv.voicing); }}>
      <div className="chord-name">
        <span>{c.name}</span>
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); onUnpin(c); }} style={{padding: 2, color: 'var(--text-dim)'}} title="Открепить">×</button>
      </div>
      {inv ? <PinnedDiagram inv={inv} isPiano={isPiano} /> : <PinnedNotesFallback c={c} />}
      <div className="chord-roman">
        {inv ? `${inv.label}${inv.source === 'auto' ? ' · auto' : ''}` : (c.notes || chordNotes(c.root, c.type)).join(' · ')}
      </div>
    </div>
  );
}

function PinnedStrip({ pinned, instrument, tuning, onChordClick, onUnpin }) {
  return (
    <div className="pinned-strip">
      {pinned.length === 0 && <div className="pinned-strip-empty">Закрепи аккорды из поиска или из диатоники — появятся здесь</div>}
      {pinned.map((c, i) => <PinnedCard key={i} c={c} instrument={instrument} tuning={tuning} onChordClick={onChordClick} onUnpin={onUnpin} />)}
    </div>
  );
}

export default function PinnedBar({ pinned, collapsed, onToggleCollapsed, instrument, tuning, onChordClick, onUnpin }) {
  return (
    <div className="pinned-bar">
      <button
        className="pinned-toggle"
        onClick={onToggleCollapsed}
        title={collapsed ? 'Показать закреплённые' : 'Скрыть закреплённые'}>
        <Icon name={collapsed ? 'chevron-up' : 'chevron-down'} />
        <span>Закреплённые аккорды</span>
        <span className="pinned-count">{pinned.length}</span>
      </button>
      {!collapsed && <PinnedStrip pinned={pinned} instrument={instrument} tuning={tuning} onChordClick={onChordClick} onUnpin={onUnpin} />}
    </div>
  );
}
