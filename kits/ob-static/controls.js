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
    if (dpTrigger && dp && !dp.hasAttribute('data-ob-live')) {
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
    if (day && !day.classList.contains('is-empty') && !day.classList.contains('is-muted') && !closest(day, '[data-ob-live]')) {
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
    if (tpTrigger && tp && !tp.hasAttribute('data-ob-live')) {
      e.preventDefault();
      e.stopPropagation();
      closePickers(tp);
      tp.classList.toggle('is-open');
      return;
    }

    var cell = closest(t, '.ob-timepicker__cell');
    if (cell && !closest(cell, '[data-ob-live]')) {
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
    if (timeOk && !closest(timeOk, '[data-ob-live]')) {
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
      if (cas.hasAttribute('data-ob-cascader-source')) return;
      e.preventDefault();
      e.stopPropagation();
      closePickers(cas);
      cas.classList.toggle('is-open');
      return;
    }

    var casItem = closest(t, '.ob-cascader__item');
    if (casItem && closest(casItem, '.ob-cascader') && closest(casItem, '.ob-cascader').hasAttribute('data-ob-cascader-source')) {
      return;
    }
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

  function pageTabKey(href) {
    if (!href) return '';
    try {
      var u = new URL(href, location.href);
      var name = decodeURIComponent(u.pathname.split('/').pop() || '');
      return name + (u.search || '');
    } catch (err) {
      return String(href).split('#')[0];
    }
  }

  function pageTabHeadingPending() {
    var h1 = document.querySelector('.ob-page-title h1');
    var text = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
    return !text || !!PAGE_TAB_PLACEHOLDER[text];
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
      item.setAttribute('data-href', tab.href);
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

  function pageTabPaintTitle(nav, href, title) {
    var tabs = nav.querySelectorAll('.ob-page-tab');
    for (var i = 0; i < tabs.length; i++) {
      if ((tabs[i].getAttribute('data-href') || '') !== href) continue;
      var link = tabs[i].querySelector('.ob-page-tab__link');
      if (!link) return false;
      if (link.textContent !== title) link.textContent = title;
      return true;
    }
    return false;
  }

  function pageTabIndex(list, href) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].href === href) return i;
    }
    return -1;
  }

  function pageTabCommit(nav, next, fallbackHref) {
    pageTabWrite(next);
    var current = pageTabHref();
    var still = pageTabIndex(next, current) >= 0;
    closePageTabMenu();
    if (!still) {
      if (fallbackHref) location.href = fallbackHref;
      return;
    }
    pageTabRender(nav, next, current);
  }

  function pageTabCloseOne(nav, href) {
    var list = pageTabRead();
    if (list.length < 2) return;
    var idx = pageTabIndex(list, href);
    if (idx < 0) return;
    var next = list.slice(0, idx).concat(list.slice(idx + 1));
    var neighbor = next[idx - 1] || next[idx] || next[0];
    pageTabCommit(nav, next, neighbor && neighbor.href);
  }

  function pageTabCloseRight(nav, href) {
    var list = pageTabRead();
    var idx = pageTabIndex(list, href);
    if (idx < 0 || idx >= list.length - 1) return;
    pageTabCommit(nav, list.slice(0, idx + 1), href);
  }

  function pageTabCloseOthers(nav, href) {
    var list = pageTabRead();
    if (list.length < 2) return;
    var idx = pageTabIndex(list, href);
    if (idx < 0) return;
    pageTabCommit(nav, [list[idx]], href);
  }

  function closePageTabMenu() {
    var menu = document.querySelector('.ob-page-tab-menu');
    if (menu) menu.hidden = true;
  }

  function openPageTabMenu(nav, href, x, y) {
    var menu = document.querySelector('.ob-page-tab-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.className = 'ob-page-tab-menu';
      menu.setAttribute('role', 'menu');
      menu.hidden = true;
      menu.innerHTML =
        '<button type="button" class="ob-page-tab-menu__item" role="menuitem" data-tab-act="close">关闭</button>' +
        '<button type="button" class="ob-page-tab-menu__item" role="menuitem" data-tab-act="close-right">关闭右侧页面</button>' +
        '<button type="button" class="ob-page-tab-menu__item" role="menuitem" data-tab-act="close-others">关闭其他页面</button>';
      document.body.appendChild(menu);
      menu.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest ? e.target.closest('.ob-page-tab-menu__item') : null;
        if (!btn || btn.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        var act = btn.getAttribute('data-tab-act');
        var target = menu.getAttribute('data-href') || '';
        var host = menu._pageTabNav;
        closePageTabMenu();
        if (!host || !target) return;
        if (act === 'close') pageTabCloseOne(host, target);
        else if (act === 'close-right') pageTabCloseRight(host, target);
        else if (act === 'close-others') pageTabCloseOthers(host, target);
      });
      menu.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });
    }
    var list = pageTabRead();
    var idx = pageTabIndex(list, href);
    var only = list.length < 2;
    var noRight = idx < 0 || idx >= list.length - 1;
    menu.querySelector('[data-tab-act="close"]').disabled = only;
    menu.querySelector('[data-tab-act="close-right"]').disabled = noRight;
    menu.querySelector('[data-tab-act="close-others"]').disabled = only;
    menu.setAttribute('data-href', href);
    menu._pageTabNav = nav;
    menu.hidden = false;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    var rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) menu.style.left = Math.max(8, window.innerWidth - rect.width - 8) + 'px';
    if (rect.bottom > window.innerHeight - 8) menu.style.top = Math.max(8, window.innerHeight - rect.height - 8) + 'px';
  }

  function mountPageTabs() {
    var nav = document.querySelector('header .ob-page-tabs, .ob-header .ob-page-tabs');
    if (!nav) nav = document.querySelector('.ob-page-tabs');
    if (!nav) return;

    function sync(forceRender) {
      var href = pageTabHref();
      if (!href || href === '.html') return;
      var pending = pageTabHeadingPending();
      var title = pageTabTitle(nav);
      var list = pageTabRead();
      var found = false;
      var changed = false;
      var titleOnly = false;
      list.forEach(function (t) {
        if (t.href !== href) return;
        found = true;
        if (!pending && t.title !== title) {
          t.title = title;
          changed = true;
          titleOnly = true;
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
      if (forceRender || (changed && !titleOnly) || (changed && !pageTabPaintTitle(nav, href, title))) {
        pageTabRender(nav, pageTabRead(), href);
      }
    }

    nav.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.ob-page-tab__close') : null;
      if (btn && nav.contains(btn)) {
        e.preventDefault();
        e.stopPropagation();
        pageTabCloseOne(nav, btn.getAttribute('data-tab-href'));
        return;
      }
      var link = e.target && e.target.closest ? e.target.closest('.ob-page-tab__link') : null;
      if (!link || !nav.contains(link)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var tab = link.closest('.ob-page-tab');
      var dest = (tab && tab.getAttribute('data-href')) || link.getAttribute('href') || '';
      if (pageTabKey(dest) === pageTabHref()) e.preventDefault();
    });

    nav.addEventListener('contextmenu', function (e) {
      var tab = e.target && e.target.closest ? e.target.closest('.ob-page-tab') : null;
      if (!tab || !nav.contains(tab)) return;
      e.preventDefault();
      openPageTabMenu(nav, tab.getAttribute('data-href') || '', e.clientX, e.clientY);
    });

    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.ob-page-tab-menu')) return;
      closePageTabMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePageTabMenu();
    });
    window.addEventListener('resize', closePageTabMenu);
    nav.addEventListener('scroll', closePageTabMenu);

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

  function mountTablePins() {
    document.querySelectorAll('.ob-table-wrap').forEach(function (wrap) {
      if (wrap.getAttribute('data-pin-bound') === '1') return;
      if (!wrap.querySelector('th.ob-table__actions')) return;
      wrap.setAttribute('data-pin-bound', '1');
      var pin = document.createElement('div');
      pin.className = 'ob-table-pin';
      pin.setAttribute('aria-hidden', 'true');
      wrap.parentNode.insertBefore(pin, wrap.nextSibling);
      var host = pin.parentNode;
      if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
      function sync() {
        var th = wrap.querySelector('th.ob-table__actions');
        var overflow = wrap.scrollWidth > wrap.clientWidth + 1;
        pin.classList.toggle('is-on', !!(overflow && th));
        if (!overflow || !th) return;
        var hr = host.getBoundingClientRect();
        var wr = wrap.getBoundingClientRect();
        var col = th.getBoundingClientRect().width;
        pin.style.top = wr.top - hr.top + 'px';
        pin.style.height = wrap.clientHeight + 'px';
        pin.style.left = wr.right - hr.left - col - 16 + 'px';
      }
      wrap.addEventListener('scroll', sync);
      window.addEventListener('resize', sync);
      if (window.ResizeObserver) new ResizeObserver(sync).observe(wrap);
      if (window.MutationObserver) {
        new MutationObserver(sync).observe(wrap, { childList: true, subtree: true });
      }
      sync();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountTablePins);
  }
  mountTablePins();

  var MAP_ADDR = [
    "福建省福州市长乐区滨海大道 18 号",
    "福建省福州市长乐区空港大道旁",
    "福建省福州市长乐区空港大道科创北路 6 号",
    "福建省福州市长乐区文武砂街道梅峰路 222-1 号",
    "福建省福州市长乐区湖南镇光电路 9 号",
    "福建省福州市长乐区漳港街道海丝路 3 号",
  ];
  var mapTarget = null;
  var mapPicked = "";

  function ensureMapModal() {
    var mask = document.getElementById("obMapPickMask");
    if (mask) return mask;
    mask = document.createElement("div");
    mask.className = "ob-mask";
    mask.id = "obMapPickMask";
    mask.innerHTML =
      '<div class="ob-modal ob-modal--wide" id="obMapPickModal" role="dialog" aria-modal="true">' +
      '<div class="ob-modal__head"><strong class="ob-modal__title" data-ob-map-title>地图选点</strong>' +
      '<button type="button" class="ob-modal__close" data-ob-map-close aria-label="关闭"></button></div>' +
      '<div class="ob-modal__body">' +
      '<div class="ob-map-canvas" data-ob-map-canvas><span class="ob-map-pin" data-ob-map-pin hidden></span></div>' +
      '<p class="ob-map-canvas__hint" data-ob-map-hint>在地图上点击选点，将生成地址</p>' +
      '<div class="ob-field" style="margin-top:12px"><label class="ob-field__label">地址</label>' +
      '<input class="ob-input" readonly data-ob-map-preview placeholder="请在地图上选点" /></div>' +
      "</div>" +
      '<div class="ob-modal__foot">' +
      '<button type="button" class="ob-btn ob-btn--default" data-ob-map-close>取消</button>' +
      '<button type="button" class="ob-btn ob-btn--primary" data-ob-map-ok>确定</button>' +
      "</div></div>";
    document.body.appendChild(mask);
    return mask;
  }

  function openMap(opts) {
    opts = opts || {};
    var mask = ensureMapModal();
    var modal = document.getElementById("obMapPickModal");
    var canvas = mask.querySelector("[data-ob-map-canvas]");
    var pin = mask.querySelector("[data-ob-map-pin]");
    var preview = mask.querySelector("[data-ob-map-preview]");
    var title = mask.querySelector("[data-ob-map-title]");
    var hint = mask.querySelector("[data-ob-map-hint]");
    var ok = mask.querySelector("[data-ob-map-ok]");
    mapTarget = opts.target || null;
    mapPicked = opts.address || "";
    if (title) title.textContent = opts.readonly ? "查看地图" : "地图选点";
    if (hint) hint.textContent = opts.readonly ? "当前地址在地图上的位置" : "在地图上点击选点，将生成地址";
    if (ok) ok.style.display = opts.readonly ? "none" : "";
    if (canvas) canvas.classList.toggle("is-readonly", !!opts.readonly);
    if (preview) preview.value = mapPicked;
    if (pin) {
      if (mapPicked) {
        pin.hidden = false;
        pin.style.left = "46%";
        pin.style.top = "42%";
      } else {
        pin.hidden = true;
      }
    }
    mask.classList.add("is-open");
    if (modal) modal.classList.add("is-open");
  }

  function closeMap() {
    var mask = document.getElementById("obMapPickMask");
    var modal = document.getElementById("obMapPickModal");
    if (mask) mask.classList.remove("is-open");
    if (modal) modal.classList.remove("is-open");
    mapTarget = null;
  }

  function syncTreeRows(table) {
    var rows = [].slice.call(table.querySelectorAll("tbody tr[data-tree-id]"));
    var byId = {};
    rows.forEach(function (tr) {
      byId[tr.getAttribute("data-tree-id")] = tr;
    });
    rows.forEach(function (tr) {
      var hide = false;
      var parent = tr.getAttribute("data-tree-parent") || "";
      var guard = 0;
      while (parent && guard < 24) {
        var prow = byId[parent];
        if (!prow) break;
        var sw = prow.querySelector(".ob-table-tree__switcher");
        if (sw && !sw.classList.contains("is-leaf") && sw.getAttribute("aria-expanded") !== "true") {
          hide = true;
          break;
        }
        parent = prow.getAttribute("data-tree-parent") || "";
        guard++;
      }
      tr.classList.toggle("is-tree-hidden", hide);
    });
  }

  var previewItems = [];
  var previewIndex = 0;

  function ensureImagePreview() {
    var mask = document.getElementById("obPreviewMask");
    if (mask) return mask;
    mask = document.createElement("div");
    mask.className = "ob-preview";
    mask.id = "obPreviewMask";
    mask.innerHTML =
      '<button type="button" class="ob-preview__nav ob-preview__nav--prev" data-ob-preview-nav="prev" aria-label="上一张">‹</button>' +
      '<img class="ob-preview__img" alt="" />' +
      '<button type="button" class="ob-preview__nav ob-preview__nav--next" data-ob-preview-nav="next" aria-label="下一张">›</button>' +
      '<button type="button" class="ob-preview__close" data-ob-preview-close aria-label="关闭">×</button>';
    document.body.appendChild(mask);
    return mask;
  }

  function showImagePreview() {
    var mask = ensureImagePreview();
    var item = previewItems[previewIndex];
    var img = mask.querySelector(".ob-preview__img");
    if (img && item) {
      img.src = item.getAttribute("data-ob-preview") || "";
      img.alt = item.getAttribute("aria-label") || "图片预览";
    }
    var prev = mask.querySelector('[data-ob-preview-nav="prev"]');
    var next = mask.querySelector('[data-ob-preview-nav="next"]');
    if (prev) prev.hidden = previewIndex <= 0;
    if (next) next.hidden = previewIndex >= previewItems.length - 1;
    mask.classList.add("is-open");
  }

  function openImagePreview(item) {
    var gallery = item.closest("[data-ob-gallery]");
    previewItems = gallery
      ? Array.prototype.slice.call(gallery.querySelectorAll("[data-ob-preview]"))
      : [item];
    previewIndex = Math.max(0, previewItems.indexOf(item));
    showImagePreview();
  }

  function closeImagePreview() {
    var mask = document.getElementById("obPreviewMask");
    if (mask) mask.classList.remove("is-open");
  }

  function stepImagePreview(step) {
    var next = previewIndex + step;
    if (next < 0 || next >= previewItems.length) return;
    previewIndex = next;
    showImagePreview();
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var treeSw = t.closest(".ob-table-tree__switcher");
    if (treeSw) {
      if (treeSw.classList.contains("is-leaf")) return;
      e.preventDefault();
      e.stopPropagation();
      var opened = treeSw.getAttribute("aria-expanded") === "true";
      treeSw.setAttribute("aria-expanded", opened ? "false" : "true");
      treeSw.setAttribute("aria-label", opened ? "展开" : "收起");
      var table = treeSw.closest("table");
      if (table) syncTreeRows(table);
      return;
    }

    if (t.closest("[data-ob-preview-close]") || t.id === "obPreviewMask") {
      closeImagePreview();
      return;
    }

    var previewNav = t.closest("[data-ob-preview-nav]");
    if (previewNav) {
      e.preventDefault();
      stepImagePreview(previewNav.getAttribute("data-ob-preview-nav") === "next" ? 1 : -1);
      return;
    }

    var previewItem = t.closest("[data-ob-preview]");
    if (previewItem) {
      e.preventDefault();
      openImagePreview(previewItem);
      return;
    }

    var uploadRemove = t.closest("[data-ob-upload-remove]");
    if (uploadRemove) {
      e.preventDefault();
      var uploadNode = uploadRemove.closest(".ob-upload__card") || uploadRemove.closest(".ob-upload__item");
      if (uploadNode) uploadNode.remove();
      if (window.ObToast) window.ObToast("已删除", { type: "success" });
      return;
    }

    var pictureAdd = t.closest(".ob-upload--picture > .ob-upload__thumb");
    if (pictureAdd && pictureAdd.tagName === "BUTTON") {
      e.preventDefault();
      if (window.ObToast) window.ObToast("已添加图片", { type: "success" });
      return;
    }

    var filePick = t.closest(".ob-upload:not(.ob-upload--picture) .ob-upload__dragger");
    if (filePick && filePick.id !== "obDrawPick") {
      e.preventDefault();
      if (window.ObToast) window.ObToast("已添加文件", { type: "success" });
      return;
    }

    var mapOpen = t.closest("[data-ob-map-open]");
    if (mapOpen) {
      e.preventDefault();
      var inputId = mapOpen.getAttribute("data-ob-map-open");
      var input = inputId ? document.getElementById(inputId) : null;
      openMap({ target: input, address: input ? input.value : "", readonly: false });
      return;
    }

    var mapView = t.closest("[data-ob-map-view]");
    if (mapView) {
      e.preventDefault();
      var addr = mapView.getAttribute("data-ob-map-view") || "";
      if (!addr || addr === "—") {
        if (window.ObToast) window.ObToast("暂无地址", { type: "info" });
        return;
      }
      openMap({ readonly: true, address: addr });
      return;
    }

    var canvas = t.closest("[data-ob-map-canvas]");
    if (canvas && !canvas.classList.contains("is-readonly")) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var col = x < rect.width / 2 ? 0 : 1;
      var row = y < rect.height / 3 ? 0 : y < (rect.height * 2) / 3 ? 1 : 2;
      mapPicked = MAP_ADDR[row * 2 + col] || MAP_ADDR[0];
      var pin = canvas.querySelector("[data-ob-map-pin]");
      if (pin) {
        pin.hidden = false;
        pin.style.left = x + "px";
        pin.style.top = y + "px";
      }
      var preview = document.querySelector("[data-ob-map-preview]");
      if (preview) preview.value = mapPicked;
      return;
    }

    if (t.closest("[data-ob-map-ok]")) {
      e.preventDefault();
      if (!mapPicked) {
        if (window.ObToast) window.ObToast("请在地图上选点", { type: "info" });
        return;
      }
      if (mapTarget) mapTarget.value = mapPicked;
      closeMap();
      return;
    }

    if (t.closest("[data-ob-map-close]")) {
      e.preventDefault();
      closeMap();
    }
  });

  var ROW_BOX =
    '<label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-row /><span class="ob-check__box"></span></label>';

  function headBoxHtml(tree) {
    var box =
      '<label class="ob-check"><input type="checkbox" class="ob-check__input" data-table-check-all /><span class="ob-check__box"></span></label>';
    if (!tree) return box;
    return '<span class="ob-table-select__lead"><span class="ob-table-tree__switcher is-leaf" aria-hidden="true"></span>' + box + '</span>';
  }

  function cellText(el) {
    if (!el) return '';
    var clone = el.cloneNode(true);
    clone.querySelectorAll('.ob-check, .ob-table-tree__switcher').forEach(function (n) { n.remove(); });
    return clone.textContent.replace(/\s/g, '');
  }

  function isCheckCell(cell) {
    if (!cell) return false;
    if (cell.classList.contains('ob-table__select')) return true;
    if (!cell.querySelector('.ob-check')) return false;
    return !cellText(cell);
  }

  function isBlankHead(th) {
    if (!th || th.classList.contains('ob-table__actions')) return false;
    if (th.querySelector('.ob-check, button, a')) return false;
    return !th.textContent.replace(/\s/g, '');
  }

  function rowChecks(table) {
    var list = [];
    table.querySelectorAll('tbody > tr').forEach(function (tr) {
      if (tr.classList.contains('is-tree-hidden')) return;
      var td = tr.querySelector(':scope > td.ob-table__select');
      if (!td) {
        var first = tr.querySelector(':scope > td');
        if (first && isCheckCell(first) && !(first.hasAttribute('colspan') && parseInt(first.getAttribute('colspan'), 10) > 1)) td = first;
      }
      var input = td && td.querySelector('input[type="checkbox"]');
      if (input) list.push(input);
    });
    return list;
  }

  function ownSelectAll(input) {
    return !!(input && (input.id === 'assetPickAll' || input.hasAttribute('data-draw-all') || input.hasAttribute('data-asset-pick')));
  }

  function tableNeedsSelect(table) {
    return !(
      table.classList.contains('ob-table--no-select') ||
      table.hasAttribute('data-table-no-select')
    );
  }

  function stripSelect(table) {
    table.querySelectorAll('thead th.ob-table__select, tbody td.ob-table__select').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    var wrap = table.closest('.ob-table-wrap');
    var after = wrap || table;
    var footer = nextFooter(after);
    if (footer && footer.classList.contains('ob-table-footer--select-only') && footer.parentNode) {
      footer.parentNode.removeChild(footer);
    }
  }

  function placeTreeLead(tr, td) {
    var table = tr.closest('table');
    if (!table || !table.classList.contains('ob-table--tree')) return;
    var lead = td.querySelector('.ob-table-select__lead');
    if (!lead) {
      lead = document.createElement('span');
      lead.className = 'ob-table-select__lead';
      while (td.firstChild) lead.appendChild(td.firstChild);
      td.appendChild(lead);
    }
    var name = tr.querySelector('.ob-table-tree__name');
    var sw = tr.querySelector('.ob-table-tree__switcher');
    if (sw && name && name.contains(sw)) {
      var depth = '0';
      var style = name.getAttribute('style') || '';
      var matched = style.match(/--ob-tree-depth:\s*(\d+)/);
      if (matched) depth = matched[1];
      lead.style.setProperty('--ob-tree-depth', depth);
      lead.insertBefore(sw, lead.firstChild);
      var next = style.replace(/--ob-tree-depth:\s*\d+\s*;?/g, '').trim();
      if (next) name.setAttribute('style', next);
      else name.removeAttribute('style');
    } else if (!lead.querySelector('.ob-table-tree__switcher')) {
      var leaf = document.createElement('button');
      leaf.type = 'button';
      leaf.className = 'ob-table-tree__switcher is-leaf';
      leaf.tabIndex = -1;
      leaf.setAttribute('aria-hidden', 'true');
      lead.insertBefore(leaf, lead.firstChild);
    }
  }

  function ensureHead(table) {
    var row = table.querySelector('thead tr');
    if (!row) return;
    var first = row.querySelector('th');
    if (first && (first.classList.contains('ob-table__select') || isCheckCell(first) || isBlankHead(first))) {
      first.classList.add('ob-table__select');
      if (!first.querySelector('input[type="checkbox"]')) first.innerHTML = headBoxHtml(table.classList.contains('ob-table--tree'));
      else if (table.classList.contains('ob-table--tree') && !first.querySelector('.ob-table-tree__switcher')) {
        var lead = document.createElement('span');
        lead.className = 'ob-table-select__lead';
        var spacer = document.createElement('span');
        spacer.className = 'ob-table-tree__switcher is-leaf';
        spacer.setAttribute('aria-hidden', 'true');
        lead.appendChild(spacer);
        while (first.firstChild) lead.appendChild(first.firstChild);
        first.appendChild(lead);
      }
      var headInput = first.querySelector('input[type="checkbox"]');
      if (headInput && !ownSelectAll(headInput) && !headInput.hasAttribute('data-table-check-all')) {
        headInput.setAttribute('data-table-check-all', '');
      }
      return;
    }
    if (row.querySelector('th.ob-table__select')) return;
    var th = document.createElement('th');
    th.className = 'ob-table__select';
    th.innerHTML = headBoxHtml(table.classList.contains('ob-table--tree'));
    row.insertBefore(th, row.firstChild);
  }

  function ensureRow(tr) {
    if (tr.querySelector(':scope > td.ob-table__select')) {
      placeTreeLead(tr, tr.querySelector(':scope > td.ob-table__select'));
      return;
    }
    var first = tr.querySelector(':scope > td');
    if (first && isCheckCell(first)) {
      first.classList.add('ob-table__select');
      var input = first.querySelector('input[type="checkbox"]');
      if (input && !input.hasAttribute('data-table-check-row')) input.setAttribute('data-table-check-row', '');
      placeTreeLead(tr, first);
      return;
    }
    var table = tr.closest('table');
    if (tr.children.length === 1 && first && first.hasAttribute('colspan')) {
      var n = table.querySelectorAll('thead th').length;
      if (n && first.getAttribute('colspan') !== String(n)) first.setAttribute('colspan', String(n));
      return;
    }
    var td = document.createElement('td');
    td.className = 'ob-table__select';
    td.innerHTML = ROW_BOX;
    tr.insertBefore(td, tr.firstChild);
    placeTreeLead(tr, td);
  }

  function pullBatch(table, batch) {
    var wrap = table.closest('.ob-table-wrap');
    var root = (wrap && wrap.parentElement) || table.parentElement;
    if (!root) return;
    root.querySelectorAll('[data-table-batch]').forEach(function (btn) {
      if (batch.contains(btn)) return;
      if (btn.closest('table')) return;
      var other = btn.closest('.ob-table-footer');
      if (other && other !== batch.closest('.ob-table-footer')) return;
      batch.appendChild(btn);
    });
  }

  function nextFooter(after) {
    var node = after.nextElementSibling;
    while (node && node.classList.contains('ob-table-pin')) node = node.nextElementSibling;
    if (node && node.classList.contains('ob-table-footer')) return node;
    var parent = after.parentNode;
    if (!parent) return null;
    var found = parent.querySelector(':scope > .ob-table-footer');
    return found || null;
  }

  function ensureFooter(table) {
    var wrap = table.closest('.ob-table-wrap');
    var after = wrap || table;
    var parent = after.parentNode;
    if (!parent) return null;
    var footer = nextFooter(after);
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'ob-table-footer ob-table-footer--select-only';
      var pin = after.nextElementSibling;
      var before = pin && pin.classList.contains('ob-table-pin') ? pin.nextSibling : after.nextSibling;
      parent.insertBefore(footer, before);
    }
    if (!footer.querySelector('.ob-table-footer__batch')) {
      var total = footer.querySelector('#listCount');
      if (!total) {
        footer.querySelectorAll('span').forEach(function (span) {
          if (!total && /共\s*\d+/.test(span.textContent) && !span.querySelector('span')) total = span;
        });
      }
      var pager = footer.querySelector('.ob-pagination');
      var kept = [].slice.call(footer.querySelectorAll('[data-table-batch]'));
      var lead = document.createElement('div');
      lead.className = 'ob-table-footer__lead';
      if (total) {
        total.classList.add('ob-table-footer__total');
        lead.appendChild(total);
      }
      var batch = document.createElement('div');
      batch.className = 'ob-table-footer__batch';
      batch.innerHTML = '<span class="ob-table-footer__picked">已选 <span data-table-picked>0</span> 个对象</span><button type="button" class="ob-link" data-table-clear>取消</button>';
      kept.forEach(function (btn) { batch.appendChild(btn); });
      lead.appendChild(batch);
      var end = document.createElement('div');
      end.className = 'ob-table-footer__end';
      if (total) {
        var side = document.createElement('span');
        side.className = 'ob-table-footer__total-side';
        side.setAttribute('data-table-total-side', '');
        side.textContent = total.textContent;
        end.appendChild(side);
      }
      if (pager) end.appendChild(pager);
      footer.textContent = '';
      footer.appendChild(lead);
      if (end.childNodes.length) footer.appendChild(end);
      if (!total) footer.classList.add('ob-table-footer--select-only');
    }
    var totalNode = footer.querySelector('.ob-table-footer__total, #listCount');
    var sideNode = footer.querySelector('[data-table-total-side]');
    if (totalNode && sideNode && totalNode.getAttribute('data-side-bound') !== '1') {
      totalNode.setAttribute('data-side-bound', '1');
      new MutationObserver(function () {
        sideNode.textContent = totalNode.textContent;
      }).observe(totalNode, { characterData: true, childList: true, subtree: true });
    }
    var batchNode = footer.querySelector('.ob-table-footer__batch');
    if (batchNode) pullBatch(table, batchNode);
    return footer;
  }

  function syncTable(table) {
    var boxes = rowChecks(table);
    var picked = 0;
    table.querySelectorAll('tbody > tr').forEach(function (tr) {
      var td = tr.querySelector(':scope > td.ob-table__select');
      var input = td && td.querySelector('input[type="checkbox"]');
      var on = !!(input && input.checked && !tr.classList.contains('is-tree-hidden'));
      if (on) picked += 1;
      tr.classList.toggle('is-selected', on);
    });
    var head = table.querySelector('thead th.ob-table__select input[type="checkbox"]');
    if (head && !ownSelectAll(head)) {
      head.checked = boxes.length > 0 && picked === boxes.length;
      head.indeterminate = picked > 0 && picked < boxes.length;
      var label = head.closest('.ob-check');
      if (label) label.classList.toggle('is-indeterminate', head.indeterminate);
    }
    var footer = ensureFooter(table);
    if (!footer) return;
    footer.classList.toggle('is-picking', picked > 0);
    var num = footer.querySelector('[data-table-picked]');
    if (num && num.textContent !== String(picked)) num.textContent = String(picked);
    var total = footer.querySelector('.ob-table-footer__total, #listCount');
    var side = footer.querySelector('[data-table-total-side]');
    if (total && side && side.textContent !== total.textContent) side.textContent = total.textContent;
  }

  var tableLock = false;
  var tableQueued = false;
  function scanTables() {
    if (tableLock || tableQueued || !document.body) return;
    tableQueued = true;
    requestAnimationFrame(function () {
      tableQueued = false;
      if (tableLock) return;
      tableLock = true;
      document.querySelectorAll('table.ob-table').forEach(function (table) {
        if (!tableNeedsSelect(table)) {
          stripSelect(table);
          return;
        }
        ensureHead(table);
        table.querySelectorAll('tbody > tr').forEach(ensureRow);
        syncTable(table);
      });
      tableLock = false;
    });
  }

  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'checkbox') return;
    var table = input.closest && input.closest('table.ob-table');
    if (!table) return;
    if (input.hasAttribute('data-table-check-all') && !ownSelectAll(input)) {
      var on = input.checked;
      rowChecks(table).forEach(function (box) { box.checked = on; });
    }
    syncTable(table);
  });

  function tableOfFooter(footer) {
    var node = footer.previousElementSibling;
    while (node) {
      if (node.classList.contains('ob-table-wrap')) {
        var found = node.querySelector('table.ob-table');
        if (found) return found;
      }
      if (node.classList.contains('ob-table')) return node;
      if (!node.classList.contains('ob-table-pin')) break;
      node = node.previousElementSibling;
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var clear = e.target && e.target.closest && e.target.closest('[data-table-clear]');
    if (!clear) return;
    e.preventDefault();
    var footer = clear.closest('.ob-table-footer');
    var table = footer && tableOfFooter(footer);
    if (!table) return;
    var boxes = [].slice.call(table.querySelectorAll('tbody input[type="checkbox"]'));
    boxes.forEach(function (box) { box.checked = false; });
    var head = table.querySelector('thead th.ob-table__select input[type="checkbox"]');
    if (head) {
      head.checked = false;
      head.indeterminate = false;
      var label = head.closest('.ob-check');
      if (label) label.classList.remove('is-indeterminate');
    }
    if (boxes.length) boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
    syncTable(table);
  });

  window.TableSelect = { refresh: scanTables };

  /* ---- Popconfirm（薄补：点击触发气泡确认） ---- */
  var popconfirmNode = null;
  var popconfirmOnOk = null;

  function ensurePopconfirm() {
    if (popconfirmNode) return popconfirmNode;
    popconfirmNode = document.createElement('div');
    popconfirmNode.className = 'ob-popconfirm';
    popconfirmNode.setAttribute('role', 'dialog');
    popconfirmNode.innerHTML =
      '<div class="ob-popconfirm__arrow" aria-hidden="true"></div>' +
      '<div class="ob-popconfirm__inner">' +
      '<div class="ob-popconfirm__message"></div>' +
      '<div class="ob-popconfirm__actions">' +
      '<button type="button" class="ob-btn ob-btn--sm ob-btn--default" data-ob-popconfirm-cancel>取消</button>' +
      '<button type="button" class="ob-btn ob-btn--sm ob-btn--primary" data-ob-popconfirm-ok>确定</button>' +
      '</div></div>';
    document.body.appendChild(popconfirmNode);
    popconfirmNode.addEventListener('click', function (e) {
      if (e.target.closest('[data-ob-popconfirm-cancel]')) {
        closePopconfirm();
        return;
      }
      if (e.target.closest('[data-ob-popconfirm-ok]')) {
        var fn = popconfirmOnOk;
        closePopconfirm();
        if (typeof fn === 'function') fn();
      }
    });
    return popconfirmNode;
  }

  function closePopconfirm() {
    if (!popconfirmNode) return;
    popconfirmNode.classList.remove('is-open');
    popconfirmOnOk = null;
  }

  function placePopconfirm(anchor) {
    var node = ensurePopconfirm();
    var rect = anchor.getBoundingClientRect();
    var gap = 8;
    node.classList.add('is-open');
    node.classList.remove('ob-popconfirm--bottom');
    node.classList.add('ob-popconfirm--top');
    var width = node.offsetWidth;
    var height = node.offsetHeight;
    var left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    var top = rect.top - height - gap;
    if (top < 8) {
      top = rect.bottom + gap;
      node.classList.remove('ob-popconfirm--top');
      node.classList.add('ob-popconfirm--bottom');
    }
    node.style.left = left + 'px';
    node.style.top = top + 'px';
    var arrow = node.querySelector('.ob-popconfirm__arrow');
    if (arrow) {
      var ax = rect.left + rect.width / 2 - left - 8;
      arrow.style.left = Math.max(12, Math.min(ax, width - 28)) + 'px';
    }
  }

  function openPopconfirm(opts) {
    opts = opts || {};
    var anchor = opts.anchor;
    if (!anchor) return;
    var node = ensurePopconfirm();
    node.querySelector('.ob-popconfirm__message').textContent = opts.title || opts.text || '确定？';
    var okBtn = node.querySelector('[data-ob-popconfirm-ok]');
    var cancelBtn = node.querySelector('[data-ob-popconfirm-cancel]');
    okBtn.textContent = opts.okText || '确定';
    cancelBtn.textContent = opts.cancelText || '取消';
    okBtn.className = 'ob-btn ob-btn--sm ' + (opts.danger ? 'ob-btn--danger' : 'ob-btn--primary');
    popconfirmOnOk = opts.onOk || null;
    placePopconfirm(anchor);
  }

  document.addEventListener('mousedown', function (e) {
    if (!popconfirmNode || !popconfirmNode.classList.contains('is-open')) return;
    if (popconfirmNode.contains(e.target)) return;
    if (e.target.closest && e.target.closest('[data-ob-popconfirm-anchor]')) return;
    closePopconfirm();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePopconfirm();
  });
  window.addEventListener('scroll', closePopconfirm, true);
  window.addEventListener('resize', closePopconfirm);

  window.ObPopconfirm = { open: openPopconfirm, close: closePopconfirm };

  if (document.body) {
    scanTables();
    new MutationObserver(function () { scanTables(); }).observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      scanTables();
      new MutationObserver(function () { scanTables(); }).observe(document.body, { childList: true, subtree: true });
    });
  }
})();
