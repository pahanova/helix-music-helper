// src/app/TopBar.jsx — top bar: panel togglers, brand, key picker + scale notes,
// chord/arpeggio chip, mute, theme, search toggler.

import { MODES } from '../theory/index.js';
import Icon from './Icon.jsx';
import KeyPicker from './KeyPicker.jsx';

export default function TopBar({
  narrow, leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight,
  rootNote, mode, onKeyChange, scaleNotes,
  chordPlayMode, onTogglePlayMode, audioMuted, onToggleMute, dark, onToggleDark,
}) {
  return (
    <header className="topbar">
      <button
        className={`btn-ghost ${!narrow && !leftCollapsed ? 'is-active' : ''}`}
        onClick={onToggleLeft}
        aria-label={narrow ? 'Меню' : leftCollapsed ? 'Показать панель' : 'Скрыть панель'}
        title={narrow ? 'Меню' : leftCollapsed ? 'Показать панель' : 'Скрыть панель'}>
        <Icon name={narrow ? 'menu' : 'sidebar-left'} />
      </button>
      <div className="brand">
        <div className="brand-mark" />
        <span>Helix</span>
        <span className="dim" style={{fontWeight: 400, fontSize: 11.5, marginLeft: 4}}>music helper</span>
      </div>

      <div className="row" style={{marginLeft: 14}}>
        <KeyPicker rootNote={rootNote} mode={mode} onChange={onKeyChange} />
        <span className="dim" style={{fontSize: 11.5}}>·</span>
        <span className="muted" style={{fontSize: 11.5, fontFamily: 'var(--font-mono)'}}>{scaleNotes.join(' ')}</span>
        <span className="dim" style={{fontSize: 11.5, marginLeft: 4}}>{MODES[mode].label}</span>
      </div>

      <div className="topbar-spacer" />

      <button
        className={`audio-chip ${chordPlayMode === 'arpeggio' ? 'is-on' : ''}`}
        onClick={onTogglePlayMode}
        title={chordPlayMode === 'block' ? 'Сейчас: аккорд целиком. Нажми, чтобы играть по очереди' : 'Сейчас: ноты по очереди. Нажми, чтобы играть аккордом'}
        disabled={audioMuted}>
        {chordPlayMode === 'block' ? 'аккорд' : 'арпеджио'}
      </button>
      <button
        className="btn-ghost"
        onClick={onToggleMute}
        title={audioMuted ? 'Включить звук' : 'Выключить звук'}>
        <Icon name={audioMuted ? 'volume-x' : 'volume'} />
      </button>
      <button className="btn-ghost" onClick={onToggleDark} title={dark ? 'Светлая' : 'Тёмная'}>
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
      <button
        className={`btn-ghost ${!narrow && !rightCollapsed ? 'is-active' : ''}`}
        onClick={onToggleRight}
        aria-label={narrow ? 'Поиск' : rightCollapsed ? 'Показать панель' : 'Скрыть панель'}
        title={narrow ? 'Поиск' : rightCollapsed ? 'Показать панель' : 'Скрыть панель'}>
        <Icon name={narrow ? 'search' : 'sidebar-right'} />
      </button>
    </header>
  );
}
