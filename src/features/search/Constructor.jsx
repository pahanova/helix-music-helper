// src/features/search/Constructor.jsx — chord constructor («По нотам»):
// root / quality / sus / extensions / fifth / omit control groups + result
// block with the formula pills and a vertical list of inversion voicings.

import { CHORD_TYPES, NOTES_SHARP, isChordInScale, voicingsForChord } from '../../theory/index.js';
import { useStore, useTuning, useScaleNotes, useKeyName } from '../../store/index.js';
import VoicingCard from './VoicingCard.jsx';

export const EMPTY_SPEC = {
  root: null,
  quality: 'maj',
  sus: null,
  ext7: false,
  maj7: false,
  ext9: false,
  alt9: null,
  ext11: false,
  alt11: null,
  ext13: false,
  alt13: null,
  alt5: null,
  omit3: false,
  omit5: false,
};

export default function Constructor({ spec, setSpec, update, setEnum, built }) {
  const fifthForced = spec.quality === 'dim' || spec.quality === 'aug';
  const susOn = !!spec.sus;
  const isPower = spec.quality === '5';
  const thirdOmitted = spec.omit3 || isPower;
  const reset = () => setSpec(EMPTY_SPEC);

  return (
    <div className="col" style={{gap: 12}}>
      <RootGroup spec={spec} update={update} reset={reset} />
      <QualityGroup spec={spec} update={update} susOn={susOn} />
      <SusGroup spec={spec} update={update} isPower={isPower} />
      <ExtensionsGroup spec={spec} update={update} setEnum={setEnum} />
      <FifthGroup spec={spec} update={update} setEnum={setEnum} fifthForced={fifthForced} />
      <OmitGroup spec={spec} update={update}
                 susOn={susOn} isPower={isPower} fifthForced={fifthForced} thirdOmitted={thirdOmitted} />
      <ConstructorResult built={built} />
    </div>
  );
}

/* ─── Control groups ────────────────────────────────────────── */

function Group({ label, hint, right, children }) {
  return (
    <div>
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'baseline', margin: '0 2px 6px'}}>
        <span style={{fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)'}}>{label}</span>
        {hint && <span className="dim" style={{fontSize: 10.5}}>{hint}</span>}
        {right}
      </div>
      {children}
    </div>
  );
}

function RootGroup({ spec, update, reset }) {
  const resetBtn = spec.root && (
    <button className="btn-ghost" onClick={reset} style={{fontSize: 11, padding: '0 6px'}}>сброс</button>
  );
  const chips = NOTES_SHARP.map(n => (
    <button key={n}
            className={`filter-chip ${spec.root === n ? 'is-on' : ''}`}
            onClick={() => update({ root: spec.root === n ? null : n })}
            style={{fontFamily: 'var(--font-mono)'}}>{n}</button>
  ));
  return (
    <Group label="Корень" right={resetBtn}>
      <div className="root-grid">{chips}</div>
    </Group>
  );
}

const QUALITIES = [['maj', 'maj'], ['min', 'min'], ['dim', 'dim'], ['aug', 'aug'], ['5', '5']];

function QualityGroup({ spec, update, susOn }) {
  const chips = QUALITIES.map(([v, l]) => (
    <button key={v}
            className={`filter-chip ${spec.quality === v ? 'is-on' : ''}`}
            disabled={susOn}
            onClick={() => update({ quality: v })}
            title={v === '5' ? 'Power chord — без терции' : undefined}>{l}</button>
  ));
  return (
    <Group label="Качество">
      <div className="filter-row">
        {chips}
        {susOn && <span className="dim" style={{fontSize: 10.5, alignSelf: 'center', marginLeft: 6}}>заменено sus</span>}
      </div>
    </Group>
  );
}

