import { useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { TLink } from "../components/Transition.jsx";
import { DECKS, deckFile, deckSlides } from "../data/slides.js";
import { TOPIC_IMAGES } from "../data/images.js";
import { savedPos } from "./Deck.jsx";
import Slide from "../components/slides/Slide.jsx";
import "../styles/slides.css";
import "../styles/presentations.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const pad = (n) => String(n).padStart(2, "0");

// Віяло зі справжніх слайдів у першому екрані
const FAN = (() => {
  const d = DECKS[8];
  const all = deckSlides(d);
  return [all.length - 1, 3, 0].map((i) => ({ deck: d, slide: all[i], index: i, total: all.length }));
})();

const TOTAL = {
  slides: DECKS.reduce((n, d) => n + deckSlides(d).length, 0),
  quotes: DECKS.reduce((n, d) => n + d.slides.filter((s) => s.quote).length, 0),
  terms: DECKS.reduce((n, d) => n + d.terms.length, 0),
};

export default function Presentations() {
  const root = useRef(null);
  const pos = useMemo(savedPos, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".pr-hero__title", { type: "words,chars", mask: "lines" });
        gsap.from(split.chars, { yPercent: 110, duration: 1.1, stagger: 0.022, ease: "expo.out", delay: 0.2 });
        gsap.from(".pr-hero .eyebrow, .pr-hero__lead, .pr-facts > div, .pr-keys", {
          y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "expo.out", delay: 0.4,
        });
        gsap.utils.toArray(".pr-facts b").forEach((el) => {
          const o = { n: 0 };
          gsap.to(o, { n: +el.dataset.v, duration: 1.8, ease: "power3.out", delay: 0.6, onUpdate: () => (el.textContent = Math.round(o.n)) });
        });
        gsap.from(".pr-fan__card", {
          y: 180, rotation: (i) => [-14, 10, -4][i], autoAlpha: 0, duration: 1.4, stagger: 0.12, ease: "expo.out", delay: 0.35,
        });
        gsap.to(".pr-fan", {
          yPercent: -18, ease: "none",
          scrollTrigger: { trigger: ".pr-hero", start: "top top", end: "bottom top", scrub: 0.6 },
        });
        gsap.set(".pr-card", { autoAlpha: 0 });
        ScrollTrigger.batch(".pr-card", {
          start: "top 88%",
          once: true,
          onEnter: (els) =>
            gsap.fromTo(els, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.09, ease: "expo.out", overwrite: true }),
        });
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="pr">
      <section className="pr-hero container">
        <div className="pr-fan" aria-hidden="true">
          {FAN.map((f, k) => (
            <div key={k} className={`pr-fan__card pr-fan__card--${k + 1}`}>
              <Slide deck={f.deck} slide={f.slide} index={f.index} total={f.total} />
            </div>
          ))}
        </div>
        <span className="eyebrow">Презентації</span>
        <h1 className="pr-hero__title">
          10 тем – 10
          <br />
          презентацій
        </h1>
        <p className="pr-hero__lead">
          На кожну тему: обкладинка з планом, слайд на кожен пункт плану й підсумок із ключовими поняттями. Зміст узято з трьох джерел курсу,
          цитати наведено дослівно зі сторінками.
        </p>
        <div className="pr-facts">
          <div><b data-v={DECKS.length}>{DECKS.length}</b><span>презентацій</span></div>
          <div><b data-v={TOTAL.slides}>{TOTAL.slides}</b><span>слайдів</span></div>
          <div><b data-v={TOTAL.quotes}>{TOTAL.quotes}</b><span>цитат зі сторінками</span></div>
          <div><b data-v={TOTAL.terms}>{TOTAL.terms}</b><span>ключових понять</span></div>
        </div>
        <p className="pr-keys">
          <kbd>←</kbd> <kbd>→</kbd> гортати · <kbd>F</kbd> повний екран · <kbd>G</kbd> усі слайди · на телефоні свайп
        </p>
      </section>

      <section className="pr-grid container">
        {DECKS.map((d) => {
          const img = TOPIC_IMAGES[d.number];
          const count = deckSlides(d).length;
          const at = pos[d.number];
          const to = `/presentations/${d.number}`;
          return (
            <article key={d.number} className="pr-card">
              <TLink to={to} label={`Тема ${d.number}`} className="pr-card__stack" aria-label={`Дивитися презентацію: ${d.title}`}>
                <span className="pr-card__sheet pr-card__sheet--2" />
                <span className="pr-card__sheet pr-card__sheet--1" />
                <span className="pr-card__cover">
                  <span className="pr-card__img" style={{ backgroundImage: `url(${img.src})`, backgroundPosition: img.position }} />
                  <span className="pr-card__num">{pad(d.number)}</span>
                  <span className="pr-card__play">
                    <svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" /></svg>
                  </span>
                </span>
              </TLink>
              <div className="pr-card__body">
                <span className="pr-card__meta">
                  {count} слайдів · {d.plan.length} {d.plan.length < 5 ? "пункти" : "пунктів"} плану{at > 1 ? ` · зупинились на ${at}-му` : ""}
                </span>
                <h2>
                  <TLink to={to} label={`Тема ${d.number}`}>{d.title}</TLink>
                </h2>
                <ol className="pr-card__plan">
                  {d.plan.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
                <div className="pr-card__actions">
                  <TLink to={to} label={`Тема ${d.number}`} className="btn btn--solid">
                    {at > 1 ? "Продовжити" : "Дивитися"}
                  </TLink>
                  <a className="pr-dl" href={deckFile(d, "pdf")} download>Завантажити PDF</a>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
