(function() {
  // Aurora ribbons background
  // Smooth gradient ribbons flowing horizontally with subtle parallax.

  // ---- Config ----
  const MAX_DPR = 1.5;
  const RIBBON_COUNT_LIGHT = 7;
  const RIBBON_COUNT_DARK = 9;
  const BASE_THICKNESS = [80, 180];      // px
  const AMP_Y = [90, 180];               // px
  const FREQ_X = [0.0024, 0.0042];       // cycles per px
  const SPEED = [0.45, 0.90];            // phase rad / sec
  const BLUR_PX = 14;                    // canvas filter blur
  const CANVAS_OPACITY = 0.58;
  const SAMPLES_PER_WIDTH = 220;         // curve sampling density baseline

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)')?.matches || false;
  const prefersDark = matchMedia('(prefers-color-scheme: dark)')?.matches || false;

  // Palettes
  const paletteLight = [
    [ 98, 203, 189, 0.35],  // aqua
    [144, 170, 255, 0.32],  // periwinkle
    [186, 117, 224, 0.28],  // purple
    [ 96, 200, 255, 0.30],  // sky
    [170, 230, 200, 0.26]   // mint
  ];
  const paletteDark = [
    [ 40, 120, 130, 0.26],  // deep teal
    [120,  90, 180, 0.22],  // violet
    [ 60,  90, 140, 0.24],  // indigo cyan
    [ 30,  70,  90, 0.20],  // slate
    [100, 130, 180, 0.22]   // steel blue
  ];
  const palette = prefersDark ? paletteDark : paletteLight;

  // Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  canvas.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: -1',
    'pointer-events: none',
    `opacity: ${CANVAS_OPACITY}`
  ].join(';');
  document.body.prepend(canvas);

  let dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  let width = 1, height = 1;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
    width = Math.max(1, innerWidth);
    height = Math.max(1, innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Utility
  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  // Ribbon
  class Ribbon {
    constructor(depthIndex) {
      const [r, g, b, a] = pick(palette);
      this.color = { r, g, b, a };
      this.thickness = rand(BASE_THICKNESS[0], BASE_THICKNESS[1]);
      this.amp = rand(AMP_Y[0], AMP_Y[1]);
      this.freq = rand(FREQ_X[0], FREQ_X[1]);
      this.phase = rand(0, Math.PI * 2);
      this.speed = rand(SPEED[0], SPEED[1]) * (Math.random() < 0.5 ? -1 : 1);
      this.baseY = rand(0.15, 0.85) * height;
      this.parallax = 0.3 + depthIndex * 0.25;
    }
    update(dt, mouseOffsetY) {
      this.phase += this.speed * dt;
      // stronger parallax & mouse response
      this.baseY = Math.min(height * 0.92, Math.max(height * 0.08, this.baseY + mouseOffsetY * 0.05 * this.parallax));
    }
    draw(ctx) {
      const samples = Math.max(60, Math.round((width / 1440) * SAMPLES_PER_WIDTH));
      const step = width / (samples - 1);
      const tHalf = this.thickness * 0.5;

      // centerline points
      const cx = new Array(samples);
      const cy = new Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = i * step;
        const y = this.baseY + Math.sin(x * this.freq + this.phase) * this.amp
                          + Math.sin(x * this.freq * 0.37 + this.phase * 0.7) * (this.amp * 0.25);
        cx[i] = x;
        cy[i] = y;
      }

      // gradient perpendicular to ribbon (vertical-ish)
      const grad = ctx.createLinearGradient(0, this.baseY - this.amp - tHalf, 0, this.baseY + this.amp + tHalf);
      const { r, g, b, a } = this.color;
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${a * 0.0})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${a})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${a * 0.0})`);

      // build path by offsetting normals
      ctx.beginPath();
      for (let i = 0; i < samples; i++) {
        const i0 = Math.max(0, i - 1);
        const i1 = Math.min(samples - 1, i + 1);
        const dx = cx[i1] - cx[i0];
        const dy = cy[i1] - cy[i0];
        const len = Math.max(1e-3, Math.hypot(dx, dy));
        const nx = -dy / len; // unit normal
        const ny = dx / len;
        const xTop = cx[i] + nx * tHalf;
        const yTop = cy[i] + ny * tHalf;
        if (i === 0) ctx.moveTo(xTop, yTop); else ctx.lineTo(xTop, yTop);
      }
      for (let i = samples - 1; i >= 0; i--) {
        const i0 = Math.max(0, i - 1);
        const i1 = Math.min(samples - 1, i + 1);
        const dx = cx[i1] - cx[i0];
        const dy = cy[i1] - cy[i0];
        const len = Math.max(1e-3, Math.hypot(dx, dy));
        const nx = -dy / len;
        const ny = dx / len;
        const xBot = cx[i] - nx * tHalf;
        const yBot = cy[i] - ny * tHalf;
        ctx.lineTo(xBot, yBot);
      }
      ctx.closePath();

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  let ribbons = [];
  function init() {
    resize();
    const count = (prefersDark ? RIBBON_COUNT_DARK : RIBBON_COUNT_LIGHT);
    ribbons = new Array(count).fill(0).map((_, i) => new Ribbon(i / Math.max(1, count - 1)));
  }

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (running) {
      ctx.clearRect(0, 0, width, height);
      ctx.filter = `blur(${BLUR_PX}px)`;

      const mouseOffsetY = (mouse.y - height / 2) / height; // -0.5..0.5
      for (let i = 0; i < ribbons.length; i++) {
        ribbons[i].update(dt, mouseOffsetY);
        ribbons[i].draw(ctx);
      }

      // vignette
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.4,
                                            width * 0.5, height * 0.5, Math.max(width, height) * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, prefersDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.08)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.filter = 'none';
    }
    if (!prefersReduced) requestAnimationFrame(frame);
  }

  function renderStatic() {
    ctx.clearRect(0, 0, width, height);
    ctx.filter = `blur(${BLUR_PX}px)`;
    for (let i = 0; i < ribbons.length; i++) ribbons[i].draw(ctx);
    ctx.filter = 'none';
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, Math.min(width, height) * 0.4,
                                          width * 0.5, height * 0.5, Math.max(width, height) * 0.85);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, prefersDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.08)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  window.addEventListener('resize', () => { init(); });

  init();
  if (prefersReduced) {
    renderStatic();
  } else {
    requestAnimationFrame(frame);
  }
})();
