import { useEffect, useRef } from "react";
import gsap from "gsap";

// Кружок-курсор, що збільшується над посиланнями (лише для миші).
export default function Cursor() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
    const move = (e) => {
      x(e.clientX);
      y(e.clientY);
      el.classList.toggle("is-link", Boolean(e.target.closest?.("a, button, [data-cursor]")));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true" />;
}