function SusGroup({ spec, update, isPower }) {
  return (
    <Group label="Sus" hint={isPower ? 'недоступно при качестве 5' : 'заменяет терцию'}>
      <div className="filter-row">
        <button className={`filter-chip ${!spec.sus ? 'is-on' : ''}`}
                disabled={isPower}
                onClick={() => update({ sus: null })}>—</button>
        <button className={`filter-chip ${spec.sus === 'sus2' ? 'is-on' : ''}`}
                disabled={isPower}
                onClick={() => update({ sus: spec.sus === 'sus2' ? null : 'sus2' })}>sus2</button>
        <button className={`filter-chip ${spec.sus === 'sus4' ? 'is-on' : ''}`}
                disabled={isPower}
                onClick={() => update({ sus: spec.sus === 'sus4' ? null : 'sus4' })}>sus4</button>
      </div>
    </Group>
  );
}

function ExtensionsGroup({ spec, update, setEnum }) {
  return (
    <Group label="Расширения" hint={spec.ext7 ? null : '[7] делает 7-ку доминантной'}>
      <SeventhNinthRow spec={spec} update={update} setEnum={setEnum} />
      <EleventhThirteenthRow spec={spec} update={update} setEnum={setEnum} />
    </Group>
  );
}

function SeventhNinthRow({ spec, update, setEnum }) {
  return (
    <div className="filter-row">
      <button className={`filter-chip ${spec.ext7 ? 'is-on' : ''}`}
              onClick={() => update({ ext7: !spec.ext7, maj7: spec.ext7 ? false : spec.maj7 })}>7</button>
      {spec.ext7 && (
        <button className={`filter-chip ${spec.maj7 ? 'is-on' : ''}`}
                onClick={() => update({ maj7: !spec.maj7 })}
                title="Поднять до натуральной 7-й (maj7)">♮7</button>
      )}
      <span className="chip-sep" />
      <button className={`filter-chip ${spec.ext9 ? 'is-on' : ''}`}
              onClick={() => update({ ext9: !spec.ext9, alt9: spec.ext9 ? null : spec.alt9 })}>9</button>
      {spec.ext9 && (
        <button className={`filter-chip ${spec.alt9 === 'b9' ? 'is-on' : ''}`}
                onClick={() => setEnum('alt9', 'b9')}>♭9</button>
      )}
      {spec.ext9 && (
        <button className={`filter-chip ${spec.alt9 === '#9' ? 'is-on' : ''}`}
                onClick={() => setEnum('alt9', '#9')}>♯9</button>
      )}
    </div>
  );
}

function EleventhThirteenthRow({ spec, update, setEnum }) {
  return (
    <div className="filter-row" style={{marginTop: 4}}>
      <button className={`filter-chip ${spec.ext11 ? 'is-on' : ''}`}
              onClick={() => update({ ext11: !spec.ext11, alt11: spec.ext11 ? null : spec.alt11 })}>11</button>
      {spec.ext11 && (
        <button className={`filter-chip ${spec.alt11 === '#11' ? 'is-on' : ''}`}
                onClick={() => setEnum('alt11', '#11')}>♯11</button>
      )}
      <span className="chip-sep" />
      <button className={`filter-chip ${spec.ext13 ? 'is-on' : ''}`}
              onClick={() => update({ ext13: !spec.ext13, alt13: spec.ext13 ? null : spec.alt13 })}>13</button>
      {spec.ext13 && (
        <button className={`filter-chip ${spec.alt13 === 'b13' ? 'is-on' : ''}`}
                onClick={() => setEnum('alt13', 'b13')}>♭13</button>
      )}
    </div>
  );
}

function FifthGroup({ spec, update, setEnum, fifthForced }) {
  return (
    <Group label="5-я ступень" hint={fifthForced ? `задана качеством ${spec.quality}` : null}>
      <div className="filter-row">
        <button className={`filter-chip ${!spec.alt5 ? 'is-on' : ''}`}
                disabled={fifthForced}
                onClick={() => update({ alt5: null })}>—</button>
        <button className={`filter-chip ${spec.alt5 === 'b5' ? 'is-on' : ''}`}
                disabled={fifthForced}
                onClick={() => setEnum('alt5', 'b5')}>♭5</button>
        <button className={`filter-chip ${spec.alt5 === '#5' ? 'is-on' : ''}`}
                disabled={fifthForced}
                onClick={() => setEnum('alt5', '#5')}>♯5</button>
      </div>
    </Group>
  );
}

