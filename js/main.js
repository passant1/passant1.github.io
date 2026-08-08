(function () {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
  }

  document.querySelectorAll('.article-content img').forEach(function (image) {
    if (!image.hasAttribute('loading')) image.loading = 'lazy';
    image.decoding = 'async';
  });

  document.querySelectorAll('figure.highlight').forEach(function (figure) {
    const code = figure.querySelector('code, .code pre');
    if (!code) return;
    const button = document.createElement('button');
    button.className = 'copy-code';
    button.type = 'button';
    button.textContent = '复制';
    button.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = '已复制';
        setTimeout(function () { button.textContent = '复制'; }, 1500);
      } catch (_) {
        button.textContent = '复制失败';
      }
    });
    figure.appendChild(button);
  });

  const root = document.querySelector('[data-search-root]');
  if (!root) return;
  const input = root.querySelector('[data-search-input]');
  const results = root.querySelector('[data-search-results]');
  const status = root.querySelector('[data-search-status]');
  const defaults = document.querySelector('[data-default-posts]');
  let indexPromise;

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  input.addEventListener('input', async function () {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.hidden = true;
      results.innerHTML = '';
      defaults.hidden = false;
      status.textContent = '';
      return;
    }
    try {
      indexPromise = indexPromise || fetch('/search.json').then(function (response) {
        if (!response.ok) throw new Error('search index unavailable');
        return response.json();
      });
      const items = await indexPromise;
      const matches = items.filter(function (item) {
        return [item.title, item.content, (item.tags || []).join(' ')].join(' ').toLowerCase().includes(query);
      }).slice(0, 12);
      defaults.hidden = true;
      results.hidden = false;
      results.innerHTML = matches.map(function (item) {
        return '<article class="search-result"><time>' + escapeHtml(item.date) + '</time><h3><a href="' + encodeURI(item.url) + '">' + escapeHtml(item.title) + '</a></h3><p>' + escapeHtml(item.summary) + '</p></article>';
      }).join('');
      status.textContent = matches.length ? '找到 ' + matches.length + ' 篇文章' : '没有找到匹配的文章';
    } catch (_) {
      status.textContent = '搜索索引暂时不可用，请稍后重试。';
    }
  });
})();
