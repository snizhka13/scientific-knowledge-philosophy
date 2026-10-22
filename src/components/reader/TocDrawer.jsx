import { IconClose } from "./icons.jsx";

// Зміст книжки з прогресом кожного розділу.
export default function TocDrawer({ open, book, current, read, onClose, onPick }) {
  const groups = [];
  let n = 1;
  groups.push({ title: null, items: [{ ch: 0, title: book.parts[0].title }] });
  book.contents.forEach((part, k) => {
    groups.push({ title: part.title ? `Розділ ${k + 1}. ${part.title}` : null, items: part.items.map((t) => ({ ch: n++, title: t })) });
  });
  return (
    <aside className={`rd-drawer rd-drawer--left${open ? " is-open" : ""}`} aria-hidden={!open} aria-label="Зміст">
      <div className="rd-drawer__head">
        <strong>Зміст</strong>
        <button className="rd-icon" onClick={onClose} aria-label="Закрити"><IconClose /></button>
      </div>
      <nav className="rd-toc">
        {groups.map((g, k) => (
          <div key={k}>
            {g.title && <h4>{g.title}</h4>}
            <ol>
              {g.items.map(({ ch, title }) => {
                const r = Math.min(1, read[ch] || 0);
                return (
                  <li key={ch}>
                    <button className={ch === current ? "is-current" : ""} onClick={() => onPick(ch)}>
                      <span className="rd-toc__num">{ch === 0 ? "—" : String(ch).padStart(2, "0")}</span>
                      <span className="rd-toc__title">{title}</span>
                      <span className="rd-toc__meta">
                        с. {book.parts[ch].page} · {Math.max(1, Math.round(book.parts[ch].words / 200))} хв
                        {r >= 0.95 ? " · прочитано" : ""}
                      </span>
                      <i className="rd-toc__bar"><i style={{ transform: `scaleX(${r})` }} /></i>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </nav>
    </aside>
  );
}
