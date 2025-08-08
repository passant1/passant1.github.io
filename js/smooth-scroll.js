(function() {
  // Ultra-smooth step scrolling (double speed), stop-on-release
  // - During active input, tween towards target for very silky motion
  // - When input stops, halt immediately (no glide)
  // - Respects prefers-reduced-motion, disables on mobile UA
  // - Skips inside scrollable containers, normalizes wheel delta

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileUA = /Mobi|Android|iP(ad|hone|od)/i.test(navigator.userAgent || '');
  if (prefersReduced || isMobileUA) return;

  try { document.documentElement.style.scrollBehavior = 'auto'; } catch(_){}

  // Speed (double vs. previous fast settings)
  const WHEEL_MULTIPLIER = 8.4;   // pixel delta multiplier (very fast)
  const KEY_PAGE_FACTOR  = 4.0;   // PageUp/Down/Space scroll ~4 viewports
  const KEY_ARROW_STEP   = 400;   // ArrowUp/Down step in px

  // Smoothing
  const ACTIVE_WINDOW_MS = 140;   // keep animating briefly after last input (no post-glide)
  const SMOOTH_EASE      = 0.05;  // ultra-smooth per-frame interpolation at 60fps
  const MAX_DT           = 60 / 1000; // 60fps cap

  // Momentum suppression for touchpads (ignore decaying tail within a burst)
  const BURST_MS = 260;
  const MOMENTUM_RATIO = 0.8;
  let burstStart = 0;
  let baseAbs = 0;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function hasScrollableParent(el) {
    const stop = document.scrollingElement || document.documentElement;
    for (let node = el; node && node !== stop; node = node.parentElement) {
      const style = window.getComputedStyle(node);
      const canScrollY = node.scrollHeight > node.clientHeight + 2;
      const overflowY = style.overflowY;
      if (canScrollY && (overflowY === 'auto' || overflowY === 'scroll')) return true;
    }
    return false;
  }

  function normalizeWheelDelta(e) {
    if (e.deltaMode === 1) return e.deltaY * 16;                 // lines -> px
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight; // pages -> px
    return e.deltaY; // pixels
  }

  let targetY = null;
  let lastInputAt = 0;
  let rafId = 0;

  function animate(now) {
    rafId = 0;
    const dt = Math.min(MAX_DT, (now - (animate.last || now)) / 1000);
    animate.last = now;

    if (now - lastInputAt > ACTIVE_WINDOW_MS || targetY == null) {
      targetY = null;
      return; // stop immediately when input ceases
    }

    const current = window.scrollY || window.pageYOffset || 0;
    const doc = document.scrollingElement || document.documentElement;
    const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);
    const clampedTarget = clamp(targetY, 0, maxY);

    const diff = clampedTarget - current;
    if (Math.abs(diff) < 0.5) {
      if (current !== clampedTarget) window.scrollTo(0, clampedTarget);
      targetY = clampedTarget;
    } else {
      const factor = 1 - Math.pow(1 - SMOOTH_EASE, dt / (1/60));
      const f = Math.min(0.75, Math.max(0.05, factor)); // very soft motion
      window.scrollTo(0, current + diff * f);
    }

    rafId = requestAnimationFrame(animate);
  }

  function kickRAF() {
    if (!rafId) {
      animate.last = performance.now();
      rafId = requestAnimationFrame(animate);
    }
  }

  function onWheel(e) {
    if (hasScrollableParent(e.target)) return;
    const dyPx = normalizeWheelDelta(e);
    if (dyPx === 0) return;

    // Momentum filter
    const now = performance.now();
    if (now - burstStart > BURST_MS) {
      burstStart = now;
      baseAbs = Math.abs(dyPx);
    } else {
      baseAbs = Math.max(baseAbs, Math.abs(dyPx));
      if (Math.abs(dyPx) < baseAbs * MOMENTUM_RATIO) {
        e.preventDefault();
        return; // ignore decaying momentum frame
      }
    }

    e.preventDefault();
    const current = window.scrollY || window.pageYOffset || 0;
    const doc = document.scrollingElement || document.documentElement;
    const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);

    if (targetY == null) targetY = current;
    targetY = clamp(targetY + dyPx * WHEEL_MULTIPLIER, 0, maxY);
    lastInputAt = now;
    kickRAF();
  }

  function onKey(e) {
    if (e.defaultPrevented) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;

    let delta = 0;
    if (e.code === 'PageDown') delta = window.innerHeight * KEY_PAGE_FACTOR;
    else if (e.code === 'PageUp') delta = -window.innerHeight * KEY_PAGE_FACTOR;
    else if (e.code === 'Space') delta = e.shiftKey ? -window.innerHeight * KEY_PAGE_FACTOR : window.innerHeight * KEY_PAGE_FACTOR;
    else if (e.code === 'ArrowDown') delta = KEY_ARROW_STEP;
    else if (e.code === 'ArrowUp') delta = -KEY_ARROW_STEP;
    else return;

    e.preventDefault();
    const now = performance.now();
    const current = window.scrollY || window.pageYOffset || 0;
    const doc = document.scrollingElement || document.documentElement;
    const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);

    if (targetY == null) targetY = current;
    targetY = clamp(targetY + delta, 0, maxY);
    lastInputAt = now;
    kickRAF();
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey, { passive: false });
})();