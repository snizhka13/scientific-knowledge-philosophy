import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CoverFront } from "./Book3D.jsx";

const pad = (n) => String(n).padStart(2, "0");

// Розворот зі змістом: обкладинка відкривається, сторінка з цитатою перегортається,
// а під нею зміст. Закриття програє ту саму анімацію у зворотному напрямку.
export default function BookSpread({ book, onClose, onRead }) {
  const root = useRef(null);
  const tl = useRef(null);
  const closing = useRef(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const narrow = window.matchMedia("(max-width: 760px)").matches;
      const t = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onReverseComplete: () => onClose(),
      });
      t.fromTo(".spread-overlay__bg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "none" })
        .fromTo(".spread__book",
          { xPercent: -25, y: 80, rotationX: 24, scale: 0.8, autoAlpha: 0 },
          { y: 0, rotationX: 0, scale: 1, autoAlpha: 1, duration: 0.8, ease: "expo.out" }, "-=0.2")
        .addLabel("cover", "-=0.25")
        .fromTo(".sp-leaf--cover", { z: 2 }, { rotationY: -180, duration: 1.1 }, "cover")
        // лице/зворот перемикаємо явно на 90°, а не покладаємося на backface-visibility (Safari блимає)
        .set(".sp-leaf--cover .sp-face--front", { visibility: "hidden" }, "cover+=0.55")
        .set(".sp-leaf--cover .sp-face--back", { visibility: "visible" }, "cover+=0.55")
        .set(".sp-leaf--cover", { z: 0.5 }, "cover+=1.1")
        .to(".spread__book", { xPercent: narrow ? -25 : 0, duration: 1.1 }, "cover")
        .to(".sp-leaf--cover .sp-shade", { opacity: 0.35, duration: 0.55, yoyo: true, repeat: 1, ease: "sine.inOut" }, "cover")
        .addLabel("page", "-=0.35")
        .fromTo(".sp-leaf--page", { z: 1 }, { rotationY: -180, duration: 1 }, "page")
        .set(".sp-leaf--page .sp-face--front", { visibility: "hidden" }, "page+=0.5")
        .set(".sp-leaf--page .sp-face--back", { visibility: "visible" }, "page+=0.5")
        .to(".sp-leaf--page .sp-shade", { opacity: 0.3, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, "page")
        .from(".sp-toc li, .sp-toc h3", { x: 16, autoAlpha: 0, duration: 0.5, stagger: 0.035, ease: "power3.out" }, "-=0.45")
        .from(".spread-overlay__close", { autoAlpha: 0, duration: 0.3 }, "-=0.3");
      if (reduce) t.progress(1);
      tl.current = t;
    },
    { scope: root }
  );

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const t = tl.current;
    if (!t || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    t.timeScale(1.6).reverse();
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("no-scroll");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("no-scroll");
    };
  }, []);

  let n = 0;
  return (
    <div ref={root} className={`spread-overlay book3d--${book.cover}`} role="dialog" aria-modal="true" aria-label={`Зміст: ${book.title}`}>
      <div className="spread-overlay__bg" onClick={close} />
      <button className="spread-overlay__close" onClick={close} aria-label="Закрити зміст">✕</button>
      <div className="spread">
        <div className="spread__book">
          {/* права нерухома сторінка: зміст */}
          <div className="sp-page sp-page--right sp-toc">
            <span className="sp-run">Зміст</span>
            <div className="sp-toc__list">
              {book.contents.map((part, k) => (
                <div key={k}>
                  {part.title && <h3>Розділ {k + 1}. {part.title}</h3>}
                  <ol>
                    {part.items.map((t) => {
                      const i = n++;
                      return (
                        <li key={t}>
                          <button onClick={() => onRead(i)}>
                            <span>{pad(i + 1)}</span>
                            {t}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
            <span className="sp-folio">2</span>
          </div>

          {/* сторінка з цитатою: лицем праворуч, після перегортання зворотом ліворуч */}
          <div className="sp-leaf sp-leaf--page">
            <div className="sp-face sp-face--front sp-quote">
              <span className="sp-run">{book.short}</span>
              <p>{book.annotation.text}</p>
              <cite>с. {book.annotation.page}</cite>
              <span className="sp-folio">1</span>
              <i className="sp-shade" />
            </div>
            <div className="sp-face sp-face--back sp-title">
              <span className="sp-run">{book.short}</span>
              <div>
                <h2>{book.title}</h2>
                <p>{book.authors}</p>
                <p className="sp-title__imprint">{book.imprint}</p>
              </div>
              <div className="sp-title__foot">
                <span>{book.chapters} {book.partsLabel} · {book.pages} с.</span>
                <button className="btn btn--solid" onClick={() => onRead(0)}>Читати →</button>
              </div>
              <i className="sp-shade" />
            </div>
          </div>

          {/* обкладинка */}
          <div className="sp-leaf sp-leaf--cover">
            <div className="sp-face sp-face--front sp-cover">
              <CoverFront book={book} className="book3d__front" />
              <i className="sp-shade" />
            </div>
            <div className="sp-face sp-face--back sp-inside">
              <i className="sp-shade" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
