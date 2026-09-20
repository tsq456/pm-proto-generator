/**
 * 气泡卡片：悬停 [data-ob-popover] 时在上方（空间不够则在下方）展示。
 * data-ob-popover：正文。data-ob-popover-title：可选标题。
 * 正式实现用 @oceanbase/design 的 Popover。
 */
(function () {
  var pop = null;
  var current = null;
  var showTimer = 0;
  var hideTimer = 0;

  function ensure() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'ob-popover ob-popover--top';
    pop.setAttribute('role', 'tooltip');
    pop.innerHTML =
      '<div class="ob-popover__arrow" aria-hidden="true"></div>' +
      '<div class="ob-popover__inner">' +
        '<div class="ob-popover__title" hidden></div>' +
        '<div class="ob-popover__body"></div>' +
      '</div>';
    document.body.appendChild(pop);
    pop.addEventListener('mouseenter', function () {
      window.clearTimeout(hideTimer);
    });
    pop.addEventListener('mouseleave', function (e) {
      if (current && e.relatedTarget && current.contains(e.relatedTarget)) return;
      scheduleHide();
    });
    return pop;
  }

  function place(trigger) {
    var rect = trigger.getBoundingClientRect();
    var gap = 10;
    pop.classList.add('is-open');
    pop.style.visibility = 'hidden';
    pop.style.left = '0px';
    pop.style.top = '0px';
    var box = pop.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - box.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - box.width - 8));
    var top = rect.top - box.height - gap;
    var above = top >= 8;
    if (!above) top = rect.bottom + gap;
    pop.classList.toggle('ob-popover--top', above);
    pop.classList.toggle('ob-popover--bottom', !above);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    var arrow = pop.querySelector('.ob-popover__arrow');
    var center = rect.left + rect.width / 2 - left;
    center = Math.max(16, Math.min(center, box.width - 16));
    arrow.style.left = center + 'px';
    arrow.style.marginLeft = '-8px';
    pop.style.visibility = '';
  }

  function show(trigger) {
    var content = trigger.getAttribute('data-ob-popover');
    if (!content) return;
    var title = trigger.getAttribute('data-ob-popover-title') || '';
    var node = ensure();
    var titleEl = node.querySelector('.ob-popover__title');
    var bodyEl = node.querySelector('.ob-popover__body');
    titleEl.textContent = title;
    titleEl.hidden = !title;
    bodyEl.textContent = content;
    current = trigger;
    place(trigger);
  }

  function hide() {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    current = null;
    if (pop) pop.classList.remove('is-open');
  }

  function scheduleHide() {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(hide, 80);
  }

  document.addEventListener('mouseover', function (e) {
    var trigger = e.target && e.target.closest && e.target.closest('[data-ob-popover]');
    if (!trigger) return;
    if (current === trigger && pop && pop.classList.contains('is-open')) {
      window.clearTimeout(hideTimer);
      return;
    }
    window.clearTimeout(hideTimer);
    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(function () { show(trigger); }, 80);
  });

  document.addEventListener('mouseout', function (e) {
    if (!current) return;
    var next = e.relatedTarget;
    if (next && (current.contains(next) || (pop && pop.contains(next)))) return;
    var fromTrigger = e.target && e.target.closest && e.target.closest('[data-ob-popover]') === current;
    var fromPop = pop && e.target && pop.contains(e.target);
    if (!fromTrigger && !fromPop) return;
    scheduleHide();
  });

  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);

  window.ObPopover = { hide: hide };
})();
