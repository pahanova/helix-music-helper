// src/features/search/PositionPlaceholder.jsx — «По позиции» tab stub
// (identifyChord exists in theory but is intentionally not wired up yet).

export default function PositionPlaceholder() {
  return (
    <div className="muted" style={{
      fontSize: 11.5, padding: '14px 8px', border: '1px dashed var(--border)',
      borderRadius: 8, textAlign: 'center',
    }}>
      Кликай по ладам на грифе — мы определим аккорд по выбранным нотам.
    </div>
  );
}
