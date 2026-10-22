// Налаштування вигляду: тема, шрифт, розмір і інтерліньяж.
const THEMES = [
  { id: "light", label: "Світла" },
  { id: "sepia", label: "Сепія" },
  { id: "dark", label: "Темна" },
];
const FONTS = [
  { id: "sans", label: "Гротеск", family: "var(--sans)" },
  { id: "serif", label: "Антиква", family: "'Literata', Georgia, serif" },
];
const LEADING = [
  { id: 1.5, label: "Щільно" },
  { id: 1.75, label: "Звично" },
  { id: 2, label: "Просторо" },
];

export const FONT_FAMILY = Object.fromEntries(FONTS.map((f) => [f.id, f.family]));

export default function Settings({ open, s, set }) {
  return (
    <div className={`rd-pop${open ? " is-open" : ""}`} role="dialog" aria-label="Налаштування тексту" aria-hidden={!open}>
      <div className="rd-pop__row">
        {THEMES.map((t) => (
          <button key={t.id} className={`rd-swatch rd-swatch--${t.id}${s.theme === t.id ? " is-on" : ""}`} onClick={() => set({ theme: t.id })}>
            <i>Аа</i>
            {t.label}
          </button>
        ))}
      </div>
      <div className="rd-pop__row">
        {FONTS.map((f) => (
          <button key={f.id} className={`rd-seg${s.font === f.id ? " is-on" : ""}`} style={{ fontFamily: f.family }} onClick={() => set({ font: f.id })}>
            {f.label}
          </button>
        ))}
      </div>
      <label className="rd-pop__size">
        <span style={{ fontSize: 13 }}>А</span>
        <input type="range" min="15" max="25" step="1" value={s.size} onChange={(e) => set({ size: +e.target.value })} aria-label="Розмір шрифту" />
        <span style={{ fontSize: 20 }}>А</span>
        <b>{s.size}</b>
      </label>
      <div className="rd-pop__row">
        {LEADING.map((l) => (
          <button key={l.id} className={`rd-seg${s.leading === l.id ? " is-on" : ""}`} onClick={() => set({ leading: l.id })}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
