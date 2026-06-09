// src/app/AppTweaks.jsx — Tweaks panel markup for this app (dark / highlightMode /
// density / showRomanInWheel). State lives in App via useTweaks — values are
// needed across the whole tree.

import { TweaksPanel, TweakSection, TweakToggle, TweakRadio } from '../tweaks/index.js';

export default function AppTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Тема" />
      <TweakToggle label="Тёмная" value={tweaks.dark} onChange={v => setTweak('dark', v)} />
      <TweakSection label="Поведение" />
      <TweakRadio label="Подсветка" value={tweaks.highlightMode}
                  options={['degree','note']}
                  onChange={v => setTweak('highlightMode', v)} />
      <TweakRadio label="Плотность" value={tweaks.density}
                  options={['compact','regular']}
                  onChange={v => setTweak('density', v)} />
      <TweakToggle label="Римские в круге" value={tweaks.showRomanInWheel}
                   onChange={v => setTweak('showRomanInWheel', v)} />
    </TweaksPanel>
  );
}
