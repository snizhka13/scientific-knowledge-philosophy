import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TLink } from "./Transition.jsx";

const LINKS = [
  { to: "/crossword", label: "Кросворд" },
  { to: "/books", label: "Книги" },
  { to: "/presentations", label: "Презентації" },
];

export default function Header() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 400 && y > last);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${hidden ? " is-hidden" : ""}`}>
      <div className="container site-header__inner">
        <TLink to="/" label="Головна" className="brand" aria-label="На головну">
          <span className="brand__mark">Φ</span>
          <span className="brand__text">
            Філософія наукового пізнання
            <small>
              Творча робота<span className="brand__dot" aria-hidden="true">·</span>Грек Сніжана (КН26М)
            </small>
          </span>
        </TLink>
        <nav className="nav" aria-label="Розділи">
          {LINKS.map((l) => (
            <TLink key={l.to} to={l.to} label={l.label} className={pathname === l.to ? "active" : undefined}>
              {l.label}
            </TLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
