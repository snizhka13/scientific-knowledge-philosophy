import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import Book3D from "../components/Book3D.jsx";
import BookSpread from "../components/BookSpread.jsx";
import { usePageTransition } from "../components/Transition.jsx";
import { LIBRARY, readerState } from "../data/library.js";
import { HERO_QUOTE, SOURCE_QUOTES } from "../data/course.js";
import "../styles/books.css";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);

const pad = (n) => String(n).padStart(2, "0");
const fmt = (n) => Math.round(n).toLocaleString("uk-UA");
const CYR = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя    ";

// Цитати для «Гортати навмання»: усі дослівно з трьох джерел.
const POOL = [
  ...LIBRARY.map((b) => ({ text: b.annotation.text, source: `${b.short}, с. ${b.annotation.page}` })),
  ...SOURCE_QUOTES.map((q) => ({ text: `«${q.text}»`, author: q.author, source: q.source })),
  { text: `«${HERO_QUOTE.text}»`, author: HERO_QUOTE.author, source: HERO_QUOTE.source },
  { text: "За висловом Ф. Бекона, факт є живленням науки.", source: "Ханстантинов, 2021, с. 89" },
];

const TOTAL = {
  pages: LIBRARY.reduce((n, b) => n + b.pages, 0),
  words: LIBRARY.reduce((n, b) => n + b.words, 0),
  chapters: LIBRARY.reduce((n, b) => n + b.chapters, 0),
};

