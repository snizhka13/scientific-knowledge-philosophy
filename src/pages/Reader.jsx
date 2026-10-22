import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import gsap from "gsap";
import { TLink } from "../components/Transition.jsx";
import ChapterText from "../components/reader/ChapterText.jsx";
import NotesPanel from "../components/reader/NotesPanel.jsx";
import TocDrawer from "../components/reader/TocDrawer.jsx";
import Settings, { FONT_FAMILY } from "../components/reader/Settings.jsx";
import WordDialog from "../components/reader/WordDialog.jsx";
import { IconBack, IconBookmark, IconClose, IconList, IconNotes, IconType, IconQuote, IconWord, IconCopy } from "../components/reader/icons.jsx";
import { clean, findDefinitions, selectionRanges, citation } from "../components/reader/text.js";
import { getBook, loadChapter, readerState, saveReaderState } from "../data/library.js";
import NotFound from "./NotFound.jsx";
import "../styles/reader.css";

const SETTINGS_KEY = "reader:settings";
const DEFAULTS = { theme: "light", font: "serif", size: typeof window !== "undefined" && window.innerWidth < 600 ? 17 : 19, leading: 1.75 };
const uid = () => Math.random().toString(36).slice(2, 10);
const BAR = 64;
const HINT_KEY = "reader:hint:";

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export default function Reader() {
  const { id, chapter } = useParams();
  const book = getBook(id);
  return book ? <ReaderView key={id} book={book} chapterParam={chapter} /> : <NotFound />;
}

