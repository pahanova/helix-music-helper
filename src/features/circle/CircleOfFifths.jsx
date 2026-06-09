// CircleOfFifths — Circle of Fifths with diatonic chords + secondary dominants

import { useMemo } from 'react';
import {
  CIRCLE_MAJOR,
  CIRCLE_MINOR,
  MODES,
  diatonicChords,
  keyLabel,
  secondaryDominants,
} from '../../theory/index.js';
import './circle.css';

const segAngle = 360 / 12;

function arcPath(cx, cy, r1, r2, startA, endA) {
  const toXY = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const [x1, y1] = toXY(r2, startA);
  const [x2, y2] = toXY(r2, endA);
  const [x3, y3] = toXY(r1, endA);
  const [x4, y4] = toXY(r1, startA);
  const large = endA - startA > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r2} ${r2} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 ${large} 0 ${x4} ${y4} Z`;
}

function labelPos(cx, cy, r, idx) {
  const a = -90 + idx * segAngle;
  return [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
}

// Outer ring — major keys
function MajorSegment({ geom, slice, note, isCurrent, dia, isDiatonic, isSecondary, onSelectKey }) {
  const { cx, cy, midR, outerR } = geom;
  const { startA, endA } = slice;
  let fill = 'var(--bg-muted)';
  if (isCurrent) fill = 'var(--deg-1-bg)';
  else if (isDiatonic) fill = `var(--deg-${dia.index}-bg)`;
  else if (isSecondary) fill = 'var(--secondary-bg)';
  return (
    <g className={`cof-seg ${isCurrent ? 'is-current' : ''} ${isDiatonic ? 'is-diatonic' : ''} ${isSecondary ? 'is-secondary' : ''}`}
       onClick={() => onSelectKey && onSelectKey(note, 'major')}>
      <path d={arcPath(cx, cy, midR, outerR, startA, endA)} fill={fill} stroke="var(--border)" strokeWidth="1"/>
      {(isDiatonic || isCurrent) && (
        <path d={arcPath(cx, cy, midR, outerR, startA, endA)}
              fill="none"
              stroke={`var(--deg-${dia ? dia.index : 1})`}
              strokeWidth={isCurrent ? 2 : 0}
              opacity={isCurrent ? 1 : 0} />
      )}
    </g>
  );
}

function MajorRing({ slices, geom, family, rootNote, diatonicByRoot, secondaryDoms, onSelectKey }) {
  return slices.map((slice) => {
    const note = CIRCLE_MAJOR[slice.i];
    const isCurrent = family === 'major' && note === rootNote;
    const dia = diatonicByRoot[note];
    const isDiatonic = !!dia && dia.quality !== 'min' && dia.quality !== 'dim';
    const isSecondary = secondaryDoms.has(note) && !isDiatonic && !isCurrent;
    return (
      <MajorSegment key={`maj-${slice.i}`} geom={geom} slice={slice} note={note}
                    isCurrent={isCurrent} dia={dia} isDiatonic={isDiatonic}
                    isSecondary={isSecondary} onSelectKey={onSelectKey} />
    );
  });
}

// Inner ring — relative minors
function MinorSegment({ geom, slice, note, isCurrent, dia, isDiatonic, onSelectKey }) {
  const { cx, cy, innerR, midR } = geom;
  const { startA, endA } = slice;
  let fill = 'var(--bg-muted)';
  if (isCurrent) fill = 'var(--deg-1-bg)';
  else if (isDiatonic) fill = `var(--deg-${dia.index}-bg)`;
  return (
    <g className={`cof-seg cof-min ${isCurrent ? 'is-current' : ''} ${isDiatonic ? 'is-diatonic' : ''}`}
       onClick={() => onSelectKey && onSelectKey(note, 'minor')}>
      <path d={arcPath(cx, cy, innerR, midR, startA, endA)} fill={fill} stroke="var(--border)" strokeWidth="1"/>
    </g>
  );
}

function MinorRing({ slices, geom, family, rootNote, diatonicByRoot, onSelectKey }) {
  return slices.map((slice) => {
    const note = CIRCLE_MINOR[slice.i].replace('m', '');
    const isCurrent = family === 'minor' && note === rootNote;
    const dia = diatonicByRoot[note];
    const isDiatonic = !!dia && (dia.quality === 'min' || dia.quality === 'dim');
    return (
      <MinorSegment key={`min-${slice.i}`} geom={geom} slice={slice} note={note}
                    isCurrent={isCurrent} dia={dia} isDiatonic={isDiatonic}
                    onSelectKey={onSelectKey} />
    );
  });
}

// Labels
function MajorLabel({ x, y, note, dia }) {
  const showRoman = dia && dia.quality !== 'min' && dia.quality !== 'dim';
  return (
    <g pointerEvents="none">
      <text x={x} y={y + 4} textAnchor="middle" className={`cof-label ${dia ? 'is-deg' : ''}`}>{note}</text>
      {showRoman && (
        <text x={x} y={y + 16} textAnchor="middle" className="cof-roman">{dia.roman}</text>
      )}
    </g>
  );
}

function MajorLabels({ slices, geom, diatonicByRoot }) {
  return slices.map(({ i }) => {
    const [lx, ly] = labelPos(geom.cx, geom.cy, geom.labelR, i);
    return (
      <MajorLabel key={`lbl-maj-${i}`} x={lx} y={ly}
                  note={CIRCLE_MAJOR[i]} dia={diatonicByRoot[CIRCLE_MAJOR[i]]} />
    );
  });
}

function MinorLabel({ x, y, fullName, dia, isMinDia }) {
  return (
    <g pointerEvents="none">
      <text x={x} y={y + 3} textAnchor="middle" className="cof-label cof-label-sm">{fullName}</text>
      {isMinDia && (
        <text x={x} y={y + 13} textAnchor="middle" className="cof-roman">{dia.roman}</text>
      )}
    </g>
  );
}

function MinorLabels({ slices, geom, diatonicByRoot }) {
  return slices.map(({ i }) => {
    const [lx, ly] = labelPos(geom.cx, geom.cy, geom.minorR, i);
    const note = CIRCLE_MINOR[i].replace('m', '');
    const dia = diatonicByRoot[note];
    const isMinDia = !!dia && (dia.quality === 'min' || dia.quality === 'dim');
    return (
      <MinorLabel key={`lbl-min-${i}`} x={lx} y={ly}
                  fullName={CIRCLE_MINOR[i]} dia={dia} isMinDia={isMinDia} />
    );
  });
}

function Legend() {
  return (
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
  );
}

export default function CircleOfFifths({
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
  const geom = { cx, cy, outerR, midR, innerR, labelR, minorR };

  const modeInfo = MODES[mode] || MODES.major;
  const family = modeInfo.family;

  // Diatonic chords for the current key, by root note (empty for pentatonic)
  const diatonicByRoot = useMemo(() => {
    const map = {};
    diatonicChords(rootNote, mode).forEach((c, i) => { map[c.root] = { ...c, index: i + 1 }; });
    return map;
  }, [rootNote, mode]);

  // Secondary dominant roots
  const secondaryDoms = useMemo(() => {
    if (!showSecondaryDominants) return new Set();
    return new Set(secondaryDominants(rootNote, mode).map(d => d.root));
  }, [rootNote, mode, showSecondaryDominants]);

  // Build pie slices
  const slices = [];
  for (let i = 0; i < 12; i++) {
    const startA = -90 + i * segAngle - segAngle / 2;
    const endA = startA + segAngle;
    slices.push({ i, startA, endA });
  }

  return (
    <div className="cof-wrap">
      <svg className="cof" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <MajorRing slices={slices} geom={geom} family={family} rootNote={rootNote}
                   diatonicByRoot={diatonicByRoot} secondaryDoms={secondaryDoms}
                   onSelectKey={onSelectKey} />
        <MinorRing slices={slices} geom={geom} family={family} rootNote={rootNote}
                   diatonicByRoot={diatonicByRoot} onSelectKey={onSelectKey} />
        {/* Inner disc */}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="var(--bg)" stroke="var(--border)" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="cof-center-key">{keyLabel(rootNote, mode)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="cof-center-mode">{MODES[mode] ? MODES[mode].label : mode}</text>
        <MajorLabels slices={slices} geom={geom} diatonicByRoot={diatonicByRoot} />
        <MinorLabels slices={slices} geom={geom} diatonicByRoot={diatonicByRoot} />
      </svg>
      <Legend />
    </div>
  );
}
