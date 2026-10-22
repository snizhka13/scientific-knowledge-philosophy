import { useEffect, useRef, useState } from "react";
import { CROSSWORD_URL, TOPICS } from "../data/course.js";
import "../styles/pages.css";

// Ширина, у якій кросворд «знімається» для мініатюри.
const SHOT_W = 1280;
const SHOT_H = 860;

// Сторінка-вітрина: мініатюра кросворду без взаємодії і перехід на повну версію.
export default function Crossword() {
  const view = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = view.current;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / SHOT_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="cw">
      <div className="container cw__inner">
        <div className="cw__text">
          <span className="eyebrow">Розділ 01</span>
          <h1>Кросворди за темами</h1>
          <p>
            Десять тем курсу, у кожній три рівні складності по пʼять слів. Поруч теорія з джерел, підказки й перевірка.
            Прогрес зберігається у браузері.
          </p>
          <ul className="cw__facts">
            <li><b>{TOPICS.length}</b> тем</li>
            <li><b>30</b> кросвордів</li>
            <li><b>150</b> понять</li>
          </ul>
          <a className="btn btn--solid" href={CROSSWORD_URL} target="_blank" rel="noreferrer">
            Грати <span aria-hidden="true">↗</span>
          </a>
        </div>

        <a className="cw-win" href={CROSSWORD_URL} target="_blank" rel="noreferrer" aria-label="Відкрити кросворд у новій вкладці">
          <span className="cw-win__bar" aria-hidden="true">
            <i /><i /><i />
            <span className="cw-win__url">philosophy-crossword.vercel.app</span>
          </span>
          <span className="cw-win__view" ref={view} style={{ aspectRatio: `${SHOT_W} / ${SHOT_H}` }}>
            {!loaded && <span className="cw-win__loader">Завантажуємо мініатюру…</span>}
            <iframe
              src={CROSSWORD_URL}
              title="Мініатюра кросворду"
              tabIndex={-1}
              aria-hidden="true"
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={loaded ? "is-loaded" : ""}
              style={{ width: SHOT_W, height: SHOT_H, transform: `scale(${scale})` }}
            />
            <span className="cw-win__cta">Відкрити кросворд ↗</span>
          </span>
        </a>
      </div>
    </section>
  );
}
