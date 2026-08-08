(function () {
  'use strict';

  const tabsRoot = document.querySelector('[data-award-tabs]');
  if (!tabsRoot) return;

  const tabs = Array.from(tabsRoot.querySelectorAll('[data-award-year]'));
  const panels = Array.from(document.querySelectorAll('[data-award-panel]'));

  function activate(year, focus) {
    tabs.forEach(function (tab) {
      const active = tab.dataset.awardYear === year;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.dataset.awardPanel !== year;
    });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#year-' + year);
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activate(tab.dataset.awardYear, false); });
    tab.addEventListener('keydown', function (event) {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[next].dataset.awardYear, true);
    });
  });

  const requestedYear = window.location.hash.match(/^#year-(\d{4})$/);
  if (requestedYear && tabs.some(function (tab) { return tab.dataset.awardYear === requestedYear[1]; })) {
    activate(requestedYear[1], false);
  }
})();
