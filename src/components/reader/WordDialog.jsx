import { useEffect, useRef, useState } from "react";
import { IconClose, IconSpark } from "./icons.jsx";

// Додавання терміна у словничок: визначення можна вписати самостійно або підтягнути з тексту книжки.
export default function WordDialog({ draft, onClose, onSave, suggest }) {
  const [term, setTerm] = useState(draft.term);
  const [def, setDef] = useState(draft.def || "");
  const [hints, setHints] = useState(null);
  const [busy, setBusy] = useState(false);
  const area = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const lookup = async () => {
    setBusy(true);
    try {
      setHints(await suggest(term));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rd-modal" role="dialog" aria-modal="true" aria-label="Додати у словничок">
      <div className="rd-modal__bg" onClick={onClose} />
      <form
        className="rd-modal__card"
        onSubmit={(e) => {
          e.preventDefault();
          if (term.trim()) onSave({ term: term.trim(), def: def.trim() });
        }}
      >
        <div className="rd-modal__head">
          <strong>У словничок</strong>
          <button type="button" className="rd-icon" onClick={onClose} aria-label="Закрити"><IconClose /></button>
        </div>
        <label className="rd-field">
          <span>Термін</span>
          <input value={term} onChange={(e) => setTerm(e.target.value)} autoFocus />
        </label>
        <label className="rd-field">
          <span>Визначення</span>
          <textarea ref={area} rows="4" value={def} onChange={(e) => setDef(e.target.value)} placeholder="Своїми словами або з тексту джерела" />
        </label>
        <button type="button" className="rd-hint-btn" onClick={lookup} disabled={busy || !term.trim()}>
          <IconSpark /> {busy ? "Шукаю у книжці…" : "Знайти визначення в книжці"}
        </button>
        {hints && (
          <div className="rd-hints">
            {!hints.length && <p className="rd-empty">У тексті не знайшлося речень із цим терміном.</p>}
            {hints.map((h, k) => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  setDef(`${h.text} (с. ${h.page})`);
                  area.current?.focus();
                }}
              >
                <span>{h.text}</span>
                <small>с. {h.page} · підставити</small>
              </button>
            ))}
          </div>
        )}
        <div className="rd-modal__foot">
          <button type="button" className="btn" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn--solid">Зберегти</button>
        </div>
      </form>
    </div>
  );
}
