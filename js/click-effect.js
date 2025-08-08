(function() {
  // Refined click effect: ripple + light confetti
  // - Subtle ripple emanates from click point
  // - Few confetti triangles with short physics arc
  // - Respects prefers-reduced-motion

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)')?.matches || false;
  if (prefersReduced) return;

  const paletteLight = ['#88cfdb', '#68b0c9', '#b6c5ff', '#d9b3ff', '#aee5cc'];
  const paletteDark  = ['#5aa3b3', '#4a7d99', '#8792d0', '#9a78cd', '#7fb9a3'];
  const dark = matchMedia('(prefers-color-scheme: dark)')?.matches || false;
  const colors = dark ? paletteDark : paletteLight;

  function createRipple(x, y) {
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      transform: translate(-50%, -50%);
      width: 12px; height: 12px;
      border-radius: 50%;
      border: 2px solid ${colors[0]};
      box-shadow: 0 0 0 2px rgba(0,0,0,0.02) inset;
      opacity: .45;
      pointer-events: none;
      z-index: 9999;
      will-change: transform, opacity;
    `;
    document.body.appendChild(el);
    const anim = el.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: .45 },
      { transform: 'translate(-50%, -50%) scale(12)', opacity: 0 }
    ], { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' });
    anim.onfinish = () => el.remove();
  }

  function createConfetto(x, y) {
    const c = document.createElement('div');
    const size = Math.random() * 6 + 6;
    const hue = colors[(Math.random() * colors.length) | 0];
    let rotate = Math.random() * 360;
    let vx = (Math.random() - 0.5) * 360;   // px/s
    let vy = - (180 + Math.random() * 180); // upward impulse
    const ax = 0; const ay = 520;           // gravity px/s^2

    c.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 0; height: 0;
      border-left: ${size}px solid transparent;
      border-right: ${size}px solid transparent;
      border-bottom: ${size * 1.2}px solid ${hue};
      transform: translate(-50%, -50%) rotate(${rotate}deg);
      pointer-events: none; z-index: 9999; opacity: .95;
      will-change: transform, left, top, opacity;
    `;
    document.body.appendChild(c);

    let px = x, py = y, rv = (Math.random()*120+120) * (Math.random()<.5?-1:1);
    function step(t) {
      const dt = Math.min(0.05, (t - (step.last||t)) / 1000);
      step.last = t;
      // integrate
      vx += ax * dt; vy += ay * dt;
      px += vx * dt; py += vy * dt;
      rv *= 0.99;
      rotate += rv * dt;
      c.style.left = px + 'px';
      c.style.top = py + 'px';
      c.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
      // fade out
      const life = ((t - (step.t0|| (step.t0 = t))) / 1200);
      c.style.opacity = String(Math.max(0, 1 - life));
      if (life < 1 && py < innerHeight + 60) requestAnimationFrame(step); else c.remove();
    }
    requestAnimationFrame(step);
  }

  function onClick(e) {
    const x = e.clientX, y = e.clientY;
    createRipple(x, y);
    for (let i = 0; i < 10; i++) createConfetto(x, y);
  }

  document.addEventListener('click', onClick);
})();
