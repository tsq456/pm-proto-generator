/**
 * OB-style filter dropdown (static prototype).
 * Usage: .ob-filter-item > .ob-filter-trigger + .ob-filter-panel
 */
(function () {
  function closeAll(except) {
    document.querySelectorAll('.ob-filter-item.is-open').forEach(function (el) {
      if (el !== except) el.classList.remove('is-open');
    });
  }

  document.addEventListener('click', function (e) {
    var item = e.target.closest('.ob-filter-item');
    var trigger = e.target.closest('.ob-filter-trigger');
    var option = e.target.closest('.ob-filter-panel__item');

    if (option && item) {
      item.querySelectorAll('.ob-filter-panel__item.is-active').forEach(function (n) {
        n.classList.remove('is-active');
      });
      option.classList.add('is-active');
      var label = option.getAttribute('data-label') || option.textContent.trim();
      var text = item.querySelector('[data-filter-label]');
      if (text) text.textContent = label;
      item.classList.remove('is-open');
      return;
    }

    if (trigger && item) {
      var willOpen = !item.classList.contains('is-open');
      closeAll(item);
      item.classList.toggle('is-open', willOpen);
      return;
    }

    if (!item) closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });
})();
