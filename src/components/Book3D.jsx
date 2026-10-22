import { forwardRef } from "react";

// Обкладинка-емблема: три мотиви в одній графічній мові з головною (лінії й точки).
function Emblem({ kind }) {
  if (kind === "orbit") {
    return (
      <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
        {[90, 70, 50, 30].map((r, i) => (
          <ellipse key={r} cx="100" cy="100" rx={r} ry={r * 0.42} transform={`rotate(${-24 + i * 16} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="7" fill="currentColor" stroke="none" />
        <circle cx="168" cy="72" r="3.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "grid") {
    return (
      <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <line x1={20 + i * 20} y1="20" x2={20 + i * 20} y2="180" />
            <line x1="20" y1={20 + i * 20} x2="180" y2={20 + i * 20} />
          </g>
        ))}
        <path d="M20 180 Q 100 170 180 20" strokeWidth="2.4" />
      </svg>
    );
  }
  // Поле точок, що густішає до центру, як у бюсті з головної
  const dots = [];
  for (let y = 0; y < 13; y++)
    for (let x = 0; x < 13; x++) {
      const d = Math.hypot(x - 6, y - 6) / 8.5;
      const r = Math.max(0, 4.2 * (1 - d));
      if (r > 0.4) dots.push(<circle key={`${x}-${y}`} cx={10 + x * 15} cy={10 + y * 15} r={r} />);
    }
  return (
    <svg viewBox="0 0 200 200" fill="currentColor">
      {dots}
    </svg>
  );
}

// Лицьовий бік обкладинки: той самий і на полиці, і в розвороті.
export function CoverFront({ book, className = "book3d__front" }) {
  return (
    <div className={className}>
      <span className="book3d__authors">{book.authors}</span>
      <span className="book3d__emblem">
        <Emblem kind={book.emblem} />
      </span>
      <strong className="book3d__title">{book.title}</strong>
      <span className="book3d__year">{book.year}</span>
    </div>
  );
}

// Тривимірна книжка з CSS: обкладинка відкривається, видно першу сторінку з анотацією.
const Book3D = forwardRef(function Book3D({ book, size = "md" }, ref) {
  const depth = Math.round(14 + book.pages / 9);
  return (
    <div ref={ref} className={`book3d book3d--${book.cover} book3d--${size}`} style={{ "--depth": `${depth}px` }}>
      <div className="book3d__face book3d__back" />
      <div className="book3d__face book3d__spine">
        <span>{book.short}</span>
      </div>
      <div className="book3d__face book3d__edge" />
      <div className="book3d__face book3d__top" />
      <div className="book3d__face book3d__page">
        <small>С. {book.annotation.page}</small>
        <p>{book.annotation.text}</p>
      </div>
      <div className="book3d__cover">
        <CoverFront book={book} />
        <div className="book3d__inside" />
      </div>
    </div>
  );
});

export default Book3D;