export default function Books() {
  const root = useRef(null);
  const books = useRef([]);
  const go = usePageTransition();
  const states = useMemo(() => Object.fromEntries(LIBRARY.map((b) => [b.id, readerState(b.id)])), []);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState(0);
  const quoteEl = useRef(null);
  const busy = useRef(false);
  const opening = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", fine: "(hover: hover) and (pointer: fine)" },
        (ctx) => {
          const { motion, fine } = ctx.conditions;
          gsap.set(".lib-item__tilt", { rotationY: -26, rotationX: 6 });
          gsap.set(".shelf__tilt", { rotationY: 20, rotationX: 4 });
          if (!motion) return;

          // 1. Заголовок і полиця
          const split = SplitText.create(".lib-hero h1", { type: "words,chars", mask: "lines" });
          gsap.from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.025, ease: "expo.out", delay: 0.2 });
          gsap.from(".lib-hero__lead, .lib-hero .eyebrow, .lib-facts > div", {
            y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "expo.out", delay: 0.4,
          });
          gsap.from(".shelf__book", {
            y: -260, rotation: (i) => [-14, 8, -6][i], autoAlpha: 0, duration: 1.3, stagger: 0.14, ease: "bounce.out", delay: 0.5,
          });
          gsap.from(".shelf__plank", { scaleX: 0, duration: 1.2, ease: "expo.out", delay: 0.3 });
          // лічильники
          gsap.utils.toArray(".lib-facts b").forEach((el) => {
            const v = +el.dataset.v;
            const o = { n: 0 };
            gsap.to(o, { n: v, duration: 2, ease: "power3.out", delay: 0.6, onUpdate: () => (el.textContent = fmt(o.n)) });
          });
          // книжки на полиці розвертаються корінцями під час скролу
          gsap.to(".shelf__tilt", {
            rotationY: 80, ease: "none", stagger: 0.04,
            scrollTrigger: { trigger: ".lib-hero", start: "center center", end: "bottom top", scrub: 0.6 },
          });

          // 2. Книги: виїжджають і розгортаються
          gsap.utils.toArray(".lib-item").forEach((item) => {
            const tilt = item.querySelector(".lib-item__tilt");
            gsap.from(tilt, {
              rotationY: -95, y: 60, autoAlpha: 0, duration: 1.4, ease: "expo.out",
              scrollTrigger: { trigger: item, start: "top 75%" },
            });
            gsap.from(item.querySelectorAll(".lib-item__body > *"), {
              y: 40, autoAlpha: 0, duration: 1, stagger: 0.07, ease: "expo.out",
              scrollTrigger: { trigger: item, start: "top 70%" },
            });
            item.querySelectorAll(".lib-stats b").forEach((el) => {
              const v = +el.dataset.v;
              const o = { n: 0 };
              gsap.to(o, {
                n: v, duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = fmt(o.n)),
                scrollTrigger: { trigger: item, start: "top 65%" },
              });
            });
            gsap.from(item.querySelector(".lib-progress__bar span"), {
              scaleX: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: item, start: "top 60%" },
            });
            // на тачскрінах обкладинка прочиняється сама, коли книжка в кадрі
            if (!fine) {
              ScrollTrigger.create({
                trigger: item, start: "top 55%", end: "bottom 30%",
                toggleClass: { targets: item, className: "is-peek" },
              });
            }
            // нахил за курсором
            if (fine) {
              const stage = item.querySelector(".lib-item__stage");
              const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.8, ease: "power3" });
              const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.8, ease: "power3" });
              const move = (e) => {
                if (opening.current) return;
                const r = stage.getBoundingClientRect();
                const dx = (e.clientX - r.left) / r.width - 0.5;
                const dy = (e.clientY - r.top) / r.height - 0.5;
                ry(-20 + dx * 30);
                rx(6 - dy * 14);
              };
              const leave = () => { if (!opening.current) { ry(-26); rx(6); } };
              stage.addEventListener("pointermove", move);
              stage.addEventListener("pointerleave", leave);
              ctx.add(() => () => {
                stage.removeEventListener("pointermove", move);
                stage.removeEventListener("pointerleave", leave);
              });
            }
          });

          // 3. Цитата навмання
          gsap.from(".lucky__inner > *", {
            y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "expo.out",
            scrollTrigger: { trigger: ".lucky", start: "top 70%" },
          });
        }
      );
    },
    { scope: root }
  );

  // Відкриття книжки: вона розвертається до нас, обкладинка розкривається, далі перехід у читалку.
  const openBook = (i) => {
    const b = LIBRARY[i];
    const to = `/books/${b.id}`;
    const el = books.current[i];
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go(to, b.title);
    if (opening.current) return;
    opening.current = true;
    // Обкладинка продовжує рух від поточного кута (наприклад, прочинена при наведенні),
    // тож замість CSS-повороту далі керує лише GSAP, і шарнір лишається на корінці.
    const cover = el.querySelector(".book3d__cover");
    const m = /(-?[\d.]+)deg/.exec(getComputedStyle(cover).rotate || "");
    const from = m ? parseFloat(m[1]) : 0;
    cover.style.transition = "none";
    cover.style.rotate = "none";
    gsap.set(cover, { rotationY: from });
    gsap
      .timeline({ defaults: { overwrite: true } })
      .to(el.parentElement, { rotationY: 0, rotationX: 0, scale: 1.12, duration: 0.8, ease: "power3.inOut" })
      .to(cover, { rotationY: -170, duration: 1, ease: "power2.inOut" }, 0.1)
      .add(() => go(to, b.title), "-=0.35");
  };

  const shuffle = () => {
    if (busy.current) return;
    busy.current = true;
    let n = q;
    while (n === q) n = Math.floor(Math.random() * POOL.length);
    setQ(n);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(quoteEl.current, {
      duration: reduce ? 0 : 1.1,
      scrambleText: { text: POOL[n].text, chars: CYR, speed: 0.7, revealDelay: 0.2 },
      ease: "none",
      onComplete: () => (busy.current = false),
    });
  };

  const scrollToBook = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div ref={root} className="lib">
      <section className="lib-hero">
        <div className="container lib-hero__inner">
          <div className="lib-hero__text">
            <span className="eyebrow">Розділ 02</span>
            <h1>Бібліотека джерел</h1>
            <p className="lib-hero__lead">
              Оберіть книжку, щоб читати, зберігати цитати, ставити закладки й
              збирати власний словничок.
            </p>
            <div className="lib-facts">
              <div><b data-v={TOTAL.pages}>{fmt(TOTAL.pages)}</b><span>сторінок</span></div>
              <div><b data-v={TOTAL.words}>{fmt(TOTAL.words)}</b><span>слів</span></div>
              <div><b data-v={TOTAL.chapters}>{TOTAL.chapters}</b><span>розділів і лекцій</span></div>
            </div>
          </div>
          <div className="shelf" aria-label="Полиця з книжками">
            <div className="shelf__books">
              {LIBRARY.map((b) => (
                <button key={b.id} className="shelf__book" onClick={() => scrollToBook(b.id)} aria-label={b.title}>
                  <span className="shelf__tilt"><Book3D book={b} size="sm" /></span>
                </button>
              ))}
            </div>
            <i className="shelf__plank" aria-hidden="true" />
          </div>
        </div>
      </section>

      {LIBRARY.map((b, i) => {
        const s = states[b.id];
        const started = s.progress > 0;
        return (
          <article key={b.id} id={b.id} className={`lib-item lib-item--${i % 2 ? "rev" : "fwd"}`}>
            <div className="container lib-item__inner">
              <div className="lib-item__stage" onClick={() => openBook(i)} data-cursor>
                <div className="lib-item__tilt">
                  <Book3D ref={(el) => (books.current[i] = el)} book={b} size="lg" />
                </div>
                <span className="lib-item__shadow" aria-hidden="true" />
              </div>
              <div className="lib-item__body">
                <span className="lib-item__num">{pad(i + 1)} / {pad(LIBRARY.length)}</span>
                <h2>{b.title}</h2>
                <p className="lib-item__authors">{b.authors}<br /><span>{b.imprint}</span></p>
                <blockquote className="lib-item__quote">
                  <p>{b.annotation.text}</p>
                  <cite>с. {b.annotation.page}</cite>
                </blockquote>
                <dl className="lib-stats">
                  <div><dt>сторінок</dt><dd><b data-v={b.pages}>{fmt(b.pages)}</b></dd></div>
                  <div><dt>слів</dt><dd><b data-v={b.words}>{fmt(b.words)}</b></dd></div>
                  <div><dt>{b.partsLabel}</dt><dd><b data-v={b.chapters}>{b.chapters}</b></dd></div>
                  <div><dt>годин читання</dt><dd>≈ <b data-v={b.hours}>{b.hours}</b></dd></div>
                </dl>
                <div className="lib-progress">
                  <div className="lib-progress__bar"><span style={{ width: `${Math.max(2, s.progress * 100)}%` }} /></div>
                  <div className="lib-progress__meta">
                    <span>Прочитано {Math.round(s.progress * 100)}%</span>
                    <span>Цитат: {s.quotes.length}</span>
                    <span>Закладок: {s.bookmarks.length}</span>
                    <span>У словничку: {s.words.length}</span>
                  </div>
                </div>
                <div className="lib-item__actions">
                  <button className="btn btn--solid" onClick={() => openBook(i)}>
                    {started ? "Продовжити читання" : "Читати"} <span aria-hidden="true">→</span>
                  </button>
                  <button className="btn" onClick={() => setOpen(b.id)}>
                    Зміст <span className="lib-plus" aria-hidden="true">+</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {open && (
        <BookSpread
          book={LIBRARY.find((b) => b.id === open)}
          onClose={() => setOpen(null)}
          onRead={(ch) => {
            const b = LIBRARY.find((x) => x.id === open);
            go(`/books/${b.id}/${ch + 1}`, b.title);
            setTimeout(() => setOpen(null), 700);
          }}
        />
      )}

      <section className="lucky">
        <div className="container lucky__inner">
          <span className="eyebrow">Гортати навмання</span>
          <p className="lucky__quote" ref={quoteEl} aria-live="polite">{POOL[0].text}</p>
          <div className="lucky__foot">
            <span className="lucky__src">{POOL[q].author ? `${POOL[q].author} · ` : ""}{POOL[q].source}</span>
            <button className="btn lucky__btn" onClick={shuffle}>
              Інша цитата <span aria-hidden="true">↻</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
