// src/app/RightPanel.jsx — right panel: collapsible «Поисковик аккордов».

import ChordSearch from '../features/search/ChordSearch.jsx';
import Icon from './Icon.jsx';

export default function RightPanel({
  open, collapsed, onToggleCollapsed,
  instrument, tuning, scaleNotes, keyName, onPin, pinnedNames, onChordClick,
}) {
  return (
    <aside className={`pane-right ${open ? 'is-open' : ''}`}>
      <button className="collapse-btn" onClick={onToggleCollapsed} style={{marginBottom: 10}}>
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} />
        <span>Поисковик аккордов</span>
      </button>
      {!collapsed && (
        <ChordSearch
          instrument={instrument}
          tuning={tuning}
          scaleNotes={scaleNotes}
          keyName={keyName}
          onPin={onPin}
          pinnedNames={pinnedNames}
          onChordClick={onChordClick} />
      )}
    </aside>
  );
}
