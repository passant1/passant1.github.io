(function () {
  'use strict';

  function schedulePreload(urls) {
    function preload() {
      urls.forEach(function (url) {
        const image = new Image();
        image.decoding = 'async';
        image.src = url;
      });
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preload, { timeout: 1800 });
    } else {
      window.setTimeout(preload, 900);
    }
  }

  document.querySelectorAll('[data-turntable]').forEach(function (root) {
    const image = root.querySelector('[data-turntable-image]');
    const source = root.querySelector('[data-turntable-source]');
    const avifSource = root.querySelector('[data-turntable-source-avif]');
    const range = root.querySelector('[data-turntable-range]');
    const label = root.querySelector('[data-turntable-label]');
    let frames;
    let avifFrames;
    let fallbackFrames;
    let frameLabels;

    try {
      frames = JSON.parse(root.getAttribute('data-frames') || '[]');
      avifFrames = JSON.parse(root.getAttribute('data-avif-frames') || '[]');
      fallbackFrames = JSON.parse(root.getAttribute('data-fallback-frames') || '[]');
      frameLabels = JSON.parse(root.getAttribute('data-frame-labels') || '[]');
    } catch (_) {
      frames = [];
      avifFrames = [];
      fallbackFrames = [];
      frameLabels = [];
    }
    if (!image || !range || !frames.length) return;
    if (avifFrames.length !== frames.length) avifFrames = frames;
    if (fallbackFrames.length !== frames.length) fallbackFrames = frames;
    const angleStep = Number(root.getAttribute('data-angle-step')) || 30;

    range.min = '0';
    range.max = String(frames.length - 1);
    range.step = '1';

    function showFrame(rawIndex) {
      const index = Math.max(0, Math.min(frames.length - 1, Number(rawIndex) || 0));
      const degrees = index * angleStep;
      range.value = String(index);
      if (avifSource && avifSource.getAttribute('srcset') !== avifFrames[index]) avifSource.srcset = avifFrames[index];
      if (source && source.getAttribute('srcset') !== frames[index]) source.srcset = frames[index];
      if (image.getAttribute('src') !== fallbackFrames[index]) image.src = fallbackFrames[index];
      image.alt = (frameLabels[index] || ('当前视角 ' + degrees + '°')) + ' 的离线渲染结果';
      if (label) label.textContent = '当前视角 ' + degrees + '°';
    }

    range.addEventListener('input', function () {
      showFrame(range.value);
    });

    range.addEventListener('keydown', function (event) {
      const current = Number(range.value) || 0;
      let next = current;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= 1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = frames.length - 1;
      else return;
      event.preventDefault();
      showFrame(next);
    });

    let pointerId = null;
    let startX = 0;
    let startFrame = 0;
    image.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startFrame = Number(range.value) || 0;
      image.setPointerCapture(pointerId);
      root.classList.add('is-dragging');
    });
    image.addEventListener('pointermove', function (event) {
      if (event.pointerId !== pointerId) return;
      const frameDelta = Math.round((event.clientX - startX) / 24);
      const next = (startFrame + frameDelta) % frames.length;
      showFrame(next < 0 ? next + frames.length : next);
    });
    function endDrag(event) {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      root.classList.remove('is-dragging');
    }
    image.addEventListener('pointerup', endDrag);
    image.addEventListener('pointercancel', endDrag);

    showFrame(range.value);
    const currentSource = image.currentSrc || '';
    const preloadFrames = currentSource.indexOf('.avif') !== -1
      ? avifFrames
      : (currentSource.indexOf('.webp') !== -1 ? frames : fallbackFrames);
    schedulePreload(preloadFrames.slice(1));
  });

  document.querySelectorAll('[data-image-compare]').forEach(function (root) {
    const overlay = root.querySelector('[data-compare-overlay]');
    const range = root.querySelector('[data-compare-range]');
    const label = root.querySelector('[data-compare-label]');
    const overlayLabel = root.getAttribute('data-overlay-label') || '高采样结果';
    if (!overlay || !range) return;

    function updateCompare() {
      const value = Math.max(0, Math.min(100, Number(range.value) || 0));
      overlay.style.clipPath = 'inset(0 ' + (100 - value) + '% 0 0)';
      if (label) label.textContent = overlayLabel + ' 显示范围 ' + value + '%';
    }

    range.addEventListener('input', updateCompare);
    range.addEventListener('keydown', function (event) {
      const current = Math.max(0, Math.min(100, Number(range.value) || 0));
      let next = current;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= 1;
      else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = 100;
      else return;
      event.preventDefault();
      range.value = String(Math.max(0, Math.min(100, next)));
      updateCompare();
    });
    updateCompare();
  });
})();
