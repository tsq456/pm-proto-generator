/**
 * OB-style filter dropdown (static prototype).
 * Enum single: .ob-filter-item[data-filter-single]
 * Enum multi (query default): .ob-filter-multi — checkbox options, 重置 / 确定
 * Number range: .ob-filter-item.ob-filter-range
 * Form enums (.ob-enum-select) stay single and are handled by enum-select.js.
 */
(function () {
  function applied(item) {
    return {
      min: item.getAttribute('data-applied-min') || '',
      max: item.getAttribute('data-applied-max') || ''
    };
  }

  function writeDraft(item, min, max) {
    var minEl = item.querySelector('[data-range-min]');
    var maxEl = item.querySelector('[data-range-max]');
    if (minEl) minEl.value = min;
    if (maxEl) maxEl.value = max;
  }

  function formatLabel(item, min, max) {
    var nameEl = item.querySelector('.ob-filter-panel__title');
    var name = item.getAttribute('data-range-name') || (nameEl ? nameEl.textContent.trim() : '');
    var unit = item.getAttribute('data-range-unit') || '';
    var label = item.querySelector('[data-filter-label]');
    if (!label) return;
    if (!min && !max) label.textContent = name;
    else if (min && max) label.textContent = name + ' ' + min + '~' + max + unit;
    else if (min) label.textContent = name + ' ≥' + min + unit;
    else label.textContent = name + ' ≤' + max + unit;
  }

  function optionText(btn) {
    var label = btn.getAttribute('data-label');
    if (label) return label;
    var node = btn.querySelector('[data-filter-option-label]');
    if (node) return node.textContent.trim();
    return (btn.textContent || '').trim();
  }

  function isAllOption(btn) {
    var val = btn.hasAttribute('data-value') ? btn.getAttribute('data-value') : null;
    var text = optionText(btn);
    return val === '' || text === '全部';
  }

  function markPicked(btn, on) {
    btn.classList.toggle('is-picked', on);
    var box = btn.querySelector('.ob-check');
    if (box) box.classList.toggle('is-checked', on);
  }

  function syncDraft(item) {
    item.querySelectorAll('.ob-filter-panel__item').forEach(function (btn) {
      if (btn.hidden) return;
      markPicked(btn, btn.classList.contains('is-active'));
    });
  }

  function paintMulti(item) {
    var titleEl = item.querySelector('.ob-filter-panel__title');
    var name = titleEl ? titleEl.textContent.trim() : '';
    var labels = [];
    item.querySelectorAll('.ob-filter-panel__item.is-active').forEach(function (btn) {
      if (btn.hidden || isAllOption(btn)) return;
      labels.push(optionText(btn));
    });
    var text = item.querySelector('[data-filter-label]');
    if (!text) return;
    text.textContent = labels.length ? name + '：' + labels.join('、') : name;
    item.classList.toggle('has-value', labels.length > 0);
  }

  function commitMulti(item) {
    item.querySelectorAll('.ob-filter-panel__item').forEach(function (btn) {
      if (btn.hidden) return;
      btn.classList.toggle('is-active', btn.classList.contains('is-picked'));
    });
    paintMulti(item);
    item.classList.remove('is-open');
  }

  function clearMulti(item) {
    item.querySelectorAll('.ob-filter-panel__item').forEach(function (btn) {
      btn.classList.remove('is-active');
      markPicked(btn, false);
    });
    paintMulti(item);
  }

  function decorateMulti(item) {
    if (item.getAttribute('data-filter-multi') === 'ready') return;
    item.classList.add('ob-filter-multi');
    item.setAttribute('data-filter-multi', 'ready');
    item.querySelectorAll('.ob-filter-panel__item').forEach(function (btn) {
      if (isAllOption(btn)) {
        btn.hidden = true;
        btn.classList.remove('is-active');
        return;
      }
      if (btn.querySelector('.ob-check')) return;
      var text = optionText(btn);
      btn.textContent = '';
      var mark = document.createElement('span');
      mark.className = 'ob-check';
      mark.innerHTML = '<span class="ob-check__box" aria-hidden="true"></span>';
      var name = document.createElement('span');
      name.setAttribute('data-filter-option-label', '');
      name.textContent = text;
      btn.appendChild(mark);
      btn.appendChild(name);
    });
    var panel = item.querySelector('.ob-filter-panel');
    if (panel && !panel.querySelector('.ob-filter-panel__footer')) {
      var foot = document.createElement('div');
      foot.className = 'ob-filter-panel__footer';
      foot.innerHTML = '<button type="button" class="ob-link" data-filter-reset>重置</button>' +
        '<button type="button" class="ob-btn ob-btn--primary ob-btn--sm" data-filter-ok>确定</button>';
      panel.appendChild(foot);
    }
    paintMulti(item);
  }

  function isQueryEnum(item) {
    if (!item.closest('.ob-filter')) return false;
    if (item.classList.contains('ob-filter-range') || item.classList.contains('ob-enum-select')) return false;
    if (item.hasAttribute('data-filter-single')) return false;
    if (item.querySelector('[data-ob-cascader]')) return false;
    return !!item.querySelector('.ob-filter-panel__item');
  }

  function enhance(root) {
    (root || document).querySelectorAll('.ob-filter .ob-filter-item').forEach(function (item) {
      if (item.classList.contains('ob-filter-multi') || isQueryEnum(item)) decorateMulti(item);
    });
  }

  function restoreDraft(item) {
    if (item.classList.contains('ob-filter-range')) {
      var v = applied(item);
      writeDraft(item, v.min, v.max);
      return;
    }
    if (item.classList.contains('ob-filter-multi')) syncDraft(item);
  }

  function commitRange(item) {
    var minEl = item.querySelector('[data-range-min]');
    var maxEl = item.querySelector('[data-range-max]');
    var min = minEl && minEl.value ? minEl.value.trim() : '';
    var max = maxEl && maxEl.value ? maxEl.value.trim() : '';
    if (min !== '' && max !== '' && parseFloat(min) > parseFloat(max)) {
      var swap = min;
      min = max;
      max = swap;
    }
    writeDraft(item, min, max);
    if (min) item.setAttribute('data-applied-min', min);
    else item.removeAttribute('data-applied-min');
    if (max) item.setAttribute('data-applied-max', max);
    else item.removeAttribute('data-applied-max');
    formatLabel(item, min, max);
    item.classList.remove('is-open');
    item.dispatchEvent(new CustomEvent('ob-filter-range', { bubbles: true }));
  }

  function clearRange(item) {
    writeDraft(item, '', '');
    item.removeAttribute('data-applied-min');
    item.removeAttribute('data-applied-max');
    formatLabel(item, '', '');
    item.dispatchEvent(new CustomEvent('ob-filter-range', { bubbles: true }));
  }

  function closeAll(except) {
    document.querySelectorAll('.ob-filter-item.is-open').forEach(function (el) {
      if (el === except) return;
      restoreDraft(el);
      el.classList.remove('is-open');
    });
  }

  document.addEventListener('click', function (e) {
    var rangeOk = e.target.closest('[data-range-ok]');
    var rangeReset = e.target.closest('[data-range-reset]');
    var rangeItem = (rangeOk || rangeReset) && (rangeOk || rangeReset).closest('.ob-filter-range');
    if (rangeItem && rangeOk) {
      e.preventDefault();
      commitRange(rangeItem);
      return;
    }
    if (rangeItem && rangeReset) {
      e.preventDefault();
      clearRange(rangeItem);
      return;
    }

    var item = e.target.closest('.ob-filter-item');
    var multiOk = e.target.closest('[data-filter-ok]');
    var multiReset = e.target.closest('[data-filter-reset]');
    if (item && item.classList.contains('ob-filter-multi') && (multiOk || multiReset)) {
      e.preventDefault();
      if (multiOk) commitMulti(item);
      else clearMulti(item);
      return;
    }

    var trigger = e.target.closest('.ob-filter-trigger');
    var option = e.target.closest('.ob-filter-panel__item');

    if (option && item && item.classList.contains('ob-filter-multi')) {
      e.preventDefault();
      if (option.hidden) return;
      markPicked(option, !option.classList.contains('is-picked'));
      return;
    }

    if (option && item && !item.classList.contains('ob-enum-select')) {
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
      if (willOpen) restoreDraft(item);
      item.classList.toggle('is-open', willOpen);
      return;
    }

    if (!item) closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { enhance(document); });
  } else {
    enhance(document);
  }
})();
