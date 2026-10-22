import { SOURCES } from "../../data/slides.js";
import { TOPIC_IMAGES } from "../../data/images.js";

const pad = (n) => String(n).padStart(2, "0");

// Один слайд. Розміри задані в одиницях --u (1/1600 ширини слайда),
// тож той самий слайд однаковий у переглядачі, мініатюрах і PDF.
export default function Slide({ deck, slide, index, total }) {
  if (slide.type === "cover") return <Cover deck={deck} total={total} />;
  if (slide.type === "summary") return <Summary deck={deck} index={index} total={total} />;
  return (
    <div className="sl sl--content">
      <Top deck={deck} index={index} total={total} />
      <div className="sl__body">
        <span className="sl__kicker">{pad(slide.index)} · пункт плану</span>
        <h2 className="sl__title">{slide.title}</h2>
        {slide.lead && <p className="sl__lead">{slide.lead}</p>}
        <Block slide={slide} />
      </div>
      {slide.quote && (
        <figure className="sl__quote">
          <blockquote>{slide.quote.text}</blockquote>
          <figcaption>{slide.quote.src}</figcaption>
        </figure>
      )}
      <footer className="sl__foot">За джерелами: {slide.ref}</footer>
    </div>
  );
}

function Top({ deck, index, total }) {
  return (
    <header className="sl__top">
      <span>Тема {pad(deck.number)} · {deck.title}</span>
      <span>{pad(index + 1)} / {pad(total)}</span>
    </header>
  );
}

function Block({ slide }) {
  const { kind, items } = slide;
  if (kind === "compare") {
    return (
      <div className="sl-compare">
        {items.map((it, i) => (
          <div key={i} className="sl-compare__col">
            <h3>{it.h}</h3>
            <p>{it.t}</p>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "steps") {
    return (
      <ol className="sl-steps" style={{ "--n": items.length }}>
        {items.map((it, i) => (
          <li key={i}>
            <span className="sl-steps__dot">{i + 1}</span>
            <h3>{it.h}</h3>
            <p>{it.t}</p>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="sl-cards" style={{ "--n": items.length }}>
      {items.map((it, i) => (
        <div key={i} className="sl-cards__card">
          <h3>{it.h}</h3>
          <p>{it.t}</p>
        </div>
      ))}
    </div>
  );
}

function Cover({ deck, total }) {
  const img = TOPIC_IMAGES[deck.number];
  return (
    <div className="sl sl--cover">
      <div className="sl-cover__text">
        <span className="sl__kicker">Тема {pad(deck.number)} · {total} слайдів</span>
        <h1 className="sl-cover__title">{deck.title}</h1>
        <ol className="sl-cover__plan">
          {deck.plan.map((p, i) => (
            <li key={i}>
              <span>{pad(i + 1)}</span>
              {p}
            </li>
          ))}
        </ol>
        <span className="sl-cover__foot">Філософія наукового пізнання · творча робота</span>
      </div>
      <div className="sl-cover__img" style={{ backgroundImage: `url(${img.src})`, backgroundPosition: img.position }} />
    </div>
  );
}

function Summary({ deck, index, total }) {
  return (
    <div className="sl sl--summary">
      <Top deck={deck} index={index} total={total} />
      <div className="sl__body">
        <span className="sl__kicker">Підсумок</span>
        <h2 className="sl__title">Ключові поняття</h2>
        <dl className="sl-terms">
          {deck.terms.map(([term, def]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{def}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="sl-sources">
        <span>Джерела</span>
        <ol>
          {deck.sources.map((k) => (
            <li key={k}>{SOURCES[k]}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
