// src/app/KeyPicker.jsx — key dropdown in the top bar: 11 modes (2 columns)
// + 12 chromatic roots (sharps). Quirks preserved from the prototype:
// Escape does not close; picking a mode keeps the dropdown open.

import { useState, useEffect, useRef } from 'react';
import { MODES, NOTES_SHARP, keyLabel } from '../theory/index.js';
import { useStore } from '../store/index.js';
import Icon from './Icon.jsx';

function ModeChip({ label, isOn, onPick }) {
  return (
    <button className={`filter-chip ${isOn ? 'is-on' : ''}`}
            onClick={onPick}
            style={{justifyContent: 'flex-start'}}>{label}</button>
  );
}

function RootChip({ note, isOn, onPick }) {
  return (
    <button className={`filter-chip ${isOn ? 'is-on' : ''}`}
            onClick={onPick}
            style={{fontFamily: 'var(--font-mono)'}}>{note}</button>
  );
}

function KeyDropdown({ rootNote, mode, onChange, onPickRoot }) {
  return (
    <div style={{position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', padding: 10, zIndex: 70, minWidth: 260}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginBottom: 8}}>
        {Object.entries(MODES).map(([key, mi]) => <ModeChip key={key} label={mi.label} isOn={mode === key} onPick={() => onChange(rootNote, key)} />)}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4}}>
        {NOTES_SHARP.map(n => <RootChip key={n} note={n} isOn={rootNote === n} onPick={() => onPickRoot(n)} />)}
      </div>
    </div>
  );
}

export default function KeyPicker() {
  const rootNote = useStore(s => s.rootNote);
  const mode = useStore(s => s.mode);
  const onChange = useStore(s => s.selectKey);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const info = MODES[mode];
  return (
    <div ref={ref} style={{position: 'relative'}}>
      <button className="key-pill" onClick={() => setOpen(o => !o)}>
        <span className="dot" />
        <span>{keyLabel(rootNote, mode)}</span>
        <span style={{fontSize: 10, color: 'var(--text-dim)', marginLeft: 4}}>{info.label}</span>
        <Icon name="chevron-down" size={12}/>
      </button>
      {open && <KeyDropdown rootNote={rootNote} mode={mode} onChange={onChange} onPickRoot={(n) => { onChange(n, mode); setOpen(false); }} />}
    </div>
  );
}
