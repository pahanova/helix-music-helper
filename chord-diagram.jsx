// chord-diagram.jsx — small fretboard-style chord diagram

function ChordDiagram({ shape, name, frets = 5, width = 120, height = 130, source }) {
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
        <text x={padX - 6} y={padTop + 9} className="cof-roman" textAnchor="end" fontFamily="var(--font-mono)">
          {baseFret}fr
        </text>
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
      {Array.from({ length: strings }).map((_, i) => {
        const p = positions.find(p => p.string === i);
        if (!p) return (
          <text key={`m-${i}`} x={stringX(i)} y={padTop - 6} textAnchor="middle"
                fontSize="9" fill="var(--text-dim)" fontFamily="var(--font-mono)">×</text>
        );
        if (p.fret === 0) return (
          <circle key={`o-${i}`} cx={stringX(i)} cy={padTop - 6} r="3.5"
                  fill="none" stroke="var(--text-muted)" strokeWidth="1" />
        );
        return null;
      })}

      {/* Fingerings */}
      {positions.filter(p => p.fret > 0).map((p, idx) => {
        const cy = fretY(p.fret - baseFret) - (h / frets) / 2;
        return (
          <g key={`p-${idx}`}>
            <circle cx={stringX(p.string)} cy={cy} r="6.5" fill="var(--text)" />
            {p.finger && (
              <text x={stringX(p.string)} y={cy + 3} textAnchor="middle"
                    fontSize="9" fill="var(--bg)" fontFamily="var(--font-mono)" fontWeight="600">
                {p.finger}
              </text>
            )}
          </g>
        );
      })}

      {/* Barre detection */}
      {allowBarre && (() => {
        const fretCounts = {};
        positions.filter(p => p.fret > 0).forEach(p => {
          fretCounts[p.fret] = (fretCounts[p.fret] || 0) + 1;
        });
        const barreFret = Object.keys(fretCounts).find(f => fretCounts[f] >= 3);
        if (!barreFret) return null;
        const samePos = positions.filter(p => p.fret === parseInt(barreFret));
        const minS = Math.min(...samePos.map(p => p.string));
        const maxS = Math.max(...samePos.map(p => p.string));
        const cy = fretY(parseInt(barreFret) - baseFret) - (h / frets) / 2;
        return (
          <rect x={stringX(minS) - 3} y={cy - 3} width={stringX(maxS) - stringX(minS) + 6} height="6"
                rx="3" fill="var(--text)" opacity="0.85" />
        );
      })()}

      {/* Source badge — 'auto' for generated shapes */}
      {source === 'auto' && (
        <text x={width - padX} y={14} textAnchor="end"
              fontSize="8" fill="var(--text-dim)" fontFamily="var(--font-mono)"
              letterSpacing="0.04em">auto</text>
      )}
    </svg>
  );
}

// Simple shape library (low E on left)
const CHORD_SHAPES = {
  'C':       { baseFret: 1, positions: [{string:0,fret:-1},{string:1,fret:3,finger:3},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'G':       { baseFret: 1, positions: [{string:0,fret:3,finger:2},{string:1,fret:2,finger:1},{string:2,fret:0},{string:3,fret:0},{string:4,fret:0},{string:5,fret:3,finger:3}] },
  'D':       { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:1},{string:4,fret:3,finger:3},{string:5,fret:2,finger:2}] },
  'A':       { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:1},{string:3,fret:2,finger:2},{string:4,fret:2,finger:3},{string:5,fret:0}] },
  'E':       { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:2,finger:3},{string:3,fret:1,finger:1},{string:4,fret:0},{string:5,fret:0}] },
  'F':       { baseFret: 1, positions: [{string:0,fret:1,finger:1},{string:1,fret:3,finger:3},{string:2,fret:3,finger:4},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:1,finger:1}] },
  'Am':      { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:2},{string:3,fret:2,finger:3},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'Em':      { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:2,finger:3},{string:3,fret:0},{string:4,fret:0},{string:5,fret:0}] },
  'Dm':      { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:2},{string:4,fret:3,finger:3},{string:5,fret:1,finger:1}] },
  'Bm':      { baseFret: 2, positions: [{string:1,fret:2,finger:1},{string:2,fret:4,finger:3},{string:3,fret:4,finger:4},{string:4,fret:3,finger:2},{string:5,fret:2,finger:1}] },
  'Cmaj7':   { baseFret: 1, positions: [{string:1,fret:3,finger:3},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:0},{string:5,fret:0}] },
  'G7':      { baseFret: 1, positions: [{string:0,fret:3,finger:3},{string:1,fret:2,finger:2},{string:2,fret:0},{string:3,fret:0},{string:4,fret:0},{string:5,fret:1,finger:1}] },
  'D7':      { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:2,finger:3}] },
  'Am7':     { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'Dm7':     { baseFret: 1, positions: [{string:2,fret:0},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:1,finger:1}] },
  'Em7':     { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:0},{string:3,fret:0},{string:4,fret:0},{string:5,fret:0}] },
  'Fmaj7':   { baseFret: 1, positions: [{string:2,fret:3,finger:3},{string:3,fret:2,finger:2},{string:4,fret:1,finger:1},{string:5,fret:0}] },
  'A7':      { baseFret: 1, positions: [{string:1,fret:0},{string:2,fret:2,finger:2},{string:3,fret:0},{string:4,fret:2,finger:3},{string:5,fret:0}] },
  'E7':      { baseFret: 1, positions: [{string:0,fret:0},{string:1,fret:2,finger:2},{string:2,fret:0},{string:3,fret:1,finger:1},{string:4,fret:0},{string:5,fret:0}] },
  'B7':      { baseFret: 1, positions: [{string:1,fret:2,finger:2},{string:2,fret:1,finger:1},{string:3,fret:2,finger:3},{string:4,fret:0},{string:5,fret:2,finger:4}] },
};

window.ChordDiagram = ChordDiagram;
window.CHORD_SHAPES = CHORD_SHAPES;
