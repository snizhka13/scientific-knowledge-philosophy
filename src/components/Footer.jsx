import { BOOKS } from "../data/course.js";
import { PHOTO_CREDITS } from "../data/images.js";
import { TLink } from "./Transition.jsx";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__cta">
          <span className="eyebrow">Творча робота</span>
          <p className="site-footer__big">
            Пізнання починається <span>з питання.</span>
          </p>
          <div className="site-footer__links">
            <TLink to="/crossword" label="Кросворд">Кросворд →</TLink>
            <TLink to="/books" label="Книги">Книги →</TLink>
            <TLink to="/presentations" label="Презентації">Презентації →</TLink>
          </div>
        </div>
        <div className="site-footer__grid">
          <div>
            <span className="eyebrow">Курс</span>
            <p>Філософія наукового пізнання. Кросворди, книги-джерела та презентації за десятьма темами.</p>
          </div>
          <div>
            <span className="eyebrow">Джерела</span>
            <ol>
              {BOOKS.map((b) => (
                <li key={b.id}>
                  {b.authors.replace(/\.$/, "")}. {b.title}. {b.imprint}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="site-footer__credits">
          Фото: Wikimedia Commons (суспільне надбання та вільні ліцензії). {PHOTO_CREDITS.join(" · ")}.
        </p>
        <div className="site-footer__bottom">© {new Date().getFullYear()} · Магістратура, 1 курс</div>
      </div>
    </footer>
  );
}
