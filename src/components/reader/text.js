// Допоміжні функції для тексту читалки: виділення, підсвітки, цитування, пошук визначень.

// Позиція символу всередині абзацу з урахуванням вкладених <mark>.
export function offsetIn(el, node, off) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setEnd(node, off);
  return r.toString().length;
}

// Перетворює виділення у діапазони по абзацах: [{ p, s, e }].
export function selectionRanges(root, range) {
  const out = [];
  root.querySelectorAll("[data-i]").forEach((el) => {
    if (!range.intersectsNode(el)) return;
    const len = el.textContent.length;
    const s = el.contains(range.startContainer) ? offsetIn(el, range.startContainer, range.startOffset) : 0;
    const e = el.contains(range.endContainer) ? offsetIn(el, range.endContainer, range.endOffset) : len;
    if (e > s) out.push({ p: +el.dataset.i, s, e });
  });
  return out;
}

// Розрізає текст абзацу на шматки з підсвітками цитат.
export function segments(text, marks) {
  if (!marks || !marks.length) return [{ t: text }];
  const sorted = [...marks].sort((a, b) => a.s - b.s);
  const out = [];
  let at = 0;
  for (const m of sorted) {
    const s = Math.max(m.s, at);
    if (m.e <= s) continue;
    if (s > at) out.push({ t: text.slice(at, s) });
    out.push({ t: text.slice(s, m.e), q: m.q });
    at = m.e;
  }
  if (at < text.length) out.push({ t: text.slice(at) });
  return out;
}

export const clean = (t) => t.replace(/\s+/g, " ").trim();

// Бібліографічне посилання на сторінку джерела.
export function citation(book, page) {
  const imprint = book.imprint.replace(/\s*\d+\s*с\.\s*$/, "");
  return `${book.authors.replace(/\.$/, "")}. ${book.title}. ${imprint} С. ${page}.`;
}

export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Друкована версія нотаток у прихованому iframe: браузер пропонує «Зберегти як PDF»,
// тож кирилиця й шрифти сайту потрапляють у файл без важких бібліотек.
const PRINT_CSS = `
@page { size: A4; margin: 22mm 20mm 20mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 11pt/1.6 "Literata", Georgia, serif; color: #171614; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
header { padding-bottom: 14pt; margin-bottom: 22pt; border-bottom: 0.6pt solid #171614; }
.kicker { font: 600 8pt/1 "Inter Tight", sans-serif; letter-spacing: 0.16em; text-transform: uppercase; color: #a9845a; }
h1 { margin: 10pt 0 6pt; font: 500 26pt/1.05 "Inter Tight", sans-serif; letter-spacing: -0.03em; }
.sub { font: 400 9pt/1.4 "Inter Tight", sans-serif; color: #6f6a63; }
figure { margin: 0 0 16pt; padding-left: 12pt; border-left: 2pt solid #a9845a; break-inside: avoid; }
blockquote { margin: 0; }
figcaption, small { display: block; margin-top: 4pt; font: 400 8pt/1.3 "Inter Tight", sans-serif; letter-spacing: 0.04em; color: #6f6a63; }
.note { margin: 5pt 0 0; font: italic 9.5pt/1.5 "Literata", serif; color: #3a352f; }
dl { margin: 0; }
.term { display: grid; grid-template-columns: 34% 1fr; gap: 14pt; padding: 9pt 0; border-bottom: 0.4pt solid #ddd6cc; break-inside: avoid; }
dt { font: 600 10.5pt/1.4 "Inter Tight", sans-serif; }
dd { margin: 0; }
footer { margin-top: 26pt; padding-top: 8pt; border-top: 0.4pt solid #ddd6cc; font: 400 8pt/1.4 "Inter Tight", sans-serif; color: #6f6a63; }
`;

export function printPdf(name, { kicker, title, sub, body, foot }) {
  const frame = Object.assign(document.createElement("iframe"), { title: name });
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0", visibility: "hidden" });
  document.body.append(frame);
  const doc = frame.contentDocument;
  const today = new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  doc.open();
  doc.write(`<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${name}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Literata:ital,opsz,wght@0,7..72,400;1,7..72,400&display=swap">
<style>${PRINT_CSS}</style></head><body>
<header><div class="kicker">${kicker}</div><h1>${title}</h1><div class="sub">${sub}</div></header>
${body}
<footer>${foot ? foot + "<br>" : ""}Експортовано ${today}</footer></body></html>`);
  doc.close();
  const run = () => {
    // назва документа стає типовою назвою PDF-файлу
    const prev = document.title;
    document.title = name;
    frame.contentWindow.focus();
    frame.contentWindow.print();
    document.title = prev;
    setTimeout(() => frame.remove(), 1000);
  };
  // чекаємо шрифти, але не довше за 2,5 с, щоб офлайн теж працювало
  const ready = doc.fonts?.ready ?? Promise.resolve();
  Promise.race([new Promise((r) => (frame.contentWindow.document.readyState === "complete" ? r() : frame.addEventListener("load", r))).then(() => ready), new Promise((r) => setTimeout(r, 2500))]).then(run);
}

const L = "а-щьюяґєії'’ʼ";

// Шукає в тексті книги речення, що схожі на визначення терміна («Термін – це …»).
export function findDefinitions(term, chapters, limit = 4) {
  const words = term.toLowerCase().match(new RegExp(`[${L}a-z-]+`, "gi")) || [];
  if (!words.length) return [];
  const stem = (w) => (w.length > 5 ? w.slice(0, w.length - 2) : w);
  const head = stem(words[0]);
  const rest = words.slice(1).map(stem);
  const defRe = new RegExp(`(^|[^${L}])${head}[${L}-]*(\\s+[${L}-]+){0,${rest.length + 1}}\\s*[–—-]\\s+`, "i");
  const found = [];
  chapters.forEach((chapter, ch) => {
    chapter.paras.forEach((p, i) => {
      if (p.k !== "p") return;
      const low = p.t.toLowerCase();
      if (!low.includes(head)) return;
      p.t.split(/(?<=[.!?])\s+(?=[А-ЯІЇЄҐ«"(])/).forEach((sent) => {
        const s = sent.toLowerCase();
        if (!s.includes(head) || !rest.every((r) => s.includes(r))) return;
        let score = 1;
        if (defRe.test(s)) score += 4;
        if (/\s[–—-]\s+це\s/.test(s) || /\sце\s/.test(s)) score += 1;
        if (s.indexOf(head) < 25) score += 1;
        if (sent.length < 40 || sent.length > 420) score -= 2;
        found.push({ text: sent.trim(), ch, p: i, page: p.pg, score });
      });
    });
  });
  const seen = new Set();
  return found
    .sort((a, b) => b.score - a.score)
    .filter((f) => !seen.has(f.text) && seen.add(f.text))
    .slice(0, limit);
}
