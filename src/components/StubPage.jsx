import { Link } from "react-router-dom";
import "../styles/pages.css";

// Тимчасова сторінка для розділів, які ще в розробці.
export default function StubPage({ eyebrow, title, text, children, back = { to: "/", label: "На головну" } }) {
  return (
    <section className="stub">
      <div className="container stub__inner">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
        <div className="stub__badge">Розділ у розробці</div>
        <Link to={back.to} className="btn">← {back.label}</Link>
      </div>
    </section>
  );
}
