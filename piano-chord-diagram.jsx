// piano-chord-diagram.jsx — small piano keyboard diagram for a chord voicing

function PianoChordDiagram({ voicing, name, width = 160, height = 80 }) {
  // voicing: { notes: [{ name, octave, isBass }], range: { startOctave, octaves }, bassNote }
  if (!voicing || !voicing.notes) return null;

  const { startOctave, octaves } = voicing.range;
  const WHITE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const BLACK_AFTER = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' }; // black between this white and next

  // Build the list of white keys spanning the displayed range.
  const whites = [];
  for (let o = 0; o < octaves; o++) {
    for (const w of WHITE_NAMES) {
      whites.push({ name: w, octave: startOctave + o });
    }
  }

  const padTop = 18;
  const padBottom = 6;
  const padX = 4;
  const w = width - padX * 2;
  const h = height - padTop - padBottom;
  const whiteW = w / whites.length;
  const blackW = whiteW * 0.6;
  const blackH = h * 0.6;

  // For lookup: which keys are highlighted, by name+octave.
  const highlightMap = new Map();
  voicing.notes.forEach(n => {
    highlightMap.set(`${n.name}${n.octave}`, n);
  });

  // Build black keys list (positioned between whites).
  const blacks = [];
  whites.forEach((wk, i) => {
    const blackName = BLACK_AFTER[wk.name];
    if (!blackName) return;
    if (i === whites.length - 1) return; // no next white in range
    blacks.push({
      name: blackName,
      octave: wk.octave,
      cx: padX + (i + 1) * whiteW, // position over the boundary
    });
  });

  return (
    <svg className="diag piano-diag" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Top — name */}
      <text x={width / 2} y={13} textAnchor="middle" className="diag-name">{name}</text>

      {/* White keys */}
      {whites.map((wk, i) => {
        const x = padX + i * whiteW;
        const hl = highlightMap.get(`${wk.name}${wk.octave}`);
        return (
          <g key={`w-${i}`}>
            <rect x={x} y={padTop} width={whiteW} height={h}
                  fill="var(--bg-elev)"
                  stroke="var(--border-strong)" strokeWidth="0.6" />
            {hl && (
              <circle cx={x + whiteW / 2} cy={padTop + h - whiteW / 2 - 2}
                      r={Math.min(whiteW * 0.42, 7)}
                      fill={hl.isBass ? 'var(--text)' : 'var(--bg-muted)'}
                      stroke={hl.isBass ? 'var(--text)' : 'var(--text)'}
                      strokeWidth={hl.isBass ? 0 : 1.2} />
            )}
          </g>
        );
      })}

      {/* Black keys (rendered after whites so they sit on top) */}
      {blacks.map((bk, i) => {
        const x = bk.cx - blackW / 2;
        const hl = highlightMap.get(`${bk.name}${bk.octave}`);
        return (
          <g key={`b-${i}`}>
            <rect x={x} y={padTop} width={blackW} height={blackH}
                  fill="var(--text)" />
            {hl && (
              <circle cx={bk.cx} cy={padTop + blackH - blackW / 2 - 2}
                      r={Math.min(blackW * 0.42, 5)}
                      fill={hl.isBass ? 'var(--bg)' : 'var(--text)'}
                      stroke="var(--bg)"
                      strokeWidth={hl.isBass ? 0 : 1} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

window.PianoChordDiagram = PianoChordDiagram;