function OmitGroup({ spec, update, susOn, isPower, fifthForced, thirdOmitted }) {
  return (
    <Group label="Omit" hint={isPower ? 'нет 3 — задано качеством 5' : null}>
      <div className="filter-row">
        <button className={`filter-chip ${thirdOmitted ? 'is-on' : ''}`}
                disabled={susOn || isPower}
                onClick={() => update({ omit3: !spec.omit3 })}>нет 3</button>
        <button className={`filter-chip ${spec.omit5 ? 'is-on' : ''}`}
                disabled={fifthForced}
                onClick={() => update({ omit5: !spec.omit5 })}>нет 5</button>
      </div>
    </Group>
  );
}

/* ─── Result block ──────────────────────────────────────────── */

function ConstructorResult({ built }) {
  const instrument = useStore(s => s.instrument);
  const tuning = useTuning();
  const scaleNotes = useScaleNotes();
  const keyName = useKeyName();
  if (!built) {
    return (
      <div className="muted" style={{
        fontSize: 11.5, padding: '14px 8px', border: '1px dashed var(--border)',
        borderRadius: 8, textAlign: 'center', marginTop: 6,
      }}>
        Выбери корень — соберём аккорд.
      </div>
    );
  }
  // Determine type — try to round-trip via a simple lookup against CHORD_TYPES based on intervals.
  const baseChord = { root: built.root, type: deriveTypeFromBuilt(built), name: built.name, notes: built.notes };
  const inversions = voicingsForChord(baseChord, instrument, tuning);
  const inScale = isChordInScale(built.notes, scaleNotes);

  return (
    <div className="constructor-result">
      <FormulaRow built={built} inScale={inScale} keyName={keyName} />
      {inversions.length === 0 ? (
        <div className="dim" style={{fontSize: 11, marginTop: 8, textAlign: 'center'}}>не нашлось играбельной аппликатуры для этого инструмента</div>
      ) : (
        <InversionList baseChord={baseChord} inversions={inversions} />
      )}
    </div>
  );
}

function FormulaRow({ built, inScale, keyName }) {
  const pills = built.notes.map((n, i) => (
    <span key={i} className="note-pill">
      <span className="note-pill-deg">{built.labels[i]}</span>
      <span className="mono">{n}</span>
    </span>
  ));
  return (
    <div className="row" style={{gap: 4, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center'}}>
      {pills}
      {inScale && <InKeyBadge keyName={keyName} />}
    </div>
  );
}

function InversionList({ baseChord, inversions }) {
  const cards = inversions.map((inv, idx) => (
    <VoicingCard key={idx} chord={baseChord} inversion={inv} layout="row" />
  ));
  return <div className="col" style={{gap: 8}}>{cards}</div>;
}

// Map a buildChord result back to a CHORD_TYPES key (best-effort) for downstream lookup.
function deriveTypeFromBuilt(built) {
  if (!built) return 'maj';
  const intervals = built.intervals.slice().sort((a, b) => a - b).join(',');
  for (const [t, ivs] of Object.entries(CHORD_TYPES)) {
    if (ivs.slice().sort((a, b) => a - b).join(',') === intervals) return t;
  }
  return 'maj';
}

/* ─── In-key badge (formula row) ────────────────────────────── */

function InKeyBadge({ keyName }) {
  return (
    <span className="in-key-badge" title={keyName ? `Все ноты в тональности ${keyName}` : 'Все ноты в текущей тональности'}>
      <CheckIcon />
      <span>в тональности</span>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
