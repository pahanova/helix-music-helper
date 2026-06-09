// src/app/Section.jsx — left-panel section with uppercase header.

export default function Section({ title, subtle, children }) {
  return (
    <div className="sec">
      <div className="sec-h" style={subtle ? {color: 'var(--text-dim)'} : {}}>{title}</div>
      {children}
    </div>
  );
}
