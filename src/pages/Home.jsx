import { lazy, Suspense, useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import PhotoBg from "../components/PhotoBg.jsx";
import { TLink } from "../components/Transition.jsx";
import { TOPICS, BOOKS, HERO_QUOTE, SOURCE_QUOTES } from "../data/course.js";
import { TOPIC_IMAGES, SECTION_IMAGES } from "../data/images.js";
import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// Хмара точок вантажиться окремо, щоб сторінка зʼявлялася одразу.
const ParticleBust = lazy(() => import("../components/ParticleBust.jsx"));

const SECTIONS = [
  {
    kind: "crossword",
    to: "/crossword",
    label: "Кросворд",
    text: "10 тем, по три рівні складності. Теорія з джерел, підказки й перевірка відповідей.",
    meta: "10 тем · 30 рівнів",
  },
  {
    kind: "books",
    to: "/books",
    label: "Книги",
    text: "Три підручники курсу в читалці: цитати, закладки та власний словничок.",
    meta: `${BOOKS.length} джерела`,
  },
  {
    kind: "slides",
    to: "/presentations",
    label: "Презентації",
    text: "Окрема презентація для кожної теми: слайд на кожен пункт плану. Перегляд і завантаження.",
    meta: `${TOPICS.length} презентацій`,
  },
];

const QUOTES = [
  { author: HERO_QUOTE.author, years: "бл. 470–399 до н. е.", text: HERO_QUOTE.text, source: HERO_QUOTE.source },
  ...SOURCE_QUOTES,
];

// Заливка рядка розділу заходить і виходить з того боку, де курсор перетнув край
const fromEdge = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.dataset.edge = e.clientY < r.top + r.height / 2 ? "top" : "bottom";
};

const pad = (n) => String(n).padStart(2, "0");

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// «Рукописне» проявлення: кожна літера відкривається зліва направо, як під пером.
function handwrite(el, vars = {}) {
  const split = SplitText.create(el, { type: "words,chars", charsClass: "hw-char" });
  gsap.set(split.chars, { clipPath: "inset(-100% 160% -100% -60%)" });
  return gsap.to(split.chars, {
    clipPath: "inset(-100% -60% -100% -60%)",
    ease: "none",
    stagger: 0.06,
    duration: 0.12,
    ...vars,
  });
}

