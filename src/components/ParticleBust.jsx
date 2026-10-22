import { useEffect, useRef } from "react";
import gsap from "gsap";
import { socratesPoints } from "../data/socrates-points.js";

// Хмара точок, що складається в погруддя Сократа, а потім по черзі
// перетворюється на атом, книгу, колбу та знак питання. Точки відштовхуються
// від курсора, а під час скролу розлітаються.

export const SHAPES = [
  { id: "socrates", label: "Сократ", note: "бл. 470–399 до н. е." },
  { id: "atom", label: "Атом", note: "природа знання" },
  { id: "socrates", label: "Сократ", note: "бл. 470–399 до н. е." },
  { id: "book", label: "Книга", note: "три джерела курсу" },
  { id: "socrates", label: "Сократ", note: "бл. 470–399 до н. е." },
  { id: "flask", label: "Колба", note: "методи пізнання" },
  { id: "socrates", label: "Сократ", note: "бл. 470–399 до н. е." },
  { id: "question", label: "?", note: "пізнання починається з питання" },
];

const HOLD = { socrates: 5, atom: 3.2, book: 3.2, flask: 3.2, question: 3.2 };

// Малює фігуру на прихованому полотні 1000×1000 і бере з неї n точок.
// Прозорість пікселя визначає ймовірність потрапляння точки.
function sampleShape(draw, n) {
  const size = 1000;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = ctx.strokeStyle = "#000";
  ctx.lineCap = ctx.lineJoin = "round";
  draw(ctx);
  const data = ctx.getImageData(0, 0, size, size).data;
  const cells = [];
  const weights = [];
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const a = data[(y * size + x) * 4 + 3];
      if (a > 20) {
        cells.push(x, y);
        weights.push(a / 255);
      }
    }
  }
  const out = new Float32Array(n * 3);
  let k = 0;
  let guard = 0;
  const m = weights.length;
  while (k < n && guard < n * 40) {
    guard++;
    const j = (Math.random() * m) | 0;
    if (Math.random() > weights[j]) continue;
    out[k * 3] = cells[j * 2] - size / 2 + (Math.random() - 0.5) * 2.4;
    out[k * 3 + 1] = cells[j * 2 + 1] - size / 2 + (Math.random() - 0.5) * 2.4;
    out[k * 3 + 2] = 0.35 + weights[j] * 0.5 * Math.random() + 0.15;
    k++;
  }
  return out;
}

