import { createContext, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

// Перехід між сторінками: темна завіса піднімається, змінює сторінку й відходить угору.
const TransitionContext = createContext(null);

export function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const curtain = useRef(null);
  const label = useRef(null);
  const busy = useRef(false);

  const go = useCallback(
    (to, text = "") => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || busy.current) {
        navigate(to);
        return;
      }
      busy.current = true;
      label.current.textContent = text;
      gsap
        .timeline({ onComplete: () => (busy.current = false) })
        .set(curtain.current, { y: 0, yPercent: 100, visibility: "visible" })
        .to(curtain.current, { yPercent: 0, duration: 0.65, ease: "expo.inOut" })
        .fromTo(label.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
        .add(() => navigate(to))
        .to(label.current, { opacity: 0, y: -20, duration: 0.25 }, "+=0.25")
        .to(curtain.current, { yPercent: -100, duration: 0.7, ease: "expo.inOut" }, "<")
        .set(curtain.current, { visibility: "hidden" });
    },
    [navigate]
  );

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div ref={curtain} className="curtain" aria-hidden="true">
        <span ref={label} />
      </div>
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  return useContext(TransitionContext);
}

// Посилання з анімованим переходом. Ctrl/Cmd-клік відкриває як звичайне посилання.
export function TLink({ to, label, children, onClick, ...rest }) {
  const go = usePageTransition();
  return (
    <a
      href={`#${to}`}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(to, label);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
