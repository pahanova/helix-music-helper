// app.jsx — Main app composition

const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "highlightMode": "degree",
  "circleVariant": "wheel",
  "density": "regular",
  "showRomanInWheel": true
}/*EDITMODE-END*/;

function useNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = uS(window.innerWidth < breakpoint);
  uE(() => {
    const onR = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, [breakpoint]);
  return narrow;
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const narrow = useNarrow(1024);
  const [leftOpen, setLeftOpen] = uS(false);
  const [rightOpen, setRightOpen] = uS(false);
  const [leftCollapsed, setLeftCollapsed] = uS(false);
  const [rightCollapsed, setRightCollapsed] = uS(false);

  // Music state
  const [rootNote, setRootNote] = uS('C');
  const [mode, setMode] = uS('major'); // 'major' | 'minor'
  const [instrument, setInstrument] = uS('guitar');
  const [tuningName, setTuningName] = uS('Standard');
  const [capoFret, setCapoFret] = uS(0);

  const [activeChord, setActiveChord] = uS(null); // { root, type, name } currently displayed on instrument
  const [pinned, setPinned] = uS([
    { name: 'C', root: 'C', type: 'maj' },
    { name: 'G', root: 'G', type: 'maj' },
    { name: 'Am', root: 'A', type: 'min' },
    { name: 'F', root: 'F', type: 'maj' },
  ]);
  const [circleCollapsed, setCircleCollapsed] = uS(false);
  const [searchCollapsed, setSearchCollapsed] = uS(false);

  // Theme
  uE(() => {
    document.documentElement.setAttribute('data-theme', tweaks.dark ? 'dark' : 'light');
  }, [tweaks.dark]);

  // Tuning resolution
  const tuning = uM(() => {
    if (instrument === 'guitar') return window.MT.TUNINGS.guitar6[tuningName] || window.MT.TUNINGS.guitar6['Standard'];
    if (instrument === 'bass') return window.MT.TUNINGS.bass5[tuningName] || window.MT.TUNINGS.bass5['Standard'];
    return [];
  }, [instrument, tuningName]);

  const tuningOptions = uM(() => {
    if (instrument === 'guitar') return Object.keys(window.MT.TUNINGS.guitar6);
    if (instrument === 'bass') return Object.keys(window.MT.TUNINGS.bass5);
    return [];
  }, [instrument]);

  uE(() => {
    if (!tuningOptions.includes(tuningName)) setTuningName(tuningOptions[0] || 'Standard');
  }, [instrument]);

  // Diatonic / chord notes for highlighting
  const scaleNotes = uM(() => window.MT.scaleNotes(rootNote, mode), [rootNote, mode]);
  const diatonicChords = uM(() => window.MT.diatonicChords(rootNote, mode), [rootNote, mode]);
  const secondaryDoms = uM(() => window.MT.secondaryDominants(rootNote, mode), [rootNote, mode]);

  const highlightedNotes = uM(() => {
    const hl = {};
    if (activeChord) {
      const cNotes = window.MT.chordNotes(activeChord.root, activeChord.type);
      cNotes.forEach((n, i) => {
        // role: root vs other
        const degInScale = scaleNotes.indexOf(n) + 1;
        hl[n] = {
          degree: degInScale > 0 ? degInScale : 'x',
          label: i === 0 ? 'R' : (degInScale > 0 ? String(degInScale) : n),
          role: i === 0 ? 'is-root' : '',
        };
      });
    } else {
      // Highlight whole scale
      scaleNotes.forEach((n, i) => {
        hl[n] = { degree: i + 1, label: String(i + 1) };
      });
    }
    return hl;
  }, [scaleNotes, activeChord]);

  function handleSelectKey(note, m) {
    setRootNote(note);
    setMode(m);
    setActiveChord(null);
  }

  function handleChordClick(chord) {
    setActiveChord(chord);
  }

  function handlePin(c) {
    setPinned(prev => {
      const exists = prev.some(p => p.name === c.name);
      if (exists) return prev.filter(p => p.name !== c.name);
      return [...prev, c];
    });
  }

  const pinnedNames = pinned.map(p => p.name);

  const appCls = `app ${narrow ? 'app-narrow' : ''} ${!narrow && leftCollapsed ? 'left-collapsed' : ''} ${!narrow && rightCollapsed ? 'right-collapsed' : ''} density-${tweaks.density}`;

  return (
    <div className={appCls}>
      {/* Topbar */}
      <header className="topbar">
        <button
          className={`btn-ghost ${!narrow && !leftCollapsed ? 'is-active' : ''}`}
          onClick={() => narrow ? setLeftOpen(o => !o) : setLeftCollapsed(c => !c)}
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
          <KeyPicker rootNote={rootNote} mode={mode} onChange={(r, m) => { setRootNote(r); setMode(m); setActiveChord(null); }} />
          <span className="dim" style={{fontSize: 11.5}}>·</span>
          <span className="muted" style={{fontSize: 11.5, fontFamily: 'var(--font-mono)'}}>
            {scaleNotes.join(' ')}
          </span>
        </div>

        <div className="topbar-spacer" />

        <button className="btn-ghost" onClick={() => setTweak('dark', !tweaks.dark)} title={tweaks.dark ? 'Светлая' : 'Тёмная'}>
          <Icon name={tweaks.dark ? 'sun' : 'moon'} />
        </button>
        <button
          className={`btn-ghost ${!narrow && !rightCollapsed ? 'is-active' : ''}`}
          onClick={() => narrow ? setRightOpen(o => !o) : setRightCollapsed(c => !c)}
          aria-label={narrow ? 'Поиск' : rightCollapsed ? 'Показать панель' : 'Скрыть панель'}
          title={narrow ? 'Поиск' : rightCollapsed ? 'Показать панель' : 'Скрыть панель'}>
          <Icon name={narrow ? 'search' : 'sidebar-right'} />
        </button>
      </header>

      {/* Left pane: instrument + tuning + scale info */}
      <aside className={`pane-left ${leftOpen ? 'is-open' : ''}`}>
        <Section title="Инструмент">
          <div className="inst-tabs" style={{width: '100%', justifyContent: 'space-between', display: 'flex'}}>
            {['guitar', 'bass', 'piano'].map(i => (
              <button key={i} className={instrument === i ? 'is-active' : ''}
                      onClick={() => setInstrument(i)} style={{flex: 1}}>
                {i === 'guitar' ? 'Гитара' : i === 'bass' ? 'Бас 5' : 'Фортепиано'}
              </button>
            ))}
          </div>
        </Section>

        {instrument !== 'piano' && (
          <Section title="Строй">
            <select value={tuningName} onChange={e => setTuningName(e.target.value)} style={{width: '100%'}}>
              {tuningOptions.map(t => <option key={t}>{t}</option>)}
            </select>
            <div className="tuning-pills" style={{marginTop: 8}}>
              {[...tuning].reverse().map((n, i) => <span key={i} className="tp">{n}</span>)}
            </div>
            {instrument === 'guitar' && (
              <div style={{marginTop: 12}}>
                <div className="row" style={{justifyContent: 'space-between'}}>
                  <span className="muted" style={{fontSize: 11}}>Каподастр</span>
                  <span className="mono tnum" style={{fontSize: 11}}>{capoFret > 0 ? `${capoFret}fr` : 'нет'}</span>
                </div>
                <div className="row" style={{gap: 4, marginTop: 6, flexWrap: 'wrap'}}>
                  {[0,1,2,3,4,5,7].map(f => (
                    <button key={f} className={`filter-chip ${capoFret === f ? 'is-on' : ''}`}
                            onClick={() => setCapoFret(f)}>{f === 0 ? '×' : f}</button>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        <Section title="Тональность">
          <div className="col" style={{gap: 6}}>
            <div className="row" style={{gap: 4}}>
              <button className={`filter-chip ${mode === 'major' ? 'is-on' : ''}`} onClick={() => setMode('major')}>major</button>
              <button className={`filter-chip ${mode === 'minor' ? 'is-on' : ''}`} onClick={() => setMode('minor')}>minor</button>
            </div>
            <div className="row-wrap" style={{marginTop: 4}}>
              {['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F'].map(n => (
                <button key={n} className={`filter-chip ${rootNote === n ? 'is-on' : ''}`}
                        onClick={() => { setRootNote(n); setActiveChord(null); }}
                        style={{minWidth: 28, fontFamily: 'var(--font-mono)'}}>{n}</button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Диатоника">
          <div className="col" style={{gap: 4}}>
            {diatonicChords.map((c, i) => (
              <button key={c.name + i}
                      className={`row ${activeChord && activeChord.root === c.root && activeChord.quality === c.quality ? 'is-active' : ''}`}
                      onClick={() => handleChordClick({ root: c.root, type: c.quality, name: c.name })}
                      style={{justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6}}>
                <span className="row" style={{gap: 8}}>
                  <span className="deg-chip" style={{background: `var(--deg-${i+1})`}}>{i+1}</span>
                  <span className="mono" style={{fontWeight: 600}}>{c.name}</span>
                </span>
                <span className="dim mono" style={{fontSize: 10.5}}>{c.roman}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Втор. доминанты" subtle>
          <div className="col" style={{gap: 4}}>
            {secondaryDoms.map((d, i) => (
              <button key={d.name + i}
                      className="row"
                      onClick={() => handleChordClick({ root: d.root, type: '7', name: d.name })}
                      style={{justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6}}>
                <span className="mono" style={{fontWeight: 600}}>{d.name}</span>
                <span className="dim mono" style={{fontSize: 10.5}}>{d.label}</span>
              </button>
            ))}
          </div>
        </Section>
      </aside>

      {/* Main pane */}
      <main className="pane-main">
        <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0}}>
          {/* Instrument */}
          <div>
            <div className="inst-bar">
              <div className="row" style={{gap: 8}}>
                <span className="sec-h" style={{margin: 0}}>{instrumentLabel(instrument)}</span>
                {activeChord && (
                  <div className="row" style={{gap: 6, padding: '3px 8px', background: 'var(--deg-1-bg)', borderRadius: 999, fontSize: 11.5, color: 'var(--deg-1)', border: '1px solid var(--deg-1)'}}>
                    <span className="mono" style={{fontWeight: 600}}>{activeChord.name}</span>
                    <button className="btn-ghost" onClick={() => setActiveChord(null)} style={{padding: 0, color: 'inherit'}}>×</button>
                  </div>
                )}
              </div>
              <div className="inst-meta">
                <span>Подсветка: <strong>{tweaks.highlightMode === 'degree' ? 'ступени' : 'ноты'}</strong></span>
              </div>
            </div>
            <window.Instrument
              instrument={instrument}
              tuning={tuning}
              highlightedNotes={highlightedNotes}
              capoFret={capoFret}
              frets={instrument === 'bass' ? 18 : 16}
              selectedPositions={[]}
              onPositionClick={() => {}}
            />
          </div>

          {/* Circle of fifths */}
          <div className="card">
            <button className="collapse-btn" onClick={() => setCircleCollapsed(c => !c)}>
              <Icon name={circleCollapsed ? 'chevron-right' : 'chevron-down'} />
              <span>Квинтово-квартовый круг</span>
              <span className="dim" style={{marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 400}}>
                {rootNote}{mode === 'minor' ? 'm' : ''} · {mode}
              </span>
            </button>
            {!circleCollapsed && (
              <div style={{display: 'grid', gridTemplateColumns: narrow ? '1fr' : '320px 1fr', gap: 20, paddingTop: 12, alignItems: 'start'}}>
                <window.CircleOfFifths
                  rootNote={rootNote}
                  mode={mode}
                  onSelectKey={handleSelectKey}
                  showSecondaryDominants={true}
                  size={300}
                />
                <div className="col" style={{gap: 12}}>
                  <div>
                    <div className="sec-h" style={{margin: '0 0 8px 0'}}>Аккорды тональности</div>
                    <div className="row-wrap">
                      {diatonicChords.map((c, i) => {
                        const shape = window.CHORD_SHAPES[c.name];
                        return (
                          <div key={i} className="chord-card" style={{width: 92}} onClick={() => handleChordClick({root: c.root, type: c.quality, name: c.name})}>
                            <div className="chord-name" style={{fontSize: 13}}>
                              <span>{c.name}</span>
                            </div>
                            {shape ? <window.ChordDiagram shape={shape} name="" width={92} height={88}/> : (
                              <div style={{height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)'}}>
                                {window.MT.chordNotes(c.root, c.quality).join(' ')}
                              </div>
                            )}
                            <div className="chord-roman row" style={{justifyContent: 'space-between'}}>
                              <span className="deg-chip" style={{background: `var(--deg-${i+1})`}}>{i+1}</span>
                              <span>{c.roman}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pinned strip */}
        <div className="pinned-strip">
          {pinned.length === 0 && <div className="pinned-strip-empty">Закрепи аккорды из поиска или из диатоники — появятся здесь</div>}
          {pinned.map((c, i) => {
            const shape = window.CHORD_SHAPES[c.name];
            return (
              <div key={i} className="chord-card is-pinned" onClick={() => handleChordClick(c)}>
                <div className="chord-name">
                  <span>{c.name}</span>
                  <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); handlePin(c); }} style={{padding: 2, color: 'var(--text-dim)'}} title="Открепить">×</button>
                </div>
                {shape ? <window.ChordDiagram shape={shape} name="" width={104} height={100}/> : (
                  <div style={{height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)'}}>
                    {window.MT.chordNotes(c.root, c.type).join(' ')}
                  </div>
                )}
                <div className="chord-roman">{window.MT.chordNotes(c.root, c.type).join(' · ')}</div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Right pane: search */}
      <aside className={`pane-right ${rightOpen ? 'is-open' : ''}`}>
        <button className="collapse-btn" onClick={() => setSearchCollapsed(c => !c)} style={{marginBottom: 10}}>
          <Icon name={searchCollapsed ? 'chevron-right' : 'chevron-down'} />
          <span>Поисковик аккордов</span>
        </button>
        {!searchCollapsed && (
          <window.ChordSearch onPin={handlePin} pinnedNames={pinnedNames} />
        )}
      </aside>

      {/* Narrow scrim */}
      {narrow && (leftOpen || rightOpen) && (
        <div onClick={() => { setLeftOpen(false); setRightOpen(false); }}
             style={{position: 'fixed', inset: '44px 0 0 0', background: 'rgba(0,0,0,0.3)', zIndex: 40}} />
      )}

      {/* Tweaks */}
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
    </div>
  );
}

function instrumentLabel(i) {
  return i === 'guitar' ? 'Гитара' : i === 'bass' ? 'Бас гитара (5)' : 'Фортепиано';
}

function Section({ title, subtle, children }) {
  return (
    <div className="sec">
      <div className="sec-h" style={subtle ? {color: 'var(--text-dim)'} : {}}>{title}</div>
      {children}
    </div>
  );
}

function KeyPicker({ rootNote, mode, onChange }) {
  const [open, setOpen] = uS(false);
  const ref = uR(null);
  uE(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{position: 'relative'}}>
      <button className="key-pill" onClick={() => setOpen(o => !o)}>
        <span className="dot" />
        <span>{rootNote}{mode === 'minor' ? 'm' : ''}</span>
        <span style={{fontSize: 10, color: 'var(--text-dim)', marginLeft: 4}}>{mode}</span>
        <Icon name="chevron-down" size={12}/>
      </button>
      {open && (
        <div style={{position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', padding: 10, zIndex: 70, minWidth: 240}}>
          <div className="row" style={{gap: 4, marginBottom: 8}}>
            <button className={`filter-chip ${mode === 'major' ? 'is-on' : ''}`} onClick={() => onChange(rootNote, 'major')}>major</button>
            <button className={`filter-chip ${mode === 'minor' ? 'is-on' : ''}`} onClick={() => onChange(rootNote, 'minor')}>minor</button>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4}}>
            {window.MT.NOTES_SHARP.map(n => (
              <button key={n} className={`filter-chip ${rootNote === n ? 'is-on' : ''}`}
                      onClick={() => { onChange(n, mode); setOpen(false); }}
                      style={{fontFamily: 'var(--font-mono)'}}>{n}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Icon({ name, size = 14 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'menu': return <svg {...props}><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'sun': return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
    case 'moon': return <svg {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-right': return <svg {...props}><path d="m9 18 6-6-6-6"/></svg>;
    case 'sidebar-left': return <svg {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>;
    case 'sidebar-right': return <svg {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>;
    default: return null;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
