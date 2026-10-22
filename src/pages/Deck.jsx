import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { TLink } from "../components/Transition.jsx";
import Slide from "../components/slides/Slide.jsx";
import { deckFile, deckSlides, getDeck } from "../data/slides.js";
import NotFound from "./NotFound.jsx";
import "../styles/slides.css";
import "../styles/deck.css";

export const POS_KEY = "slides:pos";
const pad = (n) => String(n).padStart(2, "0");

export function savedPos() {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function Deck() {
  const { n, s } = useParams();
  const deck = getDeck(n);
  if (!deck) return <NotFound />;
  if (s === "print") return <PrintDeck deck={deck} />;
  return <DeckView key={deck.number} deck={deck} param={s} />;
}

// Усі слайди підряд, сторінка на слайд: з цієї версії генерується PDF.
function PrintDeck({ deck }) {
  const slides = deckSlides(deck);
  useEffect(() => {
    document.documentElement.classList.add("is-print-deck");
    return () => document.documentElement.classList.remove("is-print-deck");
  }, []);
  return (
    <div className="print-deck">
      {slides.map((sl, i) => (
        <Slide key={i} deck={deck} slide={sl} index={i} total={slides.length} />
      ))}
    </div>
  );
}

function DeckView({ deck, param }) {
  const navigate = useNavigate();
  const slides = deckSlides(deck);
  const total = slides.length;
  const clamp = (i) => Math.min(Math.max(i, 0), total - 1);
  const [i, setI] = useState(() => clamp((+param || savedPos()[deck.number] || 1) - 1));
  const [u, setU] = useState(0);
  const [flow, setFlow] = useState(false);
  const [grid, setGrid] = useState(false);
  const [full, setFull] = useState(false);
  const stage = useRef(null);
  const wrap = useRef(null);
  const dir = useRef(1);
  const busy = useRef(false);
  const first = useRef(true);

  // масштаб слайда під вікно; на вузькому портретному екрані слайд перекомпоновується
  useLayoutEffect(() => {
    const fit = () => {
      const el = wrap.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const narrow = w < 700 && h > w;
      setFlow(narrow);
      setU(narrow ? 0 : Math.min(w / 1600, h / 900));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  // адреса й позиція
  useEffect(() => {
    navigate(`/presentations/${deck.number}/${i + 1}`, { replace: true });
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ ...savedPos(), [deck.number]: i + 1 }));
    } catch {
      /* без збереження */
    }
  }, [i, deck.number, navigate]);

  // поява слайда
  useLayoutEffect(() => {
    const el = stage.current?.firstElementChild;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (flow) stage.current.scrollTop = 0;
    const d = dir.current;
    const parts = el.querySelectorAll(
      ".sl__top, .sl__kicker, .sl__title, .sl__lead, .sl-cards__card, .sl-steps li, .sl-compare__col, .sl__quote, .sl__foot, .sl-terms > div, .sl-sources, .sl-cover__text > *, .sl-cover__plan li"
    );
    const tl = gsap.timeline({ onComplete: () => (busy.current = false) });
    tl.fromTo(el, { x: first.current ? 0 : d * 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.55, ease: "expo.out" });
    tl.fromTo(parts, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.045, ease: "expo.out" }, 0.08);
    const img = el.querySelector(".sl-cover__img");
    if (img) tl.fromTo(img, { scale: 1.12, clipPath: "inset(0 0 0 100%)" }, { scale: 1, clipPath: "inset(0 0 0 0%)", duration: 1.2, ease: "expo.inOut" }, 0);
    first.current = false;
    return () => {
      tl.kill();
      busy.current = false;
    };
  }, [i, flow]);

  const go = useCallback(
    (to) => {
      const next = clamp(to);
      if (next === i || busy.current) return;
      busy.current = true;
      dir.current = next > i ? 1 : -1;
      setGrid(false);
      const el = stage.current?.firstElementChild;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        busy.current = false;
        return setI(next);
      }
      gsap.to(el, { x: -dir.current * 60, autoAlpha: 0, duration: 0.28, ease: "power2.in", onComplete: () => setI(next) });
    },
    [i, total]
  );

  const toggleFull = useCallback(() => {
    const root = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (root.requestFullscreen || root.webkitRequestFullscreen)?.call(root);
  }, []);
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // клавіатура
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (["ArrowRight", "PageDown", " "].includes(k)) go(i + 1);
      else if (["ArrowLeft", "PageUp"].includes(k)) go(i - 1);
      else if (k === "Home") go(0);
      else if (k === "End") go(total - 1);
      else if (k === "f" || k === "F" || k === "а" || k === "А") toggleFull();
      else if (k === "g" || k === "G" || k === "п" || k === "П") setGrid((v) => !v);
      else if (k === "Escape") setGrid(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, i, total, toggleFull]);

  // свайп
  const touch = useRef(null);
  const onPointerDown = (e) => (touch.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(i + (dx < 0 ? 1 : -1));
  };

  const pct = ((i + 1) / total) * 100;

  return (
    <div className={`deck${flow ? " is-flow" : ""}${full ? " is-full" : ""}`}>
      <header className="deck-bar">
        <TLink to="/presentations" label="Презентації" className="deck-icon" aria-label="До всіх презентацій">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
        </TLink>
        <div className="deck-bar__title">
          <span>Тема {pad(deck.number)}</span>
          <strong>{deck.title}</strong>
        </div>
        <div className="deck-bar__right">
          <button className={`deck-icon${grid ? " is-on" : ""}`} onClick={() => setGrid((v) => !v)} aria-label="Усі слайди (G)" title="Усі слайди (G)">
            <svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
          </button>
          <a className="deck-icon" href={deckFile(deck, "pdf")} download aria-label="Завантажити PDF" title="Завантажити PDF">
            <svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
          </a>
          <button className="deck-icon deck-icon--full" onClick={toggleFull} aria-label="Повний екран (F)" title="Повний екран (F)">
            {full ? (
              <svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            )}
          </button>
        </div>
      </header>

      <div ref={wrap} className="deck-wrap" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div ref={stage} className="deck-stage" style={u ? { "--u": `${u}px` } : undefined}>
          {(u > 0 || flow) && <Slide key={i} deck={deck} slide={slides[i]} index={i} total={total} />}
        </div>
      </div>

      <footer className="deck-nav">
        <button className="deck-icon" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Попередній слайд">
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="deck-progress" role="tablist" aria-label="Слайди">
          {slides.map((_, k) => (
            <button key={k} className={k <= i ? "is-done" : ""} onClick={() => go(k)} aria-label={`Слайд ${k + 1}`} aria-current={k === i} />
          ))}
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="deck-count">
          {pad(i + 1)} <small>/ {pad(total)}</small>
        </span>
        <button className="deck-icon deck-icon--next" onClick={() => go(i + 1)} disabled={i === total - 1} aria-label="Наступний слайд">
          <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </footer>

      <div className={`deck-grid${grid ? " is-open" : ""}`} aria-hidden={!grid}>
        <div className="deck-grid__inner">
          {slides.map((sl, k) => (
            <button key={k} className={`deck-thumb${k === i ? " is-current" : ""}`} onClick={() => go(k)} tabIndex={grid ? 0 : -1}>
              <span className="deck-thumb__frame">
                <Slide deck={deck} slide={sl} index={k} total={total} />
              </span>
              <span className="deck-thumb__label">
                {pad(k + 1)} · {sl.type === "cover" ? "Обкладинка" : sl.type === "summary" ? "Ключові поняття" : sl.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
