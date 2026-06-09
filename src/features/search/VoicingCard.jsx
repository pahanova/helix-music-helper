// src/features/search/VoicingCard.jsx — voicing card, used everywhere a
// chord+inversion shows up: grid card in the name search, row in the
// constructor result. Picks the right diagram for the current instrument.

import ChordDiagram from '../diagrams/ChordDiagram.jsx';
import PianoChordDiagram from '../diagrams/PianoChordDiagram.jsx';
import { isChordInScale } from '../../theory/index.js';
import { flashPulse } from '../../ui/pulse.js';

export default function VoicingCard({ chord, inversion, instrument, tuning, scaleNotes, keyName, pinnedNames, onPin, onChordClick, layout = 'card' }) {
  const { fullName, voicing, source, label, bassNote } = inversion;
  const pinned = pinnedNames && pinnedNames.includes(fullName);
  const chordObj = { ...chord, name: fullName, bassNote, notes: chord.notes };
  const inScale = isChordInScale(chord.notes, scaleNotes);

  const diag = voicing.kind === 'piano'
    ? <PianoChordDiagram voicing={voicing} name="" width={layout === 'row' ? 180 : 124} height={layout === 'row' ? 80 : 70} />
    : <ChordDiagram shape={voicing} name="" source={source}
                    width={layout === 'row' ? 132 : 104} height={layout === 'row' ? 116 : 100} />;

  const handleClick = (e) => { flashPulse(e.currentTarget); onChordClick && onChordClick(chordObj, voicing); };
  const handlePin = (e) => { e.stopPropagation(); onPin && onPin(chordObj); };

  if (layout === 'row') {
    return <VoicingRow fullName={fullName} label={label} source={source} bassNote={bassNote}
                       pinned={pinned} diag={diag} onClick={handleClick} onPin={handlePin} />;
  }
  return <VoicingCardBox fullName={fullName} label={label} source={source} pinned={pinned}
                         inScale={inScale} keyName={keyName} diag={diag} onClick={handleClick} onPin={handlePin} />;
}

/* ─── Row layout (Constructor result list) ──────────────────── */

function VoicingRow({ fullName, label, source, bassNote, pinned, diag, onClick, onPin }) {
  return (
    <div className="voicing-row" onClick={onClick}>
      <VoicingRowInfo fullName={fullName} label={label} source={source} bassNote={bassNote} />
      <div onClick={e => e.stopPropagation()} style={{flexShrink: 0}}>{diag}</div>
      <PinButton pinned={pinned} onClick={onPin}
                 style={{padding: 3, color: pinned ? 'var(--text)' : 'var(--text-dim)', alignSelf: 'flex-start'}} />
    </div>
  );
}

function VoicingRowInfo({ fullName, label, source, bassNote }) {
  return (
    <div style={{flex: 1, minWidth: 0}}>
      <div className="row" style={{gap: 8, alignItems: 'baseline'}}>
        <span className="mono" style={{fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em'}}>{fullName}</span>
        <span className="dim" style={{fontSize: 10.5, fontFamily: 'var(--font-mono)'}}>{label}{source === 'auto' ? ' · auto' : ''}</span>
      </div>
      <div className="dim" style={{fontSize: 10.5, marginTop: 2, fontFamily: 'var(--font-mono)'}}>
        бас: {bassNote}
      </div>
    </div>
  );
}

/* ─── Card layout (NameSearch grid) ─────────────────────────── */

function VoicingCardBox({ fullName, label, source, pinned, inScale, keyName, diag, onClick, onPin }) {
  return (
    <div className={`chord-card ${pinned ? 'is-pinned' : ''} ${inScale ? 'is-in-key' : ''}`}
         onClick={onClick}>
      <div className="chord-name">
        <CardName fullName={fullName} inScale={inScale} keyName={keyName} />
        <PinButton pinned={pinned} onClick={onPin}
                   style={{padding: 2, color: pinned ? 'var(--text)' : 'var(--text-dim)'}} />
      </div>
      {diag}
      <div className="chord-roman">
        {label}{source === 'auto' ? ' · auto' : ''}
      </div>
    </div>
  );
}

function CardName({ fullName, inScale, keyName }) {
  return (
    <span className="row" style={{gap: 6, alignItems: 'center'}}>
      <span>{fullName}</span>
      {inScale && <InKeyDot keyName={keyName} />}
    </span>
  );
}

/* ─── Shared bits ───────────────────────────────────────────── */

function PinButton({ pinned, onClick, style }) {
  return (
    <button className="btn-ghost" onClick={onClick} style={style}
            title={pinned ? 'Открепить' : 'Закрепить'}>
      <PinIcon filled={pinned}/>
    </button>
  );
}

function InKeyDot({ keyName }) {
  return (
    <span className="in-key-dot" title={keyName ? `Все ноты в тональности ${keyName}` : 'Все ноты в текущей тональности'} />
  );
}

function PinIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5"/>
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
    </svg>
  );
}
