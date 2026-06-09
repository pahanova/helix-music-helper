// src/ui/pulse.js
// Trigger a one-shot pulse animation on a clicked element.
// Keyframes for `.is-played` live in styles.css.

export function flashPulse(el) {
  if (!el) return;
  el.classList.remove('is-played');
  void el.offsetWidth; // force reflow so the animation restarts on rapid re-clicks
  el.classList.add('is-played');
  setTimeout(() => el.classList.remove('is-played'), 260);
}