function ReaderView({ book, chapterParam }) {
  const parts = book.parts;
  const total = useMemo(() => parts.reduce((n, c) => n + c.words, 0), [parts]);
  const before = useMemo(() => parts.map((_, i) => parts.slice(0, i).reduce((n, c) => n + c.words, 0)), [parts]);

  const [st, setSt] = useState(() => readerState(book.id));
  const fromParam = chapterParam != null && parts[+chapterParam] ? +chapterParam : null;
  const [ch, setCh] = useState(() => fromParam ?? st.pos?.ch ?? 0);
  const pending = useRef(fromParam != null ? 0 : st.pos?.p ?? 0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [cur, setCur] = useState(0);
  const [settings, setSettings] = useState(loadSettings);
  const [panel, setPanel] = useState(null); // toc | notes | settings
  const [tab, setTab] = useState("quotes");
  const [focus, setFocus] = useState(null);
  const [menu, setMenu] = useState(null);
  const [word, setWord] = useState(null);
  const [toast, setToast] = useState(null);
  const [hint, setHint] = useState(() => {
    try {
      return !localStorage.getItem(HINT_KEY + book.id);
    } catch {
      return true;
    }
  });
  const hintRef = useRef(null);
  const textRef = useRef(null);
  const barFill = useRef(null);
  const notesBtn = useRef(null);
  const stRef = useRef(st);
  stRef.current = st;

  // збереження
  useEffect(() => saveReaderState(book.id, st), [book.id, st]);
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* без збереження */
    }
  }, [settings]);
  useEffect(() => {
    document.documentElement.dataset.readerTheme = settings.theme;
    return () => delete document.documentElement.dataset.readerTheme;
  }, [settings.theme]);

  const notify = useCallback((text) => {
    setToast({ text, k: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // завантаження розділу
  useEffect(() => {
    let alive = true;
    setError(null);
    loadChapter(book.id, ch)
      .then((d) => alive && setData({ ch, ...d }))
      .catch((e) => alive && setError(e.message));
    // сусідній розділ підвантажуємо заздалегідь
    if (parts[ch + 1]) loadChapter(book.id, ch + 1).catch(() => {});
    return () => {
      alive = false;
    };
  }, [book.id, ch, parts, retry]);

  // після рендеру нового розділу: прокрутка до потрібного абзацу й поява тексту
  useLayoutEffect(() => {
    if (!data || data.ch !== ch) return;
    const p = pending.current ?? 0;
    pending.current = null;
    const el = textRef.current?.querySelector(`[data-i="${p}"]`);
    const top = p > 0 && el ? el.getBoundingClientRect().top + window.scrollY - BAR - 40 : 0;
    window.scrollTo(0, top);
    // загальний ScrollToTop може спрацювати пізніше, тож повторюємо в наступному кадрі
    const raf = requestAnimationFrame(() => window.scrollTo(0, top));
    setCur(p);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // попередній перехід міг сховати весь блок, тож повертаємо його перед анімацією дочірніх
    gsap.set(".rd-head", { clearProps: "opacity,visibility,transform" });
    if (!reduce) {
      gsap.fromTo(".rd-head > *", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: "expo.out" });
      gsap.fromTo(".rd-text", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", delay: 0.15 });
    }
    if (p > 0 && el) flash(el);
    return () => cancelAnimationFrame(raf);
  }, [data, ch]);

  // поточний абзац і прогрес під час прокрутки
  useEffect(() => {
    if (!data) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const root = textRef.current;
        if (!root) return;
        const x = root.getBoundingClientRect().left + 40;
        const hit = document.elementFromPoint(x, BAR + 60)?.closest?.("[data-i]");
        const atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 8;
        const p = atEnd ? data.paras.length - 1 : hit ? +hit.dataset.i : null;
        const doc = document.documentElement;
        const frac = Math.min(1, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight));
        if (barFill.current) barFill.current.style.transform = `scaleX(${(before[ch] + parts[ch].words * frac) / total})`;
        if (p == null) return;
        setCur((c) => (c === p ? c : p));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [data, ch, before, parts, total]);

  // коли змінюється поточний абзац, оновлюємо позицію та прогрес у сховищі
  useEffect(() => {
    if (!data || data.ch !== ch) return;
    const n = data.paras.length;
    const ratio = n > 1 ? cur / (n - 1) : 1;
    setSt((s) => {
      const read = { ...s.read, [ch]: Math.max(s.read?.[ch] || 0, ratio) };
      // прочитано = частка слів у дочитаних місцях усіх розділів, а не просто найдальша точка
      const progress = parts.reduce((sum, c, i) => sum + c.words * Math.min(1, read[i] || 0), 0) / total;
      return { ...s, pos: { ch, p: cur }, read, progress };
    });
  }, [cur, data, ch, parts, total]);

  const go = useCallback(
    (n, p = 0) => {
      if (!parts[n]) return;
      setPanel(null);
      setMenu(null);
      if (n === ch && data) {
        const el = textRef.current?.querySelector(`[data-i="${p}"]`);
        if (el) {
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - BAR - 40, behavior: "smooth" });
          flash(el);
        }
        return;
      }
      pending.current = p;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return setCh(n);
      gsap.to(".rd-head, .rd-text", { y: -20, autoAlpha: 0, duration: 0.3, ease: "power2.in", onComplete: () => setCh(n) });
    },
    [ch, data, parts]
  );

  // підказка про виділення: зникає після першого виділення або закриття
  const hideHint = useCallback(() => {
    try {
      localStorage.setItem(HINT_KEY + book.id, "1");
    } catch {
      /* без збереження */
    }
    const el = hintRef.current;
    if (!el) return setHint(false);
    gsap.to(el, { height: 0, marginBottom: 0, autoAlpha: 0, duration: 0.4, ease: "power2.inOut", onComplete: () => setHint(false) });
  }, [book.id]);
  useEffect(() => {
    if (menu && hint) hideHint();
  }, [menu, hint, hideHint]);

  // виділення тексту
  useEffect(() => {
    const check = () => {
      const sel = window.getSelection();
      const root = textRef.current;
      if (!sel || sel.isCollapsed || !root || !sel.rangeCount) return setMenu(null);
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return setMenu(null);
      const ranges = selectionRanges(root, range);
      const text = clean(sel.toString());
      if (!ranges.length || !text) return setMenu(null);
      const r = range.getBoundingClientRect();
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setMenu({
        text,
        ranges,
        x: Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150),
        y: touch ? r.bottom + 14 : r.top - 12,
        below: touch || r.top < BAR + 70,
        yBelow: r.bottom + 14,
      });
    };
    let t = 0;
    const later = () => {
      clearTimeout(t);
      t = setTimeout(check, 30);
    };
    const onSel = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setMenu(null);
    };
    document.addEventListener("pointerup", later);
    document.addEventListener("keyup", later);
    document.addEventListener("selectionchange", onSel);
    window.addEventListener("scroll", onSel, { passive: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerup", later);
      document.removeEventListener("keyup", later);
      document.removeEventListener("selectionchange", onSel);
      window.removeEventListener("scroll", onSel);
    };
  }, []);

  const pageOf = (p) => data?.paras[p]?.pg;

  const flyToNotes = (fromRect) => {
    const to = notesBtn.current?.getBoundingClientRect();
    if (!to || !fromRect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dot = document.createElement("i");
    dot.className = "rd-fly";
    document.body.append(dot);
    gsap.set(dot, { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 });
    gsap
      .timeline({ onComplete: () => dot.remove() })
      .to(dot, { x: to.left + to.width / 2, duration: 0.7, ease: "power2.inOut" })
      .to(dot, { y: to.top + to.height / 2, duration: 0.7, ease: "back.in(1.4)" }, 0)
      .to(dot, { scale: 0.3, autoAlpha: 0, duration: 0.2 })
      .fromTo(notesBtn.current, { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1 }, "-=0.2");
  };

  const saveQuote = () => {
    if (!menu) return;
    const rect = window.getSelection()?.getRangeAt(0)?.getBoundingClientRect();
    const q = { id: uid(), text: menu.text, ch, ranges: menu.ranges, page: pageOf(menu.ranges[0].p), at: Date.now() };
    setSt((s) => ({ ...s, quotes: [...s.quotes, q] }));
    window.getSelection()?.removeAllRanges();
    setMenu(null);
    flyToNotes(rect);
    notify("Цитату збережено");
  };

  const copySel = async () => {
    if (!menu) return;
    await copy(`«${menu.text}» (${citation(book, pageOf(menu.ranges[0].p))})`);
    setMenu(null);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Скопійовано з посиланням на сторінку");
    } catch {
      notify("Не вдалося скопіювати");
    }
  };

  const addWord = () => {
    if (!menu) return;
    const p = menu.ranges[0].p;
    setWord({ term: menu.text.slice(0, 80), ch, p, page: pageOf(p) });
    window.getSelection()?.removeAllRanges();
    setMenu(null);
  };

  const saveWord = ({ term, def }) => {
    const w = { id: uid(), term, def, ch: word.ch, p: word.p, page: word.page, at: Date.now() };
    setSt((s) => ({ ...s, words: [...s.words, w] }));
    setWord(null);
    flyToNotes(textRef.current?.querySelector(`[data-i="${w.p}"]`)?.getBoundingClientRect());
    notify(`«${term}» додано у словничок`);
  };

  const suggest = async (term) => {
    const all = await Promise.all(parts.map((_, i) => loadChapter(book.id, i)));
    return findDefinitions(term, all);
  };

  const bm = st.bookmarks.find((b) => b.ch === ch && b.p === cur);
  const toggleBookmark = () => {
    if (!data) return;
    if (bm) {
      setSt((s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.id !== bm.id) }));
      notify("Закладку прибрано");
    } else {
      const para = data.paras[cur];
      const b = { id: uid(), ch, p: cur, page: para?.pg, snippet: para?.t.slice(0, 120), at: Date.now() };
      setSt((s) => ({ ...s, bookmarks: [...s.bookmarks, b] }));
      notify(`Закладка: ${parts[ch].title}, с. ${para?.pg}`);
    }
  };

  const remove = (kind, rid) => setSt((s) => ({ ...s, [kind]: s[kind].filter((x) => x.id !== rid) }));

  const openNote = useCallback((qid) => {
    setTab("quotes");
    setFocus(qid);
    setPanel("notes");
  }, []);

  const goItem = (it) => go(it.ch, it.p ?? it.ranges?.[0]?.p ?? 0);

  // клавіатура
  useEffect(() => {
    const onKey = (e) => {
      if (word || e.target.closest?.("input, textarea")) return;
      if (e.key === "Escape") {
        setPanel(null);
        setMenu(null);
      }
      if (e.key === "ArrowRight" && e.altKey) go(ch + 1);
      if (e.key === "ArrowLeft" && e.altKey) go(ch - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ch, go, word]);

  const marks = useMemo(() => {
    const m = new Map();
    st.quotes.filter((q) => q.ch === ch).forEach((q) =>
      q.ranges.forEach((r) => {
        if (!m.has(r.p)) m.set(r.p, []);
        m.get(r.p).push({ s: r.s, e: r.e, q: q.id });
      })
    );
    return m;
  }, [st.quotes, ch]);
  const bookmarks = useMemo(() => new Set(st.bookmarks.filter((b) => b.ch === ch).map((b) => b.p)), [st.bookmarks, ch]);

  const n = data?.paras.length || 1;
  const left = Math.max(0, Math.round((parts[ch].words * (1 - cur / Math.max(1, n - 1))) / 200));
  const notesCount = st.quotes.length + st.bookmarks.length + st.words.length;
  const style = {
    "--rd-size": `${settings.size}px`,
    "--rd-leading": settings.leading,
    "--rd-font": FONT_FAMILY[settings.font],
  };

  return (
    <div className={`rd rd--${settings.theme}`} style={style}>
      <header className="rd-bar">
        <div className="rd-bar__left">
          <TLink to="/books" label="Книги" className="rd-icon" aria-label="До книжок"><IconBack /></TLink>
          <button className="rd-icon" onClick={() => setPanel(panel === "toc" ? null : "toc")} aria-label="Зміст" aria-expanded={panel === "toc"}>
            <IconList />
          </button>
          <div className="rd-bar__title">
            <span>{book.short}</span>
            <strong>{parts[ch].title}</strong>
          </div>
        </div>
        <div className="rd-bar__right">
          <span className="rd-bar__stat">
            {Math.round((st.progress || 0) * 100)}% · ≈ {left} хв до кінця розділу
          </span>
          <button className={`rd-icon${bm ? " is-on" : ""}`} onClick={toggleBookmark} aria-label={bm ? "Прибрати закладку" : "Поставити закладку"} aria-pressed={!!bm}>
            <IconBookmark on={!!bm} />
          </button>
          <button className="rd-icon" onClick={() => setPanel(panel === "settings" ? null : "settings")} aria-label="Налаштування тексту" aria-expanded={panel === "settings"}>
            <IconType />
          </button>
          <button ref={notesBtn} className="rd-icon rd-icon--badge" onClick={() => { setFocus(null); setPanel(panel === "notes" ? null : "notes"); }} aria-label="Нотатки" aria-expanded={panel === "notes"}>
            <IconNotes />
            {notesCount > 0 && <span>{notesCount}</span>}
          </button>
        </div>
        <i className="rd-bar__progress"><i ref={barFill} /></i>
        <Settings open={panel === "settings"} s={settings} set={(v) => setSettings((s) => ({ ...s, ...v }))} />
      </header>

      <main className="rd-main">
        <div className="rd-head">
          <span className="rd-head__eyebrow">
            {ch === 0 ? parts[0].title : `${book.partsLabel === "лекцій" ? "Лекція" : book.partsLabel === "глав" ? "Глава" : "Розділ"} ${ch} / ${parts.length - 1}`}
            {" · "}с. {parts[ch].page}
          </span>
          <h1>{parts[ch].title}</h1>
          <span className="rd-head__meta">≈ {Math.max(1, Math.round(parts[ch].words / 200))} хв читання · {parts[ch].words.toLocaleString("uk-UA")} слів</span>
        </div>

        {hint && ch === 0 && data && (
          <aside ref={hintRef} className="rd-tip">
            <IconQuote />
            <p>
              <strong>Текст можна виділяти.</strong> Виділіть фрагмент, щоб зберегти його як цитату, додати термін у словничок або скопіювати з посиланням на сторінку.
            </p>
            <button className="rd-icon" onClick={hideHint} aria-label="Закрити підказку"><IconClose /></button>
          </aside>
        )}

        {error && (
          <div className="rd-error">
            <p>{error}</p>
            <button className="btn" onClick={() => setRetry((r) => r + 1)}>Спробувати ще раз</button>
          </div>
        )}
        {!data && !error && <div className="rd-loading" aria-live="polite">Відкриваємо розділ…</div>}

        <article ref={textRef} className="rd-text" lang="uk">
          {data && data.ch === ch && <ChapterText paras={data.paras} marks={marks} bookmarks={bookmarks} onMark={openNote} />}
        </article>

        {data && (
          <nav className="rd-next" aria-label="Інші розділи">
            {parts[ch - 1] && (
              <button className="rd-next__card rd-next__card--prev" onClick={() => go(ch - 1)}>
                <span>← Попередній</span>
                <strong>{parts[ch - 1].title}</strong>
              </button>
            )}
            {parts[ch + 1] ? (
              <button className="rd-next__card" onClick={() => go(ch + 1)}>
                <span>Наступний →</span>
                <strong>{parts[ch + 1].title}</strong>
                <small>≈ {Math.max(1, Math.round(parts[ch + 1].words / 200))} хв · с. {parts[ch + 1].page}</small>
              </button>
            ) : (
              <TLink to="/books" label="Книги" className="rd-next__card">
                <span>Кінець книжки</span>
                <strong>Повернутися до бібліотеки</strong>
              </TLink>
            )}
          </nav>
        )}
      </main>

      {menu && (
        <div className={`rd-menu${menu.below ? " is-below" : ""}`} style={{ left: menu.x, top: menu.below ? menu.yBelow : menu.y }} onPointerDown={(e) => e.preventDefault()}>
          <button onClick={saveQuote}><IconQuote /> Цитата</button>
          <button onClick={addWord}><IconWord /> У словничок</button>
          <button onClick={copySel}><IconCopy /> Копіювати</button>
        </div>
      )}

      <div className={`rd-scrim${panel === "toc" || panel === "notes" ? " is-on" : ""}`} onClick={() => setPanel(null)} />
      <TocDrawer open={panel === "toc"} book={book} current={ch} read={st.read || {}} onClose={() => setPanel(null)} onPick={(k) => go(k)} />
      <NotesPanel
        open={panel === "notes"}
        tab={tab}
        setTab={setTab}
        book={book}
        state={st}
        focus={focus}
        onClose={() => setPanel(null)}
        onGo={goItem}
        onRemove={remove}
        onCopy={copy}
      />
      {word && <WordDialog draft={word} onClose={() => setWord(null)} onSave={saveWord} suggest={suggest} />}
      {toast && <div key={toast.k} className="rd-toast" role="status">{toast.text}</div>}
    </div>
  );
}

function flash(el) {
  el.classList.remove("is-flash");
  void el.offsetWidth;
  el.classList.add("is-flash");
}
