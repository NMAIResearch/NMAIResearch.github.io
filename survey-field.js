// Survey field: slowly drifting contour lines behind the page's opening section, like a map being surveyed.
// Mark one element with data-survey-field; the canvas spans the viewport width from the top of the page to that
// element's bottom edge and fades out below it. Colours come from CSS custom properties (--field-rgb,
// --field-alpha, --field-major-alpha, --field-lens-rgb, --field-lens-alpha), so both themes follow the site palette.
// Still under prefers-reduced-motion; paused when the section is off screen or the tab is hidden.
(() => {
  "use strict";
  const target = document.querySelector("[data-survey-field]");
  if (!target || !window.HTMLCanvasElement) return;

  // Gradient noise in three dimensions (x, y, time), from a fixed permutation so every visit draws the same land.
  const perm = new Uint8Array(512);
  {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = 20261010;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(h, x, y, z) {
    const u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : ((h & 15) === 12 || (h & 15) === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }
  function noise(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w);
  }
  const height = (x, y, t) => noise(x, y, t) + 0.3 * noise(x * 2.03 + 7.1, y * 2.03 - 3.7, t * 1.6 + 11.3);

  const layer = document.createElement("div");
  layer.className = "survey-field";
  layer.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  layer.appendChild(canvas);
  document.body.prepend(layer);
  const ctx = canvas.getContext("2d");
  const lensCanvas = document.createElement("canvas");
  const lctx = lensCanvas.getContext("2d");

  const CELL = 16, LEVELS = 15, LOW = -0.62, STEP = 0.083, SCALE = 1 / 310;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, grid = new Float32Array(0);
  let colours = null, pointer = null, lensStrength = 0, t = 0, last = 0, frame = 0, onScreen = true;
  const segments = Array.from({ length: LEVELS }, () => []);

  function readColours() {
    const s = getComputedStyle(document.documentElement);
    const num = (name, fallback) => { const v = parseFloat(s.getPropertyValue(name)); return Number.isFinite(v) ? v : fallback; };
    colours = {
      rgb: s.getPropertyValue("--field-rgb").trim() || "26, 54, 93",
      alpha: num("--field-alpha", 0.08), major: num("--field-major-alpha", 0.15),
      lensRgb: s.getPropertyValue("--field-lens-rgb").trim() || "43, 108, 176", lensAlpha: num("--field-lens-alpha", 0.4)
    };
  }

  function size() {
    const box = target.getBoundingClientRect();
    W = document.documentElement.clientWidth;
    H = Math.max(240, Math.round(box.bottom + window.scrollY + 48));
    layer.style.height = H + "px";
    dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3200000 / Math.max(1, W * H)));
    for (const c of [canvas, lensCanvas]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    grid = new Float32Array(cols * rows);
    draw();
  }

  // Marching squares: for every level, the line segments where the height field crosses it. Edges: 0 top,
  // 1 right, 2 bottom, 3 left; corners a (top left) 8, b (top right) 4, c (bottom right) 2, d (bottom left) 1.
  const CASES = [[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 2, 1], [0, 2], [3, 0], [3, 0], [0, 2], [3, 2, 0, 1], [0, 1], [3, 1], [2, 1], [3, 2], []];
  function contour() {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) grid[j * cols + i] = height(i * CELL * SCALE + t * 0.11, j * CELL * SCALE - t * 0.04, t);
    }
    for (let k = 0; k < LEVELS; k++) {
      const level = LOW + k * STEP, out = segments[k];
      out.length = 0;
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = grid[j * cols + i], b = grid[j * cols + i + 1], c = grid[(j + 1) * cols + i + 1], d = grid[(j + 1) * cols + i];
          const code = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (code === 0 || code === 15) continue;
          const x = i * CELL, y = j * CELL, edges = CASES[code];
          for (let n = 0; n < edges.length; n++) {
            const e = edges[n];
            if (e === 0) out.push(x + CELL * (level - a) / (b - a), y);
            else if (e === 1) out.push(x + CELL, y + CELL * (level - b) / (c - b));
            else if (e === 2) out.push(x + CELL * (level - d) / (c - d), y + CELL);
            else out.push(x, y + CELL * (level - a) / (d - a));
          }
        }
      }
    }
  }

  function stroke(context, k, filter) {
    const s = segments[k];
    context.beginPath();
    for (let n = 0; n < s.length; n += 4) {
      if (filter && !filter(s[n], s[n + 1])) continue;
      context.moveTo(s[n], s[n + 1]);
      context.lineTo(s[n + 2], s[n + 3]);
    }
    context.stroke();
  }

  function draw() {
    if (!ctx || !colours) return;
    contour();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    for (let k = 0; k < LEVELS; k++) {
      const major = k % 4 === 2;
      ctx.lineWidth = major ? 1.1 : 0.8;
      ctx.strokeStyle = `rgba(${colours.rgb}, ${major ? colours.major : colours.alpha})`;
      stroke(ctx, k);
    }
    if (pointer && lensStrength > 0.01) {
      // A soft lens: the same lines in the accent colour, faded out from the pointer.
      const R = 170, px = pointer.x, py = pointer.y;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.globalCompositeOperation = "source-over";
      lctx.clearRect(0, 0, W, H);
      lctx.lineCap = "round";
      lctx.strokeStyle = `rgba(${colours.lensRgb}, ${colours.lensAlpha * lensStrength})`;
      for (let k = 0; k < LEVELS; k++) {
        lctx.lineWidth = k % 4 === 2 ? 1.4 : 1;
        stroke(lctx, k, (x, y) => Math.abs(x - px) < R && Math.abs(y - py) < R);
      }
      const g = lctx.createRadialGradient(px, py, 0, px, py, R);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      lctx.globalCompositeOperation = "destination-in";
      lctx.fillStyle = g;
      lctx.fillRect(px - R, py - R, 2 * R, 2 * R);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(lensCanvas, 0, 0);
    }
  }

  function tick(now) {
    frame = 0;
    if (!running()) { last = 0; return; }
    if (now - last >= 33) {
      const dt = last ? Math.min(now - last, 100) / 1000 : 0;
      last = now;
      t += dt * 0.045;
      lensStrength += ((pointer ? 1 : 0) - lensStrength) * Math.min(1, dt * 4);
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  const running = () => !reduced.matches && !document.hidden && onScreen;
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (running()) frame = requestAnimationFrame(tick);
    else draw();
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || reduced.matches) return;
    const y = e.clientY + window.scrollY;
    pointer = y < H ? { x: e.clientX, y } : null;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointer = null; });
  document.addEventListener("visibilitychange", schedule);
  reduced.addEventListener("change", schedule);
  new MutationObserver(() => { readColours(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { readColours(); draw(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; schedule(); }).observe(target);
  if ("ResizeObserver" in window) new ResizeObserver(() => size()).observe(target);
  window.addEventListener("resize", size);
  readColours();
  size();
  schedule();
})();
