import { useMemo, useState } from "react";
import { IconClose, IconCopy, IconDownload, IconSearch, IconTrash, IconArrow } from "./icons.jsx";
import { citation, download, printPdf } from "./text.js";

const TABS = [
  { id: "quotes", label: "Цитати" },
  { id: "bookmarks", label: "Закладки" },
  { id: "words", label: "Словничок" },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmtDate = (t) => new Date(t).toLocaleDateString("uk-UA", { day: "numeric", month: "short" });

// Бічна панель: збережені цитати, закладки й словничок з пошуком, переходом і експортом.
export default function NotesPanel({ open, tab, setTab, book, state, focus, onClose, onGo, onRemove, onCopy }) {
  const [q, setQ] = useState("");
  const chTitle = (ch) => book.parts[ch]?.title || "";

  const items = useMemo(() => {
    const list = [...(state[tab] || [])].sort((a, b) => (a.ch - b.ch) || ((a.p ?? a.ranges?.[0]?.p ?? 0) - (b.p ?? b.ranges?.[0]?.p ?? 0)));
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((it) =>
      [it.text, it.term, it.def, it.snippet, chTitle(it.ch)].some((v) => v && v.toLowerCase().includes(needle))
    );
  }, [state, tab, q]);

  const exportTab = () => {
    const head = `# ${book.title}\n${book.authors}. ${book.imprint}\n\n`;
    if (tab === "quotes") {
      download(
        `цитати — ${book.short}.md`,
        head + "## Цитати\n\n" + items.map((it) => `> «${it.text}»\n\n— ${citation(book, it.page)}${it.note ? `\n\nНотатка: ${it.note}` : ""}\n`).join("\n")
      );
    } else if (tab === "words") {
      download(
        `словничок — ${book.short}.md`,
        head + "## Словничок\n\n" + items.map((it) => `- **${it.term}** — ${it.def || "…"}${it.page ? ` (с. ${it.page})` : ""}`).join("\n") + "\n"
      );
    }
  };

  const exportPdf = () => {
    const quotes = tab === "quotes";
    const body = items
      .map((it) => {
        const where = [chTitle(it.ch), it.page ? `с. ${it.page}` : ""].filter(Boolean).join(" · ");
        return quotes
          ? `<figure><blockquote>«${esc(it.text)}»</blockquote><figcaption>${esc(where)}</figcaption>${it.note ? `<p class="note">${esc(it.note)}</p>` : ""}</figure>`
          : `<div class="term"><dt>${esc(it.term)}</dt><dd>${esc(it.def || "—")}<small>${esc(where)}</small></dd></div>`;
      })
      .join("");
    printPdf(`${quotes ? "Цитати" : "Словничок"} — ${book.short}`, {
      kicker: quotes ? `Цитати · ${items.length}` : `Словничок · ${items.length}`,
      title: book.title,
      sub: `${book.authors.replace(/\.$/, "")}. ${book.imprint}`,
      body: quotes ? body : `<dl>${body}</dl>`,
      foot: quotes ? `Для посилання: ${citation(book, "N").replace(/С\. N\.$/, "С. [сторінка].")}` : "",
    });
  };

  return (
    <aside className={`rd-drawer rd-drawer--right${open ? " is-open" : ""}`} aria-hidden={!open} aria-label="Нотатки">
      <div className="rd-drawer__head">
        <strong>Нотатки</strong>
        <button className="rd-icon" onClick={onClose} aria-label="Закрити"><IconClose /></button>
      </div>
      <div className="rd-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "is-on" : ""} onClick={() => setTab(t.id)}>
            {t.label} <span>{(state[t.id] || []).length}</span>
          </button>
        ))}
      </div>
      <div className="rd-search">
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук у нотатках" aria-label="Пошук у нотатках" />
      </div>
      <div className="rd-notes">
        {!items.length && (
          <p className="rd-empty">
            {q ? "Нічого не знайдено." : tab === "quotes"
              ? "Виділіть фрагмент тексту й натисніть «Цитата», щоб зберегти його тут."
              : tab === "bookmarks"
              ? "Натисніть стрічку вгорі, щоб позначити місце, до якого хочете повернутися."
              : "Виділіть термін у тексті й натисніть «У словничок»."}
          </p>
        )}
        {items.map((it) => (
          <article key={it.id} className={`rd-note${focus === it.id ? " is-focus" : ""}`}>
            <div className="rd-note__meta">
              <span>{chTitle(it.ch)}</span>
              <span>{it.page ? `с. ${it.page}` : ""} · {fmtDate(it.at)}</span>
            </div>
            {tab === "quotes" && <blockquote>«{it.text}»</blockquote>}
            {tab === "bookmarks" && <p className="rd-note__snippet">{it.snippet}…</p>}
            {tab === "words" && (
              <p className="rd-note__word">
                <b>{it.term}</b> — {it.def || <i>без визначення</i>}
              </p>
            )}
            <div className="rd-note__actions">
              <button onClick={() => onGo(it)}>Перейти <IconArrow /></button>
              {tab === "quotes" && (
                <button onClick={() => onCopy(`«${it.text}» (${citation(book, it.page)})`)}>Копіювати <IconCopy /></button>
              )}
              <button className="is-danger" onClick={() => onRemove(tab, it.id)} aria-label="Видалити"><IconTrash /></button>
            </div>
          </article>
        ))}
      </div>
      {tab !== "bookmarks" && (
        <div className="rd-exports">
          <button className="rd-export" onClick={exportPdf} disabled={!items.length}>
            <IconDownload /> {tab === "quotes" ? "Цитати" : "Словничок"} у PDF
          </button>
          <button className="rd-export rd-export--ghost" onClick={exportTab} disabled={!items.length} aria-label="Експортувати в Markdown">
            .md
          </button>
        </div>
      )}
    </aside>
  );
}
