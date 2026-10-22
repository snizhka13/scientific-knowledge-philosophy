import { Fragment, memo } from "react";
import { segments } from "./text.js";

// Текст розділу. Мемоізований: перемальовується лише коли змінюються абзаци, підсвітки чи закладки,
// а не під час прокручування.
const ChapterText = memo(function ChapterText({ paras, marks, bookmarks, onMark }) {
  let page = null;
  return paras.map((p, i) => {
    const showPage = p.pg !== page;
    page = p.pg;
    const Tag = p.k === "h" ? "h3" : "p";
    const bm = bookmarks.has(i);
    return (
      <Fragment key={i}>
        {showPage && (
          <span className="rd-page" aria-hidden="true">
            с. {p.pg}
          </span>
        )}
        <Tag data-i={i} className={`rd-para${bm ? " is-bm" : ""}`}>
          {segments(p.t, marks.get(i)).map((s, k) =>
            s.q ? (
              <mark key={k} data-q={s.q} onClick={() => onMark(s.q)}>
                {s.t}
              </mark>
            ) : (
              <Fragment key={k}>{s.t}</Fragment>
            )
          )}
        </Tag>
      </Fragment>
    );
  });
});

export default ChapterText;
