import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Books from "./pages/Books.jsx";
import Presentations from "./pages/Presentations.jsx";
import Crossword from "./pages/Crossword.jsx";
import Reader from "./pages/Reader.jsx";
import Deck from "./pages/Deck.jsx";
import NotFound from "./pages/NotFound.jsx";
import Cursor from "./components/Cursor.jsx";
import { TransitionProvider } from "./components/Transition.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    // після refresh браузер іноді повертає стару позицію, тож ще раз у наступному кадрі
    const id = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}

export default function App() {
  // у читалці й переглядачі презентацій своя панель, тож шапка й підвал сайту ховаються
  const reader = /^\/(books|presentations)\/[^/]+/.test(useLocation().pathname);
  return (
    <TransitionProvider>
      <div className="grain" aria-hidden="true" />
      {/* у читалці курсор не відволікає від тексту */}
      {!reader && <Cursor />}
      <ScrollToTop />
      {!reader && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/presentations" element={<Presentations />} />
          <Route path="/presentations/:n/:s?" element={<Deck />} />
          <Route path="/crossword" element={<Crossword />} />
          <Route path="/books/:id/:chapter?" element={<Reader />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!reader && <Footer />}
    </TransitionProvider>
  );
}
