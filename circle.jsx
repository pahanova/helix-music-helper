// circle.jsx — Circle of Fifths with diatonic chords + secondary dominants

const { useState: useStateC, useMemo: useMemoC } = React;

function CircleOfFifths({
  rootNote,
  mode = 'major',         // 'major' | 'minor'
  onSelectKey,            // (note, mode) => void
  showSecondaryDominants = true,
  size = 280,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const midR = outerR * 0.72;
  const innerR = outerR * 0.50;
  const labelR = (outerR + midR) / 2;
  const minorR = (midR + innerR) / 2;

  const majorOrder = window.MT.CIRCLE_MAJOR;     // 12 keys clockwise from C
  const minorOrder = window.MT.CIRCLE_MINOR;
  const segAngle = 360 / 12;

  const modeInfo = window.MT.MODES[mode] || window.MT.MODES.major;
  const family = modeInfo.family;

  // Diatonic chord roots for the current key (set of 7 root notes; empty for pentatonic)
  const diatonicRoots = useMemoC(() => {
    return new Set(window.MT.diatonicChords(rootNote, mode).map(c => c.root));
  }, [rootNote, mode]);
  const diatonicByRoot = useMemoC(() => {
    const map = {};
    window.MT.diatonicChords(rootNote, mode).forEach((c, i) => { map[c.root] = { ...c, index: i + 1 }; });
    return map;
  }, [rootNote, mode]);

  // Secondary dominant roots
  const secondaryDoms = useMemoC(() => {
    if (!showSecondaryDominants) return new Set();
    return new Set(window.MT.secondaryDominants(rootNote, mode).map(d => d.root));
  }, [rootNote, mode, showSecondaryDominants]);

  // Build pie slices
  const slices = [];
  for (let i = 0; i < 12; i++) {
    const startA = -90 + i * segAngle - segAngle / 2;
    const endA = startA + segAngle;
    slices.push({ i, startA, endA });
  }

  function arcPath(r1, r2, startA, endA) {
    const toXY = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
    const [x1, y1] = toXY(r2, startA);
    const [x2, y2] = toXY(r2, endA);
    const [x3, y3] = toXY(r1, endA);
    const [x4, y4] = toXY(r1, startA);
    const large = endA - startA > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r2} ${r2} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  function labelPos(r, idx) {
    const a = -90 + idx * segAngle;
    return [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  }

  return (
    <div className="cof-wrap">
      <svg className="cof" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Outer ring — major keys */}
        {slices.map(({ i, startA, endA }) => {
          const note = majorOrder[i];
          const isCurrent = family === 'major' && note === rootNote;
          const dia = diatonicByRoot[note];
          const isDiatonic = !!dia && dia.quality !== 'min' && dia.quality !== 'dim';
          const isSecondary = secondaryDoms.has(note) && !isDiatonic && !isCurrent;
          let fill = 'var(--bg-muted)';
          if (isCurrent) fill = 'var(--deg-1-bg)';
          else if (isDiatonic) fill = `var(--deg-${dia.index}-bg)`;
          else if (isSecondary) fill = 'var(--secondary-bg)';
          return (
            <g key={`maj-${i}`} className={`cof-seg ${isCurrent ? 'is-current' : ''} ${isDiatonic ? 'is-diatonic' : ''} ${isSecondary ? 'is-secondary' : ''}`}
               onClick={() => onSelectKey && onSelectKey(note, 'major')}>
              <path d={arcPath(midR, outerR, startA, endA)} fill={fill} stroke="var(--border)" strokeWidth="1"/>
              {(isDiatonic || isCurrent) && (
                <path d={arcPath(midR, outerR, startA, endA)}
                      fill="none"
                      stroke={`var(--deg-${dia ? dia.index : 1})`}
                      strokeWidth={isCurrent ? 2 : 0}
                      opacity={isCurrent ? 1 : 0} />
              )}
            </g>
          );
        })}
        {/* Inner ring — relative minors */}
        {slices.map(({ i, startA, endA }) => {
          const note = minorOrder[i].replace('m', '');
          const fullName = minorOrder[i];
          const isCurrent = family === 'minor' && note === rootNote;
          const dia = diatonicByRoot[note];
          const isDiatonic = !!dia && (dia.quality === 'min' || dia.quality === 'dim');
          let fill = 'var(--bg-muted)';
          if (isCurrent) fill = 'var(--deg-1-bg)';
          else if (isDiatonic) fill = `var(--deg-${dia.index}-bg)`;
          return (
            <g key={`min-${i}`} className={`cof-seg cof-min ${isCurrent ? 'is-current' : ''} ${isDiatonic ? 'is-diatonic' : ''}`}
               onClick={() => onSelectKey && onSelectKey(note, 'minor')}>
              <path d={arcPath(innerR, midR, startA, endA)} fill={fill} stroke="var(--border)" strokeWidth="1"/>
            </g>
          );
        })}
        {/* Inner disc */}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="var(--bg)" stroke="var(--border)" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="cof-center-key">{window.MT.keyLabel(rootNote, mode)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="cof-center-mode">{window.MT.MODES[mode] ? window.MT.MODES[mode].label : mode}</text>

        {/* Labels */}
        {slices.map(({ i }) => {
          const [lx, ly] = labelPos(labelR, i);
          const dia = diatonicByRoot[majorOrder[i]];
          return (
            <g key={`lbl-maj-${i}`} pointerEvents="none">
              <text x={lx} y={ly + 4} textAnchor="middle" className={`cof-label ${dia ? 'is-deg' : ''}`}>{majorOrder[i]}</text>
              {dia && dia.quality !== 'min' && dia.quality !== 'dim' && (
                <text x={lx} y={ly + 16} textAnchor="middle" className="cof-roman">{dia.roman}</text>
              )}
            </g>
          );
        })}
        {slices.map(({ i }) => {
          const [lx, ly] = labelPos(minorR, i);
          const note = minorOrder[i].replace('m', '');
          const dia = diatonicByRoot[note];
          const isMinDia = !!dia && (dia.quality === 'min' || dia.quality === 'dim');
          return (
            <g key={`lbl-min-${i}`} pointerEvents="none">
              <text x={lx} y={ly + 3} textAnchor="middle" className="cof-label cof-label-sm">{minorOrder[i]}</text>
              {isMinDia && (
                <text x={lx} y={ly + 13} textAnchor="middle" className="cof-roman">{dia.roman}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="cof-legend">
        <div className="row" style={{gap: 8}}>
          <span className="legend-sw" style={{background:'var(--deg-1-bg)', borderColor:'var(--deg-1)'}}/>
          <span className="muted">Тоника</span>
        </div>
        <div className="row" style={{gap: 8}}>
          <span className="legend-sw" style={{background:'var(--deg-5-bg)', borderColor:'var(--deg-5)'}}/>
          <span className="muted">Диатонические</span>
        </div>
        <div className="row" style={{gap: 8}}>
          <span className="legend-sw" style={{background:'var(--secondary-bg)', borderColor:'var(--secondary)', borderStyle:'dashed'}}/>
          <span className="muted">Втор. доминанты</span>
        </div>
      </div>
    </div>
  );
}

window.CircleOfFifths = CircleOfFifths;
