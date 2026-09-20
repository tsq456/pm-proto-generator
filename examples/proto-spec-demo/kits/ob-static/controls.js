/**
 * OB static controls (P0/P1) — open/close + light toggles.
 * Pair with references/controls/*.md and components.css.
 * Does not replace filter-dropdown.js (list Filter panels).
 */
(function () {
  function closest(el, sel) {
    return el && el.closest ? el.closest(sel) : null;
  }

  function closePickers(except) {
    document
      .querySelectorAll(
        '.ob-datepicker.is-open, .ob-timepicker.is-open, .ob-cascader.is-open, .ob-treeselect.is-open'
      )
      .forEach(function (n) {
        if (n !== except) n.classList.remove('is-open');
      });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;

    var sw = closest(t, '[data-ob-switch]');
    if (sw && !sw.disabled && !sw.classList.contains('is-disabled')) {
      e.preventDefault();
      var on = !sw.classList.contains('is-checked');
      sw.classList.toggle('is-checked', on);
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      return;
    }

    var dpTrigger = closest(t, '.ob-datepicker__trigger');
    var dp = dpTrigger && closest(dpTrigger, '[data-ob-datepicker], .ob-datepicker');
    if (dpTrigger && dp) {
      e.preventDefault();
      e.stopPropagation();
      var openDp = !dp.classList.contains('is-open');
      closePickers(dp);
      dp.classList.toggle('is-open', openDp);
      var panel = dp.querySelector('.ob-datepicker__panel');
      if (panel) {
        if (openDp) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      }
      return;
    }

    var day = closest(t, '.ob-calendar__day');
    if (day && !day.classList.contains('is-empty') && !day.classList.contains('is-muted')) {
      var calRoot = closest(day, '.ob-datepicker');
      if (calRoot) {
        calRoot.querySelectorAll('.ob-calendar__day.is-selected').forEach(function (n) {
          n.classList.remove('is-selected');
        });
        day.classList.add('is-selected');
        var label = calRoot.querySelector('[data-ob-date-label]');
        var y = '';
        var title = calRoot.querySelector('.ob-calendar__title');
        if (title && label) {
          // keep existing label text if data-date present
          var ds = day.getAttribute('data-date');
          if (ds) label.textContent = ds;
          else {
            var m = /(\d{4})年(\d{1,2})月/.exec(title.textContent || '');
            var d = (day.textContent || '').replace(/\D/g, '');
            if (m && d) {
              label.textContent =
                m[1] + '-' + (m[2].length < 2 ? '0' + m[2] : m[2]) + '-' + (d.length < 2 ? '0' + d : d);
            }
          }
        }
        if (!calRoot.classList.contains('ob-datepicker--range')) {
          calRoot.classList.remove('is-open');
        }
      }
      return;
    }

    var tpTrigger = closest(t, '.ob-timepicker__trigger');
    var tp = tpTrigger && closest(tpTrigger, '[data-ob-timepicker], .ob-timepicker');
    if (tpTrigger && tp) {
      e.preventDefault();
      e.stopPropagation();
      closePickers(tp);
      tp.classList.toggle('is-open');
      return;
    }

    var cell = closest(t, '.ob-timepicker__cell');
    if (cell) {
      var col = closest(cell, '.ob-timepicker__col');
      if (col) {
        col.querySelectorAll('.ob-timepicker__cell.is-active').forEach(function (n) {
          n.classList.remove('is-active');
        });
        cell.classList.add('is-active');
      }
      return;
    }

    var timeOk = closest(t, '[data-ob-time-ok]');
    if (timeOk) {
      var timeRoot = closest(timeOk, '.ob-timepicker');
      if (timeRoot) {
        var hour = timeRoot.querySelector('[data-ob-time-col="hour"] .is-active');
        var minute = timeRoot.querySelector('[data-ob-time-col="minute"] .is-active');
        var tl = timeRoot.querySelector('[data-ob-time-label]');
        if (tl && hour && minute) {
          tl.textContent = (hour.textContent || '').trim() + ':' + (minute.textContent || '').trim();
        }
        timeRoot.classList.remove('is-open');
      }
      return;
    }

    var casTrigger = closest(t, '.ob-cascader__trigger');
    var cas = casTrigger && closest(casTrigger, '[data-ob-cascader], .ob-cascader');
    if (casTrigger && cas) {
      e.preventDefault();
      e.stopPropagation();
      closePickers(cas);
      cas.classList.toggle('is-open');
      return;
    }

    var casItem = closest(t, '.ob-cascader__item');
    if (casItem && !casItem.classList.contains('is-disabled')) {
      var menu = closest(casItem, '.ob-cascader__menu');
      if (menu) {
        menu.querySelectorAll('.ob-cascader__item.is-active').forEach(function (n) {
          n.classList.remove('is-active');
        });
        casItem.classList.add('is-active');
      }
      if (!casItem.querySelector('.ob-cascader__arrow')) {
        var root = closest(casItem, '.ob-cascader');
        if (root) {
          var parts = [];
          root.querySelectorAll('.ob-cascader__menu').forEach(function (m) {
            var a = m.querySelector('.ob-cascader__item.is-active');
            if (a) {
              var text = a.childNodes[0] ? a.childNodes[0].textContent.trim() : a.textContent.trim();
              parts.push(text.replace(/›/g, '').trim());
            }
          });
          var cl = root.querySelector('[data-ob-cascader-label]');
          if (cl) cl.textContent = parts.filter(Boolean).join(' / ');
          root.classList.remove('is-open');
        }
      }
      return;
    }

    var treeTrigger = closest(t, '.ob-treeselect__trigger');
    var treeSel = treeTrigger && closest(treeTrigger, '[data-ob-treeselect], .ob-treeselect');
    if (treeTrigger && treeSel) {
      e.preventDefault();
      e.stopPropagation();
      closePickers(treeSel);
      treeSel.classList.toggle('is-open');
      return;
    }

    var menuTitle = closest(t, '.ob-menu__group-title');
    if (menuTitle) {
      e.preventDefault();
      var group = closest(menuTitle, '.ob-menu__group');
      if (group) {
        var open = !group.classList.contains('is-open');
        group.classList.toggle('is-open', open);
        menuTitle.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      return;
    }

    var switcher = closest(t, '.ob-tree__switcher:not(.is-leaf)');
    if (switcher) {
      e.preventDefault();
      e.stopPropagation();
      var node = closest(switcher, '.ob-tree__node');
      if (node) node.classList.toggle('is-expanded');
      return;
    }

    var title = closest(t, '.ob-tree__title');
    if (title) {
      var treeroot = closest(title, '.ob-treeselect');
      if (treeroot) {
        treeroot.querySelectorAll('.ob-tree__title.is-selected').forEach(function (n) {
          n.classList.remove('is-selected');
        });
        title.classList.add('is-selected');
        var tlab = treeroot.querySelector('[data-ob-tree-label]');
        if (tlab) tlab.textContent = title.textContent.trim();
        treeroot.classList.remove('is-open');
      }
      return;
    }

    if (
      !closest(t, '.ob-datepicker') &&
      !closest(t, '.ob-timepicker') &&
      !closest(t, '.ob-cascader') &&
      !closest(t, '.ob-treeselect')
    ) {
      closePickers(null);
    }
  });

  /** 含当前页的侧栏分组默认展开 */
  function openActiveMenuGroups() {
    document.querySelectorAll('.ob-menu__item.is-active').forEach(function (item) {
      var g = item.closest('.ob-menu__group');
      if (g) {
        g.classList.add('is-open');
        var btn = g.querySelector('.ob-menu__group-title');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openActiveMenuGroups);
  } else {
    openActiveMenuGroups();
  }

  /**
   * 顶栏多开页签。无固定首页；均可关闭；仅剩当前页时不显示关闭。
   * 状态按目录隔离，存在 sessionStorage。
   */
  var PAGE_TAB_MAX = 20;
  var PAGE_TAB_PLACEHOLDER = {
    '加载中…': 1,
    加载中: 1,
    未找到记录: 1,
    加载失败: 1
  };

  function pageTabScope() {
    return 'ob-page-tabs:' + location.pathname.replace(/[^/]*$/, '');
  }

  function pageTabFile() {
    var parts = location.pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1] || '');
  }

  function pageTabHref() {
    return pageTabFile() + (location.search || '');
  }

  function pageTabRead() {
    try {
      var raw = sessionStorage.getItem(pageTabScope());
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(function (t) {
        return t && typeof t.href === 'string' && t.href && typeof t.title === 'string' && t.title;
      });
    } catch (err) {
      return [];
    }
  }

  function pageTabWrite(list) {
    try {
      sessionStorage.setItem(pageTabScope(), JSON.stringify(list));
    } catch (err) {}
  }

  function pageTabTitle(nav) {
    var explicit = nav.getAttribute('data-page-title');
    if (explicit && explicit.trim()) return explicit.trim();
    var h1 = document.querySelector('.ob-page-title h1');
    var text = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
    if (text && !PAGE_TAB_PLACEHOLDER[text]) return text;
    var file = pageTabFile();
    var links = document.querySelectorAll('.ob-menu a[href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var name = href.split('#')[0].split('?')[0].split('/').pop();
      if (name === file) {
        var span = links[i].querySelector('span');
        var label = (span || links[i]).textContent.replace(/\s+/g, ' ').trim();
        if (label) return label;
      }
    }
    var doc = (document.title || '').split(/[·|]/)[0].trim();
    return doc || '未命名页面';
  }

  function pageTabRender(nav, list, current) {
    nav.setAttribute('role', 'tablist');
    nav.innerHTML = '';
    list.forEach(function (tab) {
      var on = tab.href === current;
      var item = document.createElement('div');
      item.className = 'ob-page-tab' + (on ? ' is-active' : '');
      item.setAttribute('role', 'presentation');
      var link = document.createElement('a');
      link.className = 'ob-page-tab__link';
      link.href = tab.href;
      link.setAttribute('role', 'tab');
      link.setAttribute('aria-selected', on ? 'true' : 'false');
      link.textContent = tab.title;
      item.appendChild(link);
      if (list.length > 1) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ob-page-tab__close';
        btn.setAttribute('aria-label', '关闭');
        btn.setAttribute('data-tab-href', tab.href);
        item.appendChild(btn);
      }
      nav.appendChild(item);
    });
    var active = nav.querySelector('.ob-page-tab.is-active');
    if (active && active.scrollIntoView) {
      try {
        active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch (err) {}
    }
  }

  function mountPageTabs() {
    var nav = document.querySelector('header .ob-page-tabs, .ob-header .ob-page-tabs');
    if (!nav) nav = document.querySelector('.ob-page-tabs');
    if (!nav) return;

    function sync(forceRender) {
      var href = pageTabHref();
      if (!href || href === '.html') return;
      var title = pageTabTitle(nav);
      var list = pageTabRead();
      var found = false;
      var changed = false;
      list.forEach(function (t) {
        if (t.href !== href) return;
        found = true;
        if (t.title !== title) {
          t.title = title;
          changed = true;
        }
      });
      if (!found) {
        list.push({ href: href, title: title });
        changed = true;
        if (list.length > PAGE_TAB_MAX) {
          var currentItem = null;
          var others = [];
          list.forEach(function (t) {
            if (t.href === href) currentItem = t;
            else others.push(t);
          });
          others = others.slice(Math.max(0, others.length - (PAGE_TAB_MAX - 1)));
          list = currentItem ? others.concat([currentItem]) : others;
        }
      }
      if (changed) pageTabWrite(list);
      if (changed || forceRender) pageTabRender(nav, pageTabRead(), href);
    }

    nav.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.ob-page-tab__close') : null;
      if (!btn || !nav.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      var href = btn.getAttribute('data-tab-href');
      var list = pageTabRead();
      if (list.length < 2) return;
      var idx = -1;
      for (var i = 0; i < list.length; i++) {
        if (list[i].href === href) idx = i;
      }
      if (idx < 0) return;
      var next = list.slice(0, idx).concat(list.slice(idx + 1));
      pageTabWrite(next);
      if (href === pageTabHref()) {
        var neighbor = next[idx - 1] || next[idx] || next[0];
        if (neighbor) location.href = neighbor.href;
        return;
      }
      pageTabRender(nav, next, pageTabHref());
    });

    sync(true);

    var h1 = document.querySelector('.ob-page-title h1');
    if (h1 && window.MutationObserver) {
      var obs = new MutationObserver(function () {
        sync(false);
      });
      obs.observe(h1, { childList: true, characterData: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPageTabs);
  } else {
    mountPageTabs();
  }

  /** 业务轻提示（对齐 Message；勿用页内 .ob-alert 冒充） */
  function ensureToastHost() {
    var host = document.querySelector('.ob-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'ob-toast-host';
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }

  function showToast(msg, opts) {
    opts = opts || {};
    var type = opts.type || 'info';
    var duration = opts.duration != null ? opts.duration : 2200;
    var host = ensureToastHost();
    var t = document.createElement('div');
    t.className = 'ob-toast' + (type && type !== 'info' ? ' ob-toast--' + type : '');
    t.setAttribute('role', 'status');
    t.textContent = msg == null ? '' : String(msg);
    host.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add('is-show');
    });
    setTimeout(function () {
      t.classList.remove('is-show');
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 220);
    }, duration);
    return t;
  }

  window.ObToast = showToast;
})();