export default function Home() {
  const root = useRef(null);
  const scatter = useRef(0);
  const [shape, setShape] = useState({ label: "Сократ", note: "бл. 470–399 до н. е." });
  const onShape = useCallback((s) => setShape(s), []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)", fine: "(hover: hover) and (pointer: fine)" },
        (ctx) => {
          const { motion, wide } = ctx.conditions;
          if (!motion) return;

          // 1. Головний екран
          const title = SplitText.create(".hero__title", { type: "words" });
          gsap
            .timeline({ defaults: { ease: "expo.out" } })
            .from(".hero__top > *", { y: 20, autoAlpha: 0, duration: 1, stagger: 0.08 })
            .from(title.words, { yPercent: 60, autoAlpha: 0, filter: "blur(10px)", duration: 1.4, stagger: 0.07 }, 0.15)
            .from(".hero__lead, .hero__cta", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.6)
            .from(".hero__caption", { autoAlpha: 0, y: 12, duration: 1 }, 1.4)
            .from(".hero-link", { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.1 }, 0.9);

          ScrollTrigger.create({
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => (scatter.current = self.progress),
          });
          gsap.to(".hero__text", {
            yPercent: -25,
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true },
          });

          // 2. Розділи: рядки виїжджають, превʼю-фото йде за курсором
          gsap.utils.toArray(".index__row").forEach((row) => {
            gsap.from(row.querySelectorAll(".index__num, .index__title, .index__text, .index__go"), {
              yPercent: 60,
              autoAlpha: 0,
              duration: 1.1,
              stagger: 0.06,
              ease: "expo.out",
              scrollTrigger: { trigger: row, start: "top 88%" },
            });
            gsap.from(row.querySelector(".index__line"), {
              scaleX: 0,
              duration: 1.4,
              ease: "expo.out",
              scrollTrigger: { trigger: row, start: "top 90%" },
            });
          });

          // 3. Біжучий рядок: швидкість і нахил залежать від швидкості скролу
          const tracks = gsap.utils.toArray(".marquee__track");
          const loops = tracks.map((t, i) =>
            i % 2
              ? gsap.fromTo(t, { xPercent: -50 }, { xPercent: 0, ease: "none", duration: 46, repeat: -1 })
              : gsap.to(t, { xPercent: -50, ease: "none", duration: 40, repeat: -1 })
          );
          const skew = gsap.quickTo(".marquee__inner", "skewX", { duration: 0.4, ease: "power3" });
          ScrollTrigger.create({
            trigger: ".marquee",
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              const v = self.getVelocity() / 300;
              loops.forEach((l) => l.timeScale(1 + Math.min(Math.abs(v), 6)));
              skew(gsap.utils.clamp(-8, 8, v * -1.2));
            },
          });

          // 4. Теми: горизонтальна стрічка
          if (wide) {
            const track = root.current.querySelector(".topics__track");
            const distance = () => track.scrollWidth - window.innerWidth + 80;
            const scroller = gsap.to(track, {
              x: () => -distance(),
              ease: "none",
              scrollTrigger: {
                trigger: ".topics",
                start: "top top",
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 0.8,
                invalidateOnRefresh: true,
                onUpdate: (self) => gsap.set(".topics__progress span", { scaleX: self.progress }),
              },
            });
            gsap.utils.toArray(".topic-card .photo-bg").forEach((img) => {
              gsap.fromTo(
                img,
                { xPercent: -8, scale: 1.2 },
                {
                  xPercent: 8,
                  ease: "none",
                  scrollTrigger: {
                    trigger: img.parentElement,
                    containerAnimation: scroller,
                    start: "left right",
                    end: "right left",
                    scrub: true,
                  },
                }
              );
            });
          } else {
            gsap.utils.toArray(".topic-card").forEach((card) => {
              gsap.from(card, {
                y: 50,
                autoAlpha: 0,
                duration: 0.9,
                ease: "expo.out",
                scrollTrigger: { trigger: card, start: "top 90%" },
              });
            });
          }

          // 5. Цитати пишуться синхронно зі скролом
          gsap.utils.toArray(".quote").forEach((q) => {
            gsap.from(q.querySelector(".quote__meta"), {
              y: 20,
              autoAlpha: 0,
              duration: 0.9,
              ease: "expo.out",
              scrollTrigger: { trigger: q, start: "top 80%" },
            });
            const pen = q.querySelector(".quote__pen path");
            const len = pen.getTotalLength();
            gsap.set(pen, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
            gsap
              .timeline({ scrollTrigger: { trigger: q, start: "top 72%", end: "bottom 50%", scrub: 0.5 } })
              .add(handwrite(q.querySelector(".quote__text")))
              .set(pen, { opacity: 1 })
              .to(pen, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" })
              .from(q.querySelector(".quote__source"), { autoAlpha: 0, y: 12, duration: 0.4 }, "<");
          });
        }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className="home">
      {/* Головний екран */}
      <section className="hero">
        <div className="hero__art">
          <Suspense fallback={<div className="particles" />}>
            <ParticleBust onShape={onShape} scatterRef={scatter} />
          </Suspense>
          <div className="hero__caption" aria-live="polite">
            <strong>{shape.label}</strong>
            <span>{shape.note}</span>
          </div>
        </div>

        <div className="container hero__inner">
          <div className="hero__text">
            <div className="hero__top">
              <span className="eyebrow">Творча робота · Магістратура</span>
            </div>
            <h1 className="hero__title">Філософія наукового пізнання</h1>
            <p className="hero__lead">
              Десять тем, три джерела й один шлях: від запитання «що таке наука?» до її місця в сучасному світі.
            </p>
            <a href="#sections" className="btn btn--solid hero__cta" onClick={(e) => {
              e.preventDefault();
              document.getElementById("sections")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Обрати розділ <Arrow />
            </a>
          </div>

          <nav className="hero__links" aria-label="Розділи творчої роботи">
            {SECTIONS.map((s, i) => (
              <TLink key={s.kind} to={s.to} label={s.label} className="hero-link">
                <span className="hero-link__num">{pad(i + 1)}</span>
                <span className="hero-link__label">{s.label}</span>
                <span className="hero-link__go"><Arrow /></span>
              </TLink>
            ))}
          </nav>
        </div>
      </section>

      {/* Розділи */}
      <section className="index" id="sections">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Розділи</span>
            <h2>Оберіть, з чого почати</h2>
          </div>
          <div className="index__list">
            {SECTIONS.map((s, i) => (
              <TLink key={s.kind} to={s.to} label={s.label} className="index__row" onPointerEnter={fromEdge} onPointerLeave={fromEdge}>
                <i className="index__line" aria-hidden="true" />
                <span className="index__num">{pad(i + 1)}</span>
                <span className="index__title">{s.label}</span>
                <span className="index__text">
                  {s.text}
                  <small>{s.meta}</small>
                </span>
                <span className="index__go"><Arrow /></span>
                <span className="index__thumb" aria-hidden="true">
                  <PhotoBg image={SECTION_IMAGES[s.kind]} />
                </span>
              </TLink>
            ))}
            <i className="index__line index__line--end" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Біжучий рядок тем */}
      <section className="marquee" aria-hidden="true">
        <div className="marquee__inner">
          {[0, 1].map((row) => (
            <div key={row} className={`marquee__track marquee__track--${row}`}>
              {[...TOPICS, ...TOPICS].map((t, i) => (
                <span key={i}>
                  {t.title}
                  <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Теми курсу */}
      <section className="topics" id="topics">
        <div className="topics__head container">
          <span className="eyebrow">Шлях курсу</span>
          <h2>Десять тем</h2>
          <div className="topics__progress" aria-hidden="true">
            <span />
          </div>
        </div>
        <div className="topics__viewport">
          <ol className="topics__track">
            {TOPICS.map((t) => (
              <li key={t.number} className="topic-card">
                <PhotoBg image={TOPIC_IMAGES[t.number]} />
                <span className="topic-card__num">{pad(t.number)}</span>
                <span className="topic-card__label">Тема {t.number}</span>
                <h3>{t.title}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Цитати */}
      <section className="quotes">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Голоси з джерел</span>
            <h2>Що кажуть підручники</h2>
          </div>
          {QUOTES.map((q, i) => (
            <figure key={q.author} className={`quote quote--${i % 2 ? "right" : "left"}`}>
              <div className="quote__meta">
                <span className="quote__num">{pad(i + 1)}</span>
                <strong>{q.author}</strong>
                <span>{q.years}</span>
              </div>
              <blockquote className="quote__text hw">«{q.text.replace(/\.$/, "")}»</blockquote>
              <svg className="quote__pen" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 10 C 60 4 120 14 180 8 S 270 6 298 9" />
              </svg>
              <figcaption className="quote__source">{q.source}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
