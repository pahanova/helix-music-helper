# Helix · Music helper

Прототип веб-приложения, помогающего музыканту писать музыку: интерактивные инструменты, квинто-квартовый круг, поисковик аккордов. Полное видение и статус фич — в [`REQUIREMENTS.md`](./REQUIREMENTS.md). Прочитай его перед нетривиальной работой.

## О пользователе

**Пользователь приложения — музыкант, не инженер.** Все решения по UX, лейблам, иконкам и взаимодействию должны быть удобны человеку, который сочиняет музыку:

- Терминология совпадает с реальной музыкальной теорией (ступени, ладо́вые качества, римские цифры, секции круга).
- Аппликатуры читаются так, как их читают гитаристы (низкая струна слева, баррэ — горизонтальная полоса, открытые и заглушенные обозначены над нутом).
- Цвета ступеней — стабильные и согласованные между компонентами (гриф, фортепиано, круг, диатоника, диаграммы). Цвет привязан к ступени тональности, не к абсолютной ноте.

## Музыкальная теория — критична

Перед изменением любой логики в `src/theory/` (или в компонентах, которые её используют — диатонические триады, вторичные доминанты, интервалы аккордов, гаммы) **сверяйся с источниками**:

- Качество аккорда (maj/min/dim) на каждой ступени корректно для лада.
- Энгармонические замены (Bb vs A#, Gb vs F#) выбраны логично для контекста тональности.
- Тюнинги указаны правильно (от низкой струны к высокой).
- Интервалы аккордов в `CHORD_TYPES` — точные полутона от корня.

**Ошибка в теории = инструмент бесполезен.** Если что-то неоднозначно — спрашивай у пользователя, не угадывай.

## Запуск

```bash
npm install
npm run dev        # Vite dev server, http://localhost:5173/
npm run build      # прод-сборка в dist/
```

Если IPv6-loopback блокируется (встречается на этой Windows-машине): `npm run dev -- --host 127.0.0.1`.

## Архитектура и стиль кода

- **Стек:** Vite + React 18 + zustand + ES modules, plain JS/JSX (без TypeScript). Переход на TS или другие крупные изменения тулинга — согласовывай с пользователем заранее.
- **Модули по владению функционалом:** каждая фича владеет своими компонентами И своим CSS (`src/features/<имя>/`). Чистая логика (теория, аудио) отделена от React. Не размазывай стили чужой фичи по своим файлам.
- **Компоненты — не более 4 уровней отступа** внутри функции: глубокий JSX выноси в подкомпоненты, map-колбэки — в отдельные компоненты, вложенные условия — в ранние return.
- **Музыкальная логика** — в `src/theory/` (именованные экспорты через `src/theory/index.js`). Если меняешь сигнатуру — обнови всех потребителей.
- **Состояние** — zustand-store в `src/store/index.js`: примитивы + экшены; производные значения (строй, гамма, диатоника, подсветка) не хранятся, а отдаются мемоизированными хуками там же (`useTuning`, `useScaleNotes`, …). Компоненты подписываются на отдельные поля селекторами — не тяни состояние store через props. В `App` остаётся только tweaks (`useTweaks`, протокол edit-mode); локальное состояние фич (табы поиска, spec конструктора) — в самих фичах.
- **Tweaks-панель** (`src/tweaks/`) общается с хостом по протоколу `__edit_mode_*` через `postMessage`; вне Claude Design она просто инертна.
- Эталонные скриншоты прототипа до переписывания — `docs/screenshots-baseline/`, скриншоты приёмки — `docs/screenshots-rewrite/`, спецификация миграции — `docs/REWRITE-SPEC.md`. Старый no-build код доступен на ветке `master` до слияния.

## Структура файлов

```
index.html                    — точка входа Vite (шрифты, #root)
src/
  main.jsx                    — createRoot + импорт styles.css
  styles.css                  — design-токены, темы, лейаут, топбар, общие карточки/чипы
  theory/                     — чистая музыкальная логика, ноль React (вход: index.js)
    notes.js, scales.js, chords.js, tunings.js, circle-of-fifths.js,
    piano-layout.js, voicings.js — гаммы, аккорды, identifyChord, генератор войсингов
    chord-shapes-data.js      — курированная гитарная БД из chords-db (~300 форм), сгенерированный артефакт
  audio/index.js              — soundfont-player + MusyngKite, MIDI-хелперы, playNote/playChord
  store/index.js              — zustand-store: состояние приложения, экшены, производные хуки
  ui/pulse.js                 — flashPulse (анимация .is-played)
  app/                        — App (композиция+tweaks), TopBar, KeyPicker, LeftPanel,
                                CenterColumn, CircleSection, RightPanel, AppTweaks, Section, Icon
  features/
    instrument/               — Fretboard / Piano / Instrument shell + instrument.css
    circle/                   — CircleOfFifths (SVG-круг) + circle.css
    diagrams/                 — ChordDiagram, PianoChordDiagram, fallback-формы + diagrams.css
    search/                   — ChordSearch, Constructor, NameSearch, VoicingCard + search.css
    pinned/                   — PinnedBar + pinned.css
  tweaks/                     — useTweaks, TweaksPanel, контролы
scripts/build-chord-shapes.js — пересборка chord-shapes-data.js из chords-db (npm run build:chord-shapes)
```

## Звук

- **Стек:** `soundfont-player` (npm) + сэмплы MusyngKite (`gleitz/midi-js-soundfonts`). Лицензии MIT/CC, никаких локальных файлов сэмплов. Сэмпл текущего инструмента подгружается лениво, кэшируется.
- **Карта инструментов:** `guitar → acoustic_guitar_steel`, `bass → electric_bass_finger`, `piano → acoustic_grand_piano` — в `src/audio/index.js → INSTRUMENT_TO_SF`.
- **MIDI:** `tuningOpenMidis(tuning, instrument)` назначает абсолютный MIDI каждой открытой струне (anchor: гитара E2 = 40, бас B0 = 23; следующая струна — минимальный pitch выше предыдущей с нужным pitch class). Для пианино — `noteToMidi(name, octave)` (C4 = 60).
- **Точки входа:**
  - `Instrument` shell пробрасывает `playMidi` в Fretboard/Piano; cell/key click вызывает `playNote(instrument, midi)`.
  - `playChord(chord, voicing?)` — экшен store (`src/store/index.js`), все клики по карточкам идут сюда. Когда воизинг известен (карточка инверсии в поиске, закреплённый, мини-карточка диатоники) — играем именно его MIDI через `voicingToMidis`. Иначе — root-инверсия из `voicingsForChord`. Крайний фолбэк (нет играбельной формы вообще) — синтез из `CHORD_TYPES[type]` в дефолтной октаве.
- **Pulse-анимация:** `flashPulse(el)` из `src/ui/pulse.js` добавляет класс `.is-played`, кейфреймы в `src/styles.css`. Используется на всех кликах (карточки, ноты грифа, клавиши пианино, строки диатоники).
- **Топбар:** чип `аккорд / арпеджио` (`chordPlayMode`), кнопка mute (`audioMuted`). Mute не отключает clicks — только воспроизведение.

## Воркфлоу аппликатур и обращений

- `voicingsForChord(chord, instrument, tuning)` из `src/theory/` — основная точка входа. Возвращает массив инверсий (root/1st/2nd/3rd, до 4 для септаккордов), у каждой — `voicing` (форма для рендера) и `source` (`'curated'` | `'auto'`).
- На гитаре в standard tuning сначала ищется курированная форма в `chord-shapes-data.js` (по имени с учётом slash); если не нашлось — генератор подбирает играбельный войсинг.
- На басу/пианино/нестандартном строе — всегда генератор; для баса `allowBarre: false`.
- Скоринг генератора: `Math.max(0, lowFret - 3) * 1` (низкие позиции свободно, выше — пенальти) + `span * 1.5` + `internalMutes * 4` + бонус за полноту (≥5 струн). Менять с осторожностью — настроено под играбельность популярных аккордов.