const DRAW = {
  atom(ctx) {
    ctx.lineWidth = 16;
    [0, 60, 120].forEach((deg) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, 440, 140, (deg * Math.PI) / 180, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();
    [
      [440, 0, 0],
      [440, 0, 60],
      [440, 0, 120],
    ].forEach(([r, , deg], i) => {
      const a = (deg * Math.PI) / 180;
      const t = [0.6, 2.4, 4.1][i];
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * 140;
      ctx.beginPath();
      ctx.arc(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), 28, 0, Math.PI * 2);
      ctx.fill();
    });
  },
  book(ctx) {
    const page = (dir) => {
      ctx.beginPath();
      ctx.moveTo(0, -170);
      ctx.bezierCurveTo(dir * 140, -250, dir * 300, -250, dir * 440, -200);
      ctx.lineTo(dir * 440, 260);
      ctx.bezierCurveTo(dir * 300, 210, dir * 140, 210, 0, 290);
      ctx.closePath();
    };
    [-1, 1].forEach((dir) => {
      ctx.globalAlpha = 0.22;
      page(dir);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 14;
      page(dir);
      ctx.stroke();
      ctx.lineWidth = 7;
      for (let i = 0; i < 7; i++) {
        const y = -140 + i * 52;
        ctx.beginPath();
        ctx.moveTo(dir * 70, y + 8);
        ctx.quadraticCurveTo(dir * 220, y - 26, dir * (i === 6 ? 260 : 380), y - 6);
        ctx.stroke();
      }
    });
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-440, 300);
    ctx.bezierCurveTo(-300, 260, -120, 270, 0, 340);
    ctx.bezierCurveTo(120, 270, 300, 260, 440, 300);
    ctx.stroke();
  },
  flask(ctx) {
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(-70, -400);
      ctx.lineTo(-70, -140);
      ctx.lineTo(-330, 330);
      ctx.quadraticCurveTo(-345, 380, -290, 380);
      ctx.lineTo(290, 380);
      ctx.quadraticCurveTo(345, 380, 330, 330);
      ctx.lineTo(70, -140);
      ctx.lineTo(70, -400);
    };
    ctx.lineWidth = 16;
    body();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-110, -410);
    ctx.lineTo(110, -410);
    ctx.stroke();
    ctx.save();
    body();
    ctx.closePath();
    ctx.clip();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(-400, 120);
    ctx.bezierCurveTo(-200, 70, -60, 170, 120, 110);
    ctx.bezierCurveTo(240, 70, 330, 110, 400, 100);
    ctx.lineTo(400, 400);
    ctx.lineTo(-400, 400);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 8;
    [
      [-40, 20, 26],
      [50, -40, 18],
      [10, -110, 12],
      [90, 230, 22],
      [-120, 250, 16],
    ].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  },
  question(ctx) {
    ctx.font = '600 880px "Inter Tight", "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 30);
  },
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function ParticleBust({ onShape, scatterRef }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 720;

    // Точки погруддя (на телефоні беремо кожну другу)
    const raw = socratesPoints();
    const stride = small ? 2 : 1;
    const N = Math.floor(raw.length / 3 / stride);
    const bust = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const j = i * stride * 3;
      bust[i * 3] = raw[j];
      bust[i * 3 + 1] = raw[j + 1];
      bust[i * 3 + 2] = raw[j + 2] / 100;
    }

    const targets = { socrates: bust };
    const getTarget = (id) => {
      if (!targets[id]) targets[id] = sampleShape(DRAW[id], N);
      return targets[id];
    };

    // Стан частинок
    const px = new Float32Array(N), py = new Float32Array(N), pw = new Float32Array(N);
    const fx = new Float32Array(N), fy = new Float32Array(N), fw = new Float32Array(N);
    const tx = new Float32Array(N), ty = new Float32Array(N), tw = new Float32Array(N);
    const delay = new Float32Array(N), ox = new Float32Array(N), oy = new Float32Array(N);
    const offx = new Float32Array(N), offy = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
    const order = new Uint32Array(N);
    const bx = [new Float32Array(N * 2), new Float32Array(N * 2), new Float32Array(N * 2)];
    const bn = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 500 + Math.random() * 600;
      px[i] = Math.cos(a) * r;
      py[i] = Math.sin(a) * r;
      pw[i] = 0;
      ox[i] = (Math.random() - 0.5) * 2;
      oy[i] = (Math.random() - 0.5) * 2;
      order[i] = i;
    }

    const morph = { t: 1 };
    let current = -1;
    let timer = null;
    let tween = null;

    function setTarget(id) {
      const src = getTarget(id);
      // Випадкова відповідність точок дає ефект «розсипання й збирання»
      for (let i = N - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = order[i];
        order[i] = order[j];
        order[j] = t;
      }
      for (let i = 0; i < N; i++) {
        fx[i] = px[i];
        fy[i] = py[i];
        fw[i] = pw[i];
        const k = order[i] * 3;
        tx[i] = src[k];
        ty[i] = src[k + 1];
        tw[i] = src[k + 2];
        delay[i] = Math.random() * 0.35;
      }
    }

    function go(index, duration = 2.4) {
      current = (index + SHAPES.length) % SHAPES.length;
      const shape = SHAPES[current];
      setTarget(shape.id);
      onShape?.(shape);
      tween?.kill();
      morph.t = 0;
      tween = gsap.to(morph, { t: 1, duration, ease: "none" });
      timer?.kill();
      if (!reduce) timer = gsap.delayedCall(duration + HOLD[shape.id], () => go(current + 1));
    }

    // Розміри полотна
    let W = 0, H = 0, dpr = 1, scale = 1, cx = 0, cy = 0, dot = 1;
    function resize() {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      scale = Math.min(W / 760, H / 1040);
      cx = W / 2;
      cy = H / 2;
      dot = Math.max(1.1, scale * 2.1);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Курсор
    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    };
    const onLeave = () => (mouse.active = false);
    const onClick = () => go(current + 1, 1.8);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);

    // Кадр
    const R = 110;
    let raf = 0;
    let visible = true;
    let time = 0;
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      time += 0.016;
      const t = morph.t;
      const scatter = scatterRef?.current || 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      bn[0] = bn[1] = bn[2] = 0;
      for (let i = 0; i < N; i++) {
        let l = (t - delay[i]) / 0.65;
        l = l < 0 ? 0 : l > 1 ? 1 : l;
        const e = easeInOut(l);
        const arc = Math.sin(Math.PI * l) * 160;
        px[i] = fx[i] + (tx[i] - fx[i]) * e + ox[i] * arc;
        py[i] = fy[i] + (ty[i] - fy[i]) * e + oy[i] * arc;
        pw[i] = fw[i] + (tw[i] - fw[i]) * e;

        const wob = 1.4;
        let sx = cx + (px[i] + Math.sin(time * 0.9 + i * 0.37) * wob + ox[i] * scatter * 900) * scale;
        let sy = cy + (py[i] + Math.cos(time * 0.8 + i * 0.29) * wob + oy[i] * scatter * 900 - scatter * 300) * scale;

        // Відштовхування від курсора з пружним поверненням
        if (mouse.active) {
          const dx = sx + offx[i] - mouse.x;
          const dy = sy + offy[i] - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 2.2;
            vx[i] += (dx / d) * f;
            vy[i] += (dy / d) * f;
          }
        }
        vx[i] = (vx[i] - offx[i] * 0.05) * 0.86;
        vy[i] = (vy[i] - offy[i] * 0.05) * 0.86;
        offx[i] += vx[i];
        offy[i] += vy[i];
        sx += offx[i];
        sy += offy[i];

        const w = pw[i];
        const b = w < 0.45 ? 0 : w < 0.7 ? 1 : 2;
        bx[b][bn[b]++] = sx;
        bx[b][bn[b]++] = sy;
      }

      const fade = 1 - scatter * 0.9;
      const alphas = [0.42, 0.68, 0.92];
      const sizes = [dot * 0.85, dot, dot * 1.2];
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = `rgba(23, 22, 20, ${alphas[b] * fade})`;
        const arr = bx[b];
        const s = sizes[b];
        for (let k = 0; k < bn[b]; k += 2) ctx.fillRect(arr[k] - s / 2, arr[k + 1] - s / 2, s, s);
      }
    }

    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(wrap);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (reduce) {
        go(0, 0.01);
      } else {
        go(0, 2.8);
      }
      frame();
    };
    // Шрифт потрібен для знака питання
    (document.fonts?.ready || Promise.resolve()).then(start);
    const fallback = setTimeout(start, 1200);

    return () => {
      clearTimeout(fallback);
      cancelAnimationFrame(raf);
      tween?.kill();
      timer?.kill();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [onShape, scatterRef]);

  return (
    <div ref={wrapRef} className="particles">
      <canvas ref={canvasRef} aria-label="Погруддя Сократа з точок, що перетворюється на інші фігури" role="img" />
    </div>
  );
}
