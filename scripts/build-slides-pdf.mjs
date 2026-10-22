// Генерує public/presentations/tema-NN.pdf з вебверсії слайдів (маршрут /#/presentations/N/print),
// тож PDF має ті самі шрифти й верстку, що й переглядач на сайті.
// Запуск: npm run build && npx vite preview --port 4173, потім у другому терміналі
//   node scripts/build-slides-pdf.mjs [http://localhost:4173]
// Потрібен Playwright: npm i -D playwright && npx playwright install chromium
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { DECKS } from "../src/data/slides.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] || "http://localhost:4173";
const pad = (n) => String(n).padStart(2, "0");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
for (const deck of DECKS) {
  await page.goto(`${base}/#/presentations/${deck.number}/print`);
  await page.waitForSelector(".print-deck .sl");
  await page.evaluate(() => document.fonts.ready);
  // фото на обкладинці
  await page.waitForFunction(() => {
    const el = document.querySelector(".sl-cover__img");
    if (!el) return true;
    const url = getComputedStyle(el).backgroundImage.slice(5, -2);
    const img = new Image();
    img.src = url;
    return img.complete;
  });
  await page.waitForTimeout(300);
  const file = path.join(root, `public/presentations/tema-${pad(deck.number)}.pdf`);
  await page.pdf({ path: file, width: "1600px", height: "900px", printBackground: true, preferCSSPageSize: true });
  console.log(path.relative(root, file));
}
await browser.close();
