// ChordDiagram — small fretboard-style chord diagram

import './diagrams.css';

// Re-export фоллбэк-библиотеки форм (бывший window.CHORD_SHAPES из этого же файла).
export { CHORD_SHAPES } from './chord-shapes-fallback.js';

// Open / muted indicator above the nut for one string (null when fretted).
function OpenMuteMark({ p, x, padTop }) {
  if (!p) return (
    <text x={x} y={padTop - 6} textAnchor="middle"
          fontSize="9" fill="var(--text-dim)" fontFamily="var(--font-mono)">×</text>
  );
  if (p.fret === 0) return (
    <circle cx={x} cy={padTop - 6} r="3.5"
            fill="none" stroke="var(--text-muted)" strokeWidth="1" />
  );
  return null;
}

// One fingering dot (+ optional finger number).
function Fingering({ p, x, cy }) {
  return (
    <g>
      <circle cx={x} cy={cy} r="6.5" fill="var(--text)" />
      {p.finger && (
        <text x={x} y={cy + 3} textAnchor="middle" fontSize="9"
              fill="var(--bg)" fontFamily="var(--font-mono)" fontWeight="600">{p.finger}</text>
      )}
    </g>
  );
}

// Barre detection — horizontal bar when ≥3 strings share a fret.
function BarreBar({ positions, stringX, fretY, baseFret, h, frets }) {
  const fretCounts = {};
  positions.filter(p => p.fret > 0).forEach(p => {
    fretCounts[p.fret] = (fretCounts[p.fret] || 0) + 1;
  });
  const barreFret = Object.keys(fretCounts).find(f => fretCounts[f] >= 3);
  if (!barreFret) return null;
  const samePos = positions.filter(p => p.fret === parseInt(barreFret));
  const minS = Math.min(...samePos.map(p => p.string));
  const maxS = Math.max(...samePos.map(p => p.string));
  const cy = fretY(parseInt(barreFret) - baseFret) + (h / frets) / 2;
  return (
    <rect x={stringX(minS) - 3} y={cy - 3} width={stringX(maxS) - stringX(minS) + 6} height="6"
          rx="3" fill="var(--text)" opacity="0.85" />
  );
}

export default function ChordDiagram({ shape, name, frets = 5, width = 120, height = 130, source }) {
  // shape: { positions: [{ string, fret, finger?, mute? }], baseFret, tuning?, allowBarre? }
  // strings drawn vertically (low on left)
  const strings = shape?.tuning?.length || 6;
  const padTop = 24;
  const padBottom = 14;
  const padX = 16;
  const w = width - padX * 2;
  const h = height - padTop - padBottom;
  const stringX = i => padX + (w / (strings - 1)) * i;
  const fretY = i => padTop + (h / frets) * i;

  const baseFret = shape?.baseFret || 1;
  const positions = shape?.positions || [];
  const allowBarre = shape?.allowBarre !== false;

  return (
    <svg className="diag" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Top — name */}
      <text x={width / 2} y={14} textAnchor="middle" className="diag-name">{name}</text>

      {/* Nut or fret label */}
      {baseFret === 1 ? (
        <rect x={padX - 1} y={padTop - 3} width={w + 2} height={3} fill="var(--text)" />
      ) : (
        <text x={padX - 6} y={padTop + 9} className="cof-roman" textAnchor="end"
              fontFamily="var(--font-mono)">{baseFret}fr</text>
      )}

      {/* Frets */}
      {Array.from({ length: frets + 1 }).map((_, i) => (
        <line key={`f-${i}`} x1={padX} x2={padX + w} y1={fretY(i)} y2={fretY(i)}
              stroke="var(--border-strong)" strokeWidth="0.8" />
      ))}
      {/* Strings */}
      {Array.from({ length: strings }).map((_, i) => (
        <line key={`s-${i}`} x1={stringX(i)} x2={stringX(i)} y1={padTop} y2={padTop + h}
              stroke="var(--text-dim)" strokeWidth="0.8" opacity="0.6" />
      ))}

      {/* Open / muted indicators above nut */}
      {Array.from({ length: strings }).map((_, i) => (
        <OpenMuteMark key={`om-${i}`} p={positions.find(p => p.string === i)}
                      x={stringX(i)} padTop={padTop} />
      ))}

      {/* Fingerings */}
      {positions.filter(p => p.fret > 0).map((p, idx) => (
        <Fingering key={`p-${idx}`} p={p} x={stringX(p.string)}
                   cy={fretY(p.fret - baseFret) + (h / frets) / 2} />
      ))}

      {/* Barre detection */}
      {allowBarre && (
        <BarreBar positions={positions} stringX={stringX} fretY={fretY}
                  baseFret={baseFret} h={h} frets={frets} />
      )}

      {/* Source badge — 'auto' for generated shapes */}
      {source === 'auto' && (
        <text x={width - padX} y={14} textAnchor="end"
              fontSize="8" fill="var(--text-dim)" fontFamily="var(--font-mono)"
              letterSpacing="0.04em">auto</text>
      )}
    </svg>
  );
}
