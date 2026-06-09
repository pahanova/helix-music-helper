// src/app/App.jsx — composition root: layout panes + theme / soundfont effects.
// App-wide state lives in the zustand store (src/store); only the tweaks state
// stays here — it speaks the Claude Design edit-mode protocol via useTweaks.

import { useEffect } from 'react';
import * as HelixAudio from '../audio/index.js';
import { useTweaks } from '../tweaks/index.js';
import { useStore } from '../store/index.js';
import PinnedBar from '../features/pinned/PinnedBar.jsx';
import TopBar from './TopBar.jsx';
import LeftPanel from './LeftPanel.jsx';
import CenterColumn from './CenterColumn.jsx';
import RightPanel from './RightPanel.jsx';
import AppTweaks from './AppTweaks.jsx';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "highlightMode": "degree",
  "circleVariant": "wheel",
  "density": "regular",
  "showRomanInWheel": true
}/*EDITMODE-END*/;

function Scrim() {
  const narrow = useStore(s => s.narrow);
  const anyOpen = useStore(s => s.leftOpen || s.rightOpen);
  const closeDrawers = useStore(s => s.closeDrawers);
  if (!narrow || !anyOpen) return null;
  return (
    <div onClick={closeDrawers}
         style={{position: 'fixed', inset: '44px 0 0 0', background: 'rgba(0,0,0,0.3)', zIndex: 40}} />
  );
}

export default function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const narrow = useStore(s => s.narrow);
  const leftCollapsed = useStore(s => s.leftCollapsed);
  const rightCollapsed = useStore(s => s.rightCollapsed);
  const instrument = useStore(s => s.instrument);
  const audioMuted = useStore(s => s.audioMuted);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.dark ? 'dark' : 'light');
  }, [tweaks.dark]);

  // Preload current instrument's soundfont (silent on failure; first user click retries).
  useEffect(() => {
    if (audioMuted) return;
    HelixAudio.load(instrument).catch(() => {});
  }, [instrument, audioMuted]);

  const appCls = `app ${narrow ? 'app-narrow' : ''} ${!narrow && leftCollapsed ? 'left-collapsed' : ''} ${!narrow && rightCollapsed ? 'right-collapsed' : ''} density-${tweaks.density}`;

  return (
    <div className={appCls}>
      <TopBar dark={tweaks.dark} onToggleDark={() => setTweak('dark', !tweaks.dark)} />
      <LeftPanel />
      <main className="pane-main">
        <CenterColumn highlightMode={tweaks.highlightMode} />
        <PinnedBar />
      </main>
      <RightPanel />
      <Scrim />
      <AppTweaks tweaks={tweaks} setTweak={setTweak} />
    </div>
  );
}
