// src/app/RightPanel.jsx — right panel: collapsible «Поисковик аккордов».

import { useStore } from '../store/index.js';
import ChordSearch from '../features/search/ChordSearch.jsx';
import Icon from './Icon.jsx';

export default function RightPanel() {
  const open = useStore(s => s.rightOpen);
  const collapsed = useStore(s => s.searchCollapsed);
  const toggleCollapsed = useStore(s => s.toggleSearchCollapsed);
  return (
    <aside className={`pane-right ${open ? 'is-open' : ''}`}>
      <button className="collapse-btn" onClick={toggleCollapsed} style={{marginBottom: 10}}>
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} />
        <span>Поисковик аккордов</span>
      </button>
      {!collapsed && <ChordSearch />}
    </aside>
  );
}
