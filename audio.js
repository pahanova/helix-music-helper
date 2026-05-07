// audio.js — playback engine.
// Wraps soundfont-player + MusyngKite GM samples (loaded from gleitz/midi-js-soundfonts CDN).
// Exposes window.HelixAudio with lazy-loaded, cached instrument players.

(function () {
  const INSTRUMENT_TO_SF = {
    guitar: 'acoustic_guitar_steel',
    bass:   'electric_bass_finger',
    piano:  'acoustic_grand_piano',
  };

  // Anchor MIDI for the LOWEST open string of each fretboard family.
  // Pitch-class of tuning[0] is shifted to the nearest octave around this anchor.
  //   guitar → E2 (40),  bass → B0 (23).
  // Each subsequent string is placed at the lowest pitch above the previous.
  const ANCHOR_MIDI = { guitar: 40, bass: 23 };

  let ctx = null;
  const players = {}; // sf-name → soundfont-player instance
  const loading = {}; // sf-name → in-flight load Promise

  function ensureCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function load(instrumentKey) {
    const sf = INSTRUMENT_TO_SF[instrumentKey];
    if (!sf) return Promise.reject(new Error('Unknown instrument: ' + instrumentKey));
    if (players[sf]) return Promise.resolve(players[sf]);
    if (loading[sf]) return loading[sf];
    if (!window.Soundfont) return Promise.reject(new Error('soundfont-player not available'));
    const c = ensureCtx();
    if (!c) return Promise.reject(new Error('AudioContext unavailable'));
    loading[sf] = window.Soundfont
      .instrument(c, sf, { soundfont: 'MusyngKite' })
      .then(p => { players[sf] = p; delete loading[sf]; return p; })
      .catch(err => { delete loading[sf]; throw err; });
    return loading[sf];
  }

  function playNote(instrumentKey, midi, opts = {}) {
    const { velocity = 100, duration = 1.6, when = 0 } = opts;
    return load(instrumentKey).then(p => {
      const c = ensureCtx();
      p.play(midi, c.currentTime + when, { gain: velocity / 127, duration });
    }).catch(err => console.warn('[HelixAudio] playNote failed', err));
  }

  function playChord(instrumentKey, midiList, opts = {}) {
    const { mode = 'block', arpeggioMs = 110, duration = 2.2, velocity = 100 } = opts;
    if (!midiList || midiList.length === 0) return Promise.resolve();
    return load(instrumentKey).then(p => {
      const c = ensureCtx();
      const t0 = c.currentTime;
      midiList.forEach((m, i) => {
        const offset = mode === 'arpeggio' ? (arpeggioMs * i) / 1000 : 0;
        p.play(m, t0 + offset, { gain: velocity / 127, duration });
      });
    }).catch(err => console.warn('[HelixAudio] playChord failed', err));
  }

  // Note + scientific octave → MIDI (C4 = 60).
  function noteToMidi(name, octave) {
    return (octave + 1) * 12 + window.MT.noteIndex(name);
  }

  // Returns absolute MIDI for each open string in `tuning` (low → high).
  // Anchors the lowest string at instrument anchor; later strings ascend.
  function tuningOpenMidis(tuning, instrumentKey) {
    if (!tuning || tuning.length === 0) return [];
    const target = ANCHOR_MIDI[instrumentKey] != null ? ANCHOR_MIDI[instrumentKey] : 40;
    const out = [];
    const idx0 = window.MT.noteIndex(tuning[0]);
    const oct0 = Math.round((target - idx0) / 12);
    out.push(oct0 * 12 + idx0);
    for (let i = 1; i < tuning.length; i++) {
      const idx = window.MT.noteIndex(tuning[i]);
      let m = out[i - 1] + 1;
      while ((((m % 12) + 12) % 12) !== idx) m++;
      out.push(m);
    }
    return out;
  }

  // Voicing → MIDI list. Handles both fretboard and piano voicings.
  function voicingToMidis(voicing, openMidis) {
    if (!voicing) return [];
    if (voicing.kind === 'piano') {
      return voicing.notes.map(n => noteToMidi(n.name, n.octave));
    }
    if (voicing.kind === 'fretboard') {
      return voicing.positions
        .map(p => openMidis[p.string] + p.fret)
        .sort((a, b) => a - b);
    }
    return [];
  }

  window.HelixAudio = {
    load,
    playNote,
    playChord,
    ensureUnlocked: ensureCtx,
    noteToMidi,
    tuningOpenMidis,
    voicingToMidis,
    INSTRUMENT_TO_SF,
  };
})();
