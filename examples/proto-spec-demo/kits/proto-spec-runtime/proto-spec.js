/**
 * Prototype Spec Runtime (vanilla JS)
 * Consumes proto-spec/<page-id>.md (frontmatter + body).
 * Legacy: proto-spec/<page-id>/spec.md or meta.yaml + split modules.
 * No React / no build. Prefer http(s) static server for fetch().
 */
(function (global) {
  'use strict';

  var STORAGE = {
    anchor: 'proto-spec.fab.anchor',
    width: 'proto-spec.drawer.width',
  };

  var ANCHORS = [
    'left-top',
    'left-center',
    'left-bottom',
    'right-top',
    'right-center',
    'right-bottom',
  ];

  /** 默认：单文件 Screen Spec。旧包四文件仍可通过探测或 meta.modules 使用。 */
  var DEFAULT_MODULES = [
    { key: 'spec', label: '页面规格说明', type: 'markdown', source: './spec.md' },
  ];
  var LEGACY_MODULES = [
    { key: 'business', label: '业务说明', type: 'markdown', source: './business.md' },
    { key: 'flow', label: '流程与状态', type: 'markdown', source: './flow.md' },
    { key: 'fields', label: '字段说明', type: 'yaml-fields', source: './fields.yaml' },
    { key: 'interaction', label: '交互说明', type: 'markdown', source: './interaction.md' },
  ];

  var RENDERERS = {};

  function registerRenderer(type, fn) {
    RENDERERS[type] = fn;
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] !== undefined && attrs[k] !== null) {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  /**
   * 搜索框 IME 安全绑定：组字期间不回调，避免整树重绘打断中文输入。
   * onCommit(value, inputEl) 仅在组字结束后或非组字 input 时触发。
   */
  function bindImeSafeInput(input, onCommit) {
    var composing = false;
    input.addEventListener('compositionstart', function () {
      composing = true;
    });
    input.addEventListener('compositionend', function () {
      composing = false;
      onCommit(input.value || '', input);
    });
    input.addEventListener('input', function (e) {
      if (composing || (e && e.isComposing)) return;
      onCommit(input.value || '', input);
    });
  }

  function toast(msg) {
    var t = $('.ps-toast');
    if (!t) {
      t = el('div', { className: 'ps-toast' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      t.classList.remove('is-show');
    }, 2200);
  }

  function copyPlainText(text) {
    var value = String(text == null ? '' : text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).catch(function () {
        return legacyCopyPlain(value);
      });
    }
    return Promise.resolve(legacyCopyPlain(value));
  }

  function legacyCopyPlain(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function loadStorage(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {}
  }

  /* ---- minimal YAML (subset) ---- */
  function parseYaml(text) {
    if (text == null) return null;
    var lines = String(text).replace(/\r\n/g, '\n').split('\n');
    var i = 0;

    function peek() {
      while (i < lines.length) {
        var raw = lines[i];
        if (!raw.trim() || raw.trim().indexOf('#') === 0) {
          i++;
          continue;
        }
        return raw;
      }
      return null;
    }

    function indentOf(line) {
      var m = /^ */.exec(line || '');
      return m ? m[0].length : 0;
    }

    function parseValue(raw) {
      var v = raw.trim();
      if (v === '' || v === 'null' || v === '~') return null;
      if (v === 'true') return true;
      if (v === 'false') return false;
      if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
      if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'")) {
        return v.slice(1, -1);
      }
      if (v === '[]') return [];
      if (v === '{}') return {};
      return v;
    }

    function parseBlock(minIndent) {
      var line = peek();
      if (!line) return null;
      var ind = indentOf(line);
      if (ind < minIndent) return null;

      if (/^ *- /.test(line.slice(ind))) {
        var arr = [];
        while ((line = peek())) {
          var aInd = indentOf(line);
          if (aInd < minIndent) break;
          if (!/^ *- /.test(line.slice(aInd))) break;
          i++;
          var rest = line.slice(aInd + 2);
          if (!rest.trim()) {
            arr.push(parseBlock(aInd + 2));
          } else if (rest.indexOf(':') > -1 && !/^['"]/.test(rest.trim())) {
            // inline map start: key: value then nested
            i--;
            // re-read as object item: fake by parsing object at this indent with leading -
            var obj = {};
            var first = rest;
            var colon = first.indexOf(':');
            var fk = first.slice(0, colon).trim();
            var fv = first.slice(colon + 1).trim();
            i++;
            if (!fv) obj[fk] = parseBlock(aInd + 2);
            else obj[fk] = parseValue(fv);
            // continue nested keys at > aInd
            while ((line = peek())) {
              var nInd = indentOf(line);
              if (nInd <= aInd) break;
              if (/^ *- /.test(line.slice(nInd))) break;
              i++;
              var part = line.slice(nInd);
              var c = part.indexOf(':');
              if (c < 0) continue;
              var k = part.slice(0, c).trim();
              var val = part.slice(c + 1).trim();
              if (!val) obj[k] = parseBlock(nInd + 2);
              else obj[k] = parseValue(val);
            }
            arr.push(obj);
          } else {
            arr.push(parseValue(rest));
          }
        }
        return arr;
      }

      var obj = {};
      while ((line = peek())) {
        var oInd = indentOf(line);
        if (oInd < minIndent) break;
        if (/^ *- /.test(line.slice(oInd))) break;
        i++;
        var body = line.slice(oInd);
        var ci = body.indexOf(':');
        if (ci < 0) continue;
        var key = body.slice(0, ci).trim();
        var value = body.slice(ci + 1).trim();
        if (!value) obj[key] = parseBlock(oInd + 2);
        else obj[key] = parseValue(value);
      }
      return obj;
    }

    return parseBlock(0);
  }

  /* ---- markdown ---- */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inlineMd(text) {
    var s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function slugifyHeading(text, used) {
    var base = String(text || '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff\-]+/g, '');
    if (!base) base = 'section';
    var id = 'ps-h-' + base;
    var n = 2;
    while (used[id]) {
      id = 'ps-h-' + base + '-' + n++;
    }
    used[id] = true;
    return id;
  }

  /** 给标题补 id，返回目录项（h1–h3）。 */
  function collectMarkdownHeadings(root) {
    var used = {};
    var items = [];
    if (!root || !root.querySelectorAll) return items;
    Array.prototype.forEach.call(root.querySelectorAll('h1, h2, h3, h4'), function (h) {
      var text = (h.textContent || '').trim();
      if (!text) return;
      var id = h.id || slugifyHeading(text, used);
      if (!h.id) h.id = id;
      else used[id] = true;
      items.push({
        id: id,
        text: text,
        level: Number(h.tagName.charAt(1)),
      });
    });
    return items;
  }

  function smoothScrollWithin(scrollRoot, target) {
    if (!scrollRoot || !target) return;
    var panelRect = scrollRoot.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    var nextTop = scrollRoot.scrollTop + (targetRect.top - panelRect.top) - 12;
    if (typeof scrollRoot.scrollTo === 'function') {
      try {
        scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
        return;
      } catch (e) {}
    }
    scrollRoot.scrollTop = Math.max(0, nextTop);
  }

  function fillSpecToc(tocEl, panelEl, mdRoot) {
    if (!tocEl) return;
    var title = tocEl.querySelector('.ps-spec-toc__title');
    var list = tocEl.querySelector('.ps-spec-toc__list');
    if (!list) {
      list = el('div', { className: 'ps-spec-toc__list' });
      tocEl.appendChild(list);
    }
    list.innerHTML = '';
    if (!title) {
      tocEl.insertBefore(el('div', { className: 'ps-spec-toc__title', text: '目录' }), list);
    }
    var items = collectMarkdownHeadings(mdRoot || panelEl);
    if (!items.length) {
      list.appendChild(el('div', { className: 'ps-spec-toc__empty', text: '暂无标题' }));
      return;
    }
    var baseLevel = Math.min.apply(null, items.map(function (item) { return item.level; }));
    var detailGroup = null;
    items.forEach(function (item) {
      var depth = item.level - baseLevel;
      if (depth < 2) detailGroup = null;
      var btn = el('button', {
        type: 'button',
        className: 'ps-spec-toc__link ps-spec-toc__link--h' + (Math.min(depth, 2) + 1),
        text: item.text,
        title: item.text,
        onClick: function () {
          var target = null;
          Array.prototype.some.call(panelEl.querySelectorAll('[id]'), function (node) {
            if (node.id === item.id) {
              target = node;
              return true;
            }
            return false;
          });
          Array.prototype.forEach.call(list.querySelectorAll('.ps-spec-toc__link.is-active'), function (n) {
            n.classList.remove('is-active');
          });
          btn.classList.add('is-active');
          smoothScrollWithin(panelEl, target);
        },
      });
      if (depth >= 2) {
        if (!detailGroup) {
          detailGroup = el('details', { className: 'ps-spec-toc__details' });
          detailGroup.appendChild(el('summary', { text: '展开细节' }));
          list.appendChild(detailGroup);
        }
        detailGroup.appendChild(btn);
      } else {
        list.appendChild(btn);
      }
    });
  }

  function decorateSpecDocument(root) {
    Array.prototype.forEach.call(root.querySelectorAll('blockquote'), function (node) {
      if (/阻塞确认|阻塞事项/.test(node.textContent || '')) node.classList.add('ps-review-blocker');
    });
    Array.prototype.forEach.call(root.querySelectorAll('td'), function (node) {
      var value = (node.textContent || '').trim();
      if (!/^(已演示|部分演示|未演示)$/.test(value)) return;
      node.textContent = '';
      node.appendChild(el('span', {
        className: 'ps-coverage' + (value === '已演示' ? ' ps-coverage--done' : value === '部分演示' ? ' ps-coverage--partial' : ''),
        text: value,
      }));
    });
  }

  function renderMarkdown(md) {
    var src = String(md || '').replace(/\r\n/g, '\n');
    var parts = [];
    var re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    var last = 0;
    var m;
    while ((m = re.exec(src))) {
      if (m.index > last) parts.push({ type: 'md', text: src.slice(last, m.index) });
      parts.push({ type: 'code', lang: (m[1] || '').toLowerCase(), text: m[2].replace(/\n$/, '') });
      last = m.index + m[0].length;
    }
    if (last < src.length) parts.push({ type: 'md', text: src.slice(last) });

    var root = el('div', { className: 'ps-md' });
    parts.forEach(function (part) {
      if (part.type === 'code') {
        if (part.lang === 'mermaid') {
          root.appendChild(renderMermaidBlock(part.text));
        } else {
          root.appendChild(
            el('pre', null, [el('code', { text: part.text })])
          );
        }
        return;
      }
      root.appendChild(renderMdChunk(part.text));
    });
    return root;
  }

  function renderMdChunk(text) {
    var wrap = el('div');
    var lines = text.split('\n');
    var i = 0;
    var listBuf = null;
    var listTag = null;

    function flushList() {
      if (listBuf) {
        wrap.appendChild(listBuf);
        listBuf = null;
        listTag = null;
      }
    }

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*[-:| ]+\|/.test(lines[i + 1])) {
        flushList();
        var tableLines = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          tableLines.push(lines[i]);
          i++;
        }
        wrap.appendChild(renderMdTable(tableLines));
        continue;
      }

      if (/^---+$/.test(line.trim())) {
        flushList();
        wrap.appendChild(el('hr'));
        i++;
        continue;
      }

      var hm = /^(#{1,6})\s+(.*)$/.exec(line);
      if (hm) {
        flushList();
        wrap.appendChild(el('h' + hm[1].length, { html: inlineMd(hm[2]) }));
        i++;
        continue;
      }

      if (/^>\s?/.test(line)) {
        flushList();
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          q.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        wrap.appendChild(el('blockquote', { html: inlineMd(q.join(' ')) }));
        continue;
      }

      var ul = /^(\s*)[-*]\s+(.*)$/.exec(line);
      var ol = /^(\s*)\d+\.\s+(.*)$/.exec(line);
      if (ul || ol) {
        var tag = ul ? 'ul' : 'ol';
        var item = ul ? ul[2] : ol[2];
        if (!listBuf || listTag !== tag) {
          flushList();
          listBuf = el(tag);
          listTag = tag;
        }
        listBuf.appendChild(el('li', { html: inlineMd(item) }));
        i++;
        continue;
      }

      if (!line.trim()) {
        flushList();
        i++;
        continue;
      }

      flushList();
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|---|[-*]\s|\d+\.\s|>\s?|\|)/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      wrap.appendChild(el('p', { html: inlineMd(para.join(' ')) }));
    }
    flushList();
    return wrap;
  }

  function renderMdTable(tableLines) {
    var rows = tableLines
      .filter(function (l, idx) {
        return idx !== 1;
      })
      .map(function (l) {
        return l
          .replace(/^\s*\|/, '')
          .replace(/\|\s*$/, '')
          .split('|')
          .map(function (c) {
            return c.trim();
          });
      });
    var table = el('table');
    rows.forEach(function (cols, ri) {
      var tr = el('tr');
      cols.forEach(function (c) {
        tr.appendChild(el(ri === 0 ? 'th' : 'td', { html: inlineMd(c) }));
      });
      table.appendChild(tr);
    });
    return table;
  }

  function closeMermaidLightbox() {
    var existing = document.querySelector('.ps-mermaid-lightbox');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    document.removeEventListener('keydown', onMermaidLightboxKey);
  }

  function onMermaidLightboxKey(e) {
    if (e.key === 'Escape') closeMermaidLightbox();
  }

  function openMermaidLightbox(sourceMount) {
    var svg = sourceMount && sourceMount.querySelector('svg');
    if (!svg) return;
    closeMermaidLightbox();
    var overlay = el('div', {
      className: 'ps-mermaid-lightbox',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': '流程图放大查看',
    });
    var panel = el('div', { className: 'ps-mermaid-lightbox__panel' });
    var closeBtn = el('button', {
      type: 'button',
      className: 'ps-mermaid-lightbox__close',
      title: '关闭',
      'aria-label': '关闭',
      onClick: closeMermaidLightbox,
    });
    closeBtn.appendChild(strokeIcon(GLYPH.close));
    var stage = el('div', { className: 'ps-mermaid-lightbox__stage' });
    var clone = svg.cloneNode(true);
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    clone.setAttribute('class', 'ps-mermaid-lightbox__svg');
    stage.appendChild(clone);
    panel.appendChild(closeBtn);
    panel.appendChild(stage);
    overlay.appendChild(panel);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeMermaidLightbox();
    });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onMermaidLightboxKey);
  }

  function renderMermaidBlock(code) {
    var showingCode = false;
    var box = el('div', { className: 'ps-mermaid' });
    var mount = el('div', { className: 'ps-mermaid__mount' });
    var fallback = el('pre', { className: 'ps-mermaid__fallback', text: code });
    fallback.hidden = true;

    var toggleBtn = el('button', {
      type: 'button',
      className: 'ps-mermaid__btn',
      text: '查看代码',
      onClick: function () {
        showingCode = !showingCode;
        syncView();
      },
    });
    var copyBtn = el('button', {
      type: 'button',
      className: 'ps-mermaid__icon-btn',
      title: '复制代码',
      'aria-label': '复制代码',
      onClick: function () {
        copyPlainText(code).then(function () {
          toast('已复制代码');
        });
      },
    });
    copyBtn.appendChild(strokeIcon(GLYPH.copy));
    var zoomBtn = el('button', {
      type: 'button',
      className: 'ps-mermaid__icon-btn',
      title: '放大查看',
      'aria-label': '放大查看',
      onClick: function () {
        openMermaidLightbox(mount);
      },
    });
    zoomBtn.appendChild(strokeIcon(GLYPH.expand));

    var toolbar = el('div', { className: 'ps-mermaid__toolbar' }, [toggleBtn, copyBtn, zoomBtn]);

    function syncView() {
      fallback.hidden = !showingCode;
      mount.hidden = showingCode;
      toggleBtn.textContent = showingCode ? '查看流程图' : '查看代码';
      zoomBtn.hidden = showingCode;
      box.classList.toggle('is-code', showingCode);
    }

    box.appendChild(toolbar);
    box.appendChild(mount);
    box.appendChild(fallback);
    syncView();

    function draw(attempt) {
      attempt = attempt || 0;
      if (global.mermaid && typeof global.mermaid.render === 'function') {
        var id = 'psm-' + Math.random().toString(36).slice(2);
        global.mermaid
          .render(id, code)
          .then(function (res) {
            mount.innerHTML = res.svg;
            showingCode = false;
            syncView();
          })
          .catch(function (err) {
            mount.innerHTML = '';
            mount.appendChild(
              el('div', {
                className: 'ps-error',
                text: 'Mermaid 渲染失败，已保留源码。\n' + (err && err.message ? err.message : err),
              })
            );
            showingCode = true;
            syncView();
          });
      } else if (attempt < 40) {
        setTimeout(function () {
          draw(attempt + 1);
        }, 50);
      } else {
        mount.innerHTML = '';
        mount.appendChild(
          el('div', {
            className: 'ps-empty',
            text: '未加载 Mermaid，已显示源码。可在页面引入 mermaid.min.js 后刷新。',
          })
        );
        showingCode = true;
        syncView();
      }
    }
    setTimeout(function () {
      draw(0);
    }, 0);
    return box;
  }

  /* ---- fields renderer ---- */
  function formatValidation(v) {
    if (!v || typeof v !== 'object') return '—';
    return Object.keys(v)
      .map(function (k) {
        return k + ': ' + v[k];
      })
      .join('；');
  }

  function formatEnum(list) {
    if (!list || !list.length) return '—';
    return list
      .map(function (it) {
        return it.label || it.value || '';
      })
      .filter(Boolean)
      .join('/');
  }

  function renderFields(data) {
    var fields = (data && data.fields) || [];
    var errors = validateFields(fields);
    var root = el('div');
    if (errors.length) {
      root.appendChild(
        el('div', {
          className: 'ps-error',
          text: '字段校验：\n- ' + errors.join('\n- '),
        })
      );
    }
    if (!fields.length) {
      root.appendChild(el('div', { className: 'ps-empty', text: '暂无字段定义' }));
      return root;
    }
    var wrap = el('div', { className: 'ps-fields-wrap' });
    var table = el('table', { className: 'ps-fields' });
    table.appendChild(
      el('thead', null, [
        el('tr', null, [
          el('th', { text: '字段名' }),
          el('th', { text: '类型' }),
          el('th', { text: '必填' }),
          el('th', { text: '默认值' }),
          el('th', { text: '枚举值' }),
          el('th', { text: '字段说明' }),
          el('th', { text: '校验规则' }),
        ]),
      ])
    );
    var tbody = el('tbody');
    fields.forEach(function (f) {
      tbody.appendChild(
        el('tr', null, [
          el('td', { text: f.name || '—' }),
          el('td', { text: f.type || '—' }),
          el('td', { text: f.required ? '是' : '否' }),
          el('td', { text: f.default == null ? '—' : String(f.default) }),
          el('td', { text: formatEnum(f.enum) }),
          el('td', { text: f.description || '—' }),
          el('td', { text: formatValidation(f.validation) }),
        ])
      );
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    root.appendChild(wrap);
    return root;
  }

  function validateFields(fields) {
    var errs = [];
    var codes = {};
    (fields || []).forEach(function (f, idx) {
      if (!f || !f.code) errs.push('第 ' + (idx + 1) + ' 项缺少 code');
      if (f && f.code) {
        if (codes[f.code]) errs.push('重复字段 code: ' + f.code);
        codes[f.code] = true;
      }
      if (f && f.type === 'enum' && (!f.enum || !f.enum.length)) {
        errs.push(f.code + ' 为 enum 但缺少 enum 列表');
      }
      if (f && f.required != null && typeof f.required !== 'boolean') {
        errs.push((f.code || idx) + ' required 必须为 boolean');
      }
    });
    return errs;
  }

  function renderYamlTable(data) {
    var root = el('div', { className: 'ps-fields-wrap' });
    var table = el('table', { className: 'ps-fields' });
    if (Array.isArray(data)) {
      if (!data.length) {
        return el('div', { className: 'ps-empty', text: '空表' });
      }
      var keys = Object.keys(data[0] || {});
      table.appendChild(
        el(
          'thead',
          null,
          [
            el(
              'tr',
              null,
              keys.map(function (k) {
                return el('th', { text: k });
              })
            ),
          ]
        )
      );
      var tb = el('tbody');
      data.forEach(function (row) {
        tb.appendChild(
          el(
            'tr',
            null,
            keys.map(function (k) {
              var v = row[k];
              return el('td', { text: v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v) });
            })
          )
        );
      });
      table.appendChild(tb);
    } else {
      table.appendChild(
        el('thead', null, [el('tr', null, [el('th', { text: '键' }), el('th', { text: '值' })])])
      );
      var body = el('tbody');
      Object.keys(data || {}).forEach(function (k) {
        var v = data[k];
        body.appendChild(
          el('tr', null, [
            el('td', { text: k }),
            el('td', { text: v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v) }),
          ])
        );
      });
      table.appendChild(body);
    }
    root.appendChild(table);
    return root;
  }

  registerRenderer('markdown', function (raw) {
    return renderMarkdown(raw);
  });
  registerRenderer('mermaid', function (raw) {
    return renderMermaidBlock(String(raw || ''));
  });
  registerRenderer('yaml-fields', function (raw) {
    var data = typeof raw === 'string' ? parseYaml(raw) : raw;
    return renderFields(data);
  });
  registerRenderer('yaml-table', function (raw) {
    var data = typeof raw === 'string' ? parseYaml(raw) : raw;
    return renderYamlTable(data);
  });
  registerRenderer('json', function (raw) {
    var data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return el('pre', null, [el('code', { text: JSON.stringify(data, null, 2) })]);
  });

  /* ---- loading ---- */
  function normalizeBase(base) {
    if (!base) return base;
    try {
      return new URL(base.replace(/\/?$/, '/'), global.location.href).href;
    } catch (e) {
      return String(base).replace(/\/?$/, '/');
    }
  }

  function resolveUrl(base, source) {
    if (!source) return base;
    if (/^https?:\/\//i.test(source)) return source;
    try {
      return new URL(String(source).replace(/^\.\//, ''), normalizeBase(base)).href;
    } catch (e) {
      var b = String(base).replace(/\/?$/, '/');
      return b + String(source).replace(/^\.\//, '');
    }
  }

  function fetchText(url) {
    if (global.location && global.location.protocol === 'file:') {
      return Promise.reject(
        new Error(
          '当前为 file:// 打开，浏览器无法读取 Spec 文件，因此会一直停在「加载中」。\n' +
            '请改用本地静态服务，例如：\n' +
            'http://127.0.0.1:8765/examples/proto-spec-demo/\n' +
            '（仓库根目录执行：ruby -run -e httpd . -p 8765）'
        )
      );
    }
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('无法加载 ' + url + '（' + res.status + '）');
      return res.text();
    });
  }

  /* ---- markdown frontmatter ---- */
  function parseFrontmatter(text) {
    var raw = String(text == null ? '' : text);
    var m = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n([\s\S]*)$/.exec(raw);
    if (!m) return { data: null, body: raw };
    return { data: parseYaml(m[1]), body: m[2] };
  }

  /** 支持 frontmatter 扁平字段（id/name/…）或 page: 嵌套（与旧 meta.yaml 一致）。 */
  function normalizePageMeta(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.page && typeof data.page === 'object') {
      return {
        page: data.page,
        modules: data.modules,
        extensions: data.extensions || [],
      };
    }
    if (data.id || data.name) {
      return {
        page: {
          id: data.id,
          name: data.name,
          version: data.version,
          status: data.status,
          updatedAt: data.updatedAt,
        },
        modules: data.modules,
        extensions: data.extensions || [],
      };
    }
    return null;
  }

  function loadMeta(options) {
    if (options.meta) return Promise.resolve(options.meta);
    if (options.inline && options.inline.meta) return Promise.resolve(options.inline.meta);
    if (options.inline && options.inline.spec != null) {
      var inlineParsed = parseFrontmatter(options.inline.spec);
      var inlineMeta = normalizePageMeta(inlineParsed.data);
      if (!inlineMeta || !inlineMeta.page || !inlineMeta.page.id) {
        return Promise.reject(new Error('inline.spec frontmatter 缺少 id / page.id'));
      }
      options._specBodyCache = inlineParsed.body;
      if (!inlineMeta.modules) inlineMeta.modules = DEFAULT_MODULES.slice();
      if (!options.pageId) options.pageId = inlineMeta.page.id;
      return Promise.resolve(inlineMeta);
    }
    if (!options.specBase) {
      return Promise.reject(new Error('请提供 specBase 或 inline.meta / inline.spec'));
    }
    var base = normalizeBase(options.specBase);
    options.specBase = base;
    var pageId = options.pageId;

    function acceptSpecText(txt) {
      var parsed = parseFrontmatter(txt);
      var meta = normalizePageMeta(parsed.data);
      if (meta && meta.page && meta.page.id) {
        options._specBodyCache = parsed.body;
        if (!meta.modules) meta.modules = DEFAULT_MODULES.slice();
        if (!options.pageId) options.pageId = meta.page.id;
        return meta;
      }
      options._specBodyCache = parsed.body;
      return null;
    }

    function fromMetaYaml(dirBase) {
      return fetchText(normalizeBase(dirBase) + 'meta.yaml').then(function (txt) {
        var meta = parseYaml(txt);
        if (!meta || !meta.page) throw new Error('meta.yaml 缺少 page');
        if (!options.pageId && meta.page.id) options.pageId = meta.page.id;
        return meta;
      });
    }

    // 默认扁平：proto-spec/<page-id>.md
    if (pageId) {
      var flatUrl = resolveUrl(base, pageId + '.md');
      return fetchText(flatUrl)
        .then(function (txt) {
          var meta = acceptSpecText(txt);
          if (meta) return meta;
          throw new Error(pageId + '.md frontmatter 缺少 id');
        })
        .catch(function () {
          // 兼容：proto-spec/<page-id>/spec.md
          var nested = normalizeBase(resolveUrl(base, pageId + '/'));
          return fetchText(nested + 'spec.md')
            .then(function (txt) {
              var meta = acceptSpecText(txt);
              if (meta) return meta;
              return fromMetaYaml(nested);
            })
            .catch(function () {
              return fromMetaYaml(nested);
            });
        });
    }

    // 兼容旧 mount：specBase 已指向 proto-spec/<page-id>/
    return fetchText(base + 'spec.md')
      .then(function (txt) {
        var meta = acceptSpecText(txt);
        if (meta) return meta;
        return fromMetaYaml(base);
      })
      .catch(function () {
        return fromMetaYaml(base);
      });
  }

  function loadModuleSource(meta, mod, options) {
    var key = mod.key;
    if (options.inline && options.inline.sources && options.inline.sources[key] != null) {
      return Promise.resolve(options.inline.sources[key]);
    }
    if (key === 'spec' && options._specBodyCache != null) {
      return Promise.resolve(options._specBodyCache);
    }
    if (options.inline && options.inline.spec != null && key === 'spec') {
      return Promise.resolve(parseFrontmatter(options.inline.spec).body);
    }
    if (!options.specBase) {
      return Promise.reject(new Error('模块 ' + key + ' 缺少 inline source，且未配置 specBase'));
    }
    try {
      var pageId = options.pageId || (meta.page && meta.page.id);
      var url;
      if (key === 'spec' && pageId) {
        url = resolveUrl(options.specBase, pageId + '.md');
      } else if (pageId && mod.source && String(mod.source).indexOf('./') === 0) {
        // legacy modules relative to proto-spec/<page-id>/
        url = resolveUrl(normalizeBase(resolveUrl(options.specBase, pageId + '/')), mod.source);
      } else {
        url = resolveUrl(options.specBase, mod.source);
      }
      return fetchText(url).then(function (txt) {
        if (key === 'spec' || (mod.source && /spec\.md$/.test(String(mod.source))) || /\.md$/.test(url)) {
          if (key === 'spec' || /spec\.md$/.test(String(mod.source)) || (pageId && url.indexOf(pageId + '.md') !== -1)) {
            return parseFrontmatter(txt).body;
          }
        }
        return txt;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /** 未写 meta.modules：扁平 md / nested spec.md → 单 Tab；否则旧四文件。 */
  function resolveModules(meta, options) {
    if (meta.modules && meta.modules.length) {
      return Promise.resolve([].concat(meta.modules));
    }
    if (options._specBodyCache != null) {
      return Promise.resolve(DEFAULT_MODULES.slice());
    }
    if (options.inline && options.inline.sources && options.inline.sources.spec != null) {
      return Promise.resolve(DEFAULT_MODULES.slice());
    }
    if (options.inline && options.inline.sources && options.inline.sources.business != null) {
      return Promise.resolve(LEGACY_MODULES.slice());
    }
    if (!options.specBase) {
      return Promise.resolve(DEFAULT_MODULES.slice());
    }
    var pageId = options.pageId || (meta.page && meta.page.id);
    var candidates = [];
    if (pageId) {
      candidates.push(resolveUrl(options.specBase, pageId + '.md'));
      candidates.push(resolveUrl(options.specBase, pageId + '/spec.md'));
      candidates.push(resolveUrl(options.specBase, pageId + '/business.md'));
    } else {
      candidates.push(resolveUrl(options.specBase, './spec.md'));
      candidates.push(resolveUrl(options.specBase, './business.md'));
    }

    function tryAt(i) {
      if (i >= candidates.length) return Promise.resolve(DEFAULT_MODULES.slice());
      return fetchText(candidates[i])
        .then(function () {
          if (candidates[i].indexOf('business.md') !== -1) return LEGACY_MODULES.slice();
          return DEFAULT_MODULES.slice();
        })
        .catch(function () {
          return tryAt(i + 1);
        });
    }
    return tryAt(0);
  }

  function packageRelFromSpecBase(options, nestedUp, flatUp) {
    if (options.pageId) return flatUp;
    return nestedUp;
  }

  function loadChangelogDoc(options) {
    if (options.inline && options.inline.changelog != null) {
      var raw = options.inline.changelog;
      return Promise.resolve(typeof raw === 'string' ? parseYaml(raw) : raw);
    }
    var url = options.changelogUrl;
    if (!url && options.specBase) {
      // 扁平：proto-spec/ → ../changelog.yaml；旧页目录 → ../../changelog.yaml
      url = resolveUrl(
        options.specBase,
        packageRelFromSpecBase(options, '../../changelog.yaml', '../changelog.yaml')
      );
    }
    if (!url) {
      return Promise.reject(new Error('请提供 changelogUrl、inline.changelog，或标准包结构下的 specBase'));
    }
    return fetchText(url).then(function (txt) {
      var doc = parseYaml(txt);
      if (!doc || typeof doc !== 'object') throw new Error('changelog.yaml 解析失败或为空');
      return doc;
    });
  }

  function packageBaseFromOptions(options) {
    if (options.packageBase) return normalizeBase(options.packageBase);
    if (options.specBase) {
      return normalizeBase(
        resolveUrl(
          options.specBase,
          packageRelFromSpecBase(options, '../../', '../')
        )
      );
    }
    if (options.sitemapUrl) {
      try {
        return normalizeBase(new URL('.', options.sitemapUrl).href);
      } catch (e) {}
    }
    return normalizeBase('./');
  }

  function loadSitemapDoc(options) {
    if (options.inline && options.inline.sitemap != null) {
      var raw = options.inline.sitemap;
      return Promise.resolve(typeof raw === 'string' ? parseYaml(raw) : raw);
    }
    var url = options.sitemapUrl;
    if (!url && options.specBase) {
      url = resolveUrl(
        options.specBase,
        packageRelFromSpecBase(options, '../../sitemap.yaml', '../sitemap.yaml')
      );
    }
    if (!url) {
      return Promise.reject(new Error('请提供 sitemapUrl、inline.sitemap，或标准包结构下的 specBase'));
    }
    return fetchText(url).then(function (txt) {
      var doc = parseYaml(txt);
      if (!doc || typeof doc !== 'object') throw new Error('sitemap.yaml 解析失败或为空');
      return doc;
    });
  }

  function indexSitemapGroups(groups) {
    var byId = {};
    function walk(list, l1Id, l1Name) {
      (list || []).forEach(function (g) {
        if (!g || !g.id) return;
        var nextL1 = g.level === 'L1' ? g.id : l1Id;
        var nextL1Name = g.level === 'L1' ? g.name || g.id : l1Name;
        byId[g.id] = {
          id: g.id,
          name: g.name || g.id,
          level: g.level,
          l1Id: nextL1 || g.id,
          l1Name: nextL1Name || g.name || g.id,
        };
        walk(g.children, nextL1, nextL1Name);
      });
    }
    walk(groups, null, null);
    return byId;
  }

  function flattenSitemapPages(pages) {
    var out = [];
    function add(p) {
      if (!p || !p.id) return;
      out.push(p);
      (p.children || []).forEach(add);
    }
    (pages || []).forEach(add);
    return out;
  }

  /** 原型状态 → 中文标签与色调（对齐导航目录 / PRD 树表） */
  function prototypeStatusMeta(status) {
    var s = String(status || '')
      .trim()
      .toLowerCase();
    var map = {
      draft: { label: '草稿', tone: 'draft' },
      planned: { label: '未生成', tone: 'none' },
      confirmed: { label: '已确认', tone: 'ok' },
      approved: { label: '已确认', tone: 'ok' },
      demo: { label: '可演示', tone: 'demo' },
      demoable: { label: '可演示', tone: 'demo' },
      ready: { label: '可演示', tone: 'demo' },
      review: { label: '待确认', tone: 'pending' },
      pending: { label: '待确认', tone: 'pending' },
    };
    if (map[s]) return map[s];
    if (!s) return { label: '—', tone: 'none' };
    return { label: String(status), tone: 'draft' };
  }

  function pageNodeFromSitemap(p) {
    var node = {
      type: 'page',
      id: p.id,
      name: p.name || p.id,
      version: p.version ? String(p.version) : '',
      status: p.status || '',
      path: p.path || '',
      layout: p.layout || '',
      page: p,
      children: [],
    };
    (p.children || []).forEach(function (ch) {
      if (!ch || !ch.id || ch.status === 'deprecated') return;
      node.children.push(pageNodeFromSitemap(ch));
    });
    return node;
  }

  /**
   * 站点树：L1/L2/L3 分组为文件夹，页面挂在 groupId 下；页面 children 为子页。
   * opts.forNav：顶层 hideInNav 的页不挂到根（仍可作父页的 children 出现）。
   */
  function buildSiteTreeFromSitemap(doc, opts) {
    opts = opts || {};
    var forNav = opts.forNav !== false;
    var pagesByGroup = {};
    (doc.pages || []).forEach(function (p) {
      if (!p || !p.id || p.status === 'deprecated') return;
      if (forNav && p.hideInNav) return;
      if (!forNav && p.hideInPrdPageList) return;
      var gid = p.groupId || '_ungrouped';
      if (!pagesByGroup[gid]) pagesByGroup[gid] = [];
      pagesByGroup[gid].push(pageNodeFromSitemap(p));
    });

    function buildGroup(g) {
      var node = {
        type: 'group',
        id: g.id,
        name: g.name || g.id,
        level: g.level || '',
        children: [],
      };
      (g.children || []).forEach(function (ch) {
        if (ch && ch.id) node.children.push(buildGroup(ch));
      });
      (pagesByGroup[g.id] || []).forEach(function (pg) {
        node.children.push(pg);
      });
      delete pagesByGroup[g.id];
      return node;
    }

    function prune(node) {
      if (node.type === 'page') return true;
      node.children = (node.children || []).filter(prune);
      return node.children.length > 0;
    }

    var roots = (doc.groups || []).map(buildGroup).filter(prune);
    var orphanIds = Object.keys(pagesByGroup);
    if (orphanIds.length) {
      var orphan = {
        type: 'group',
        id: '_ungrouped',
        name: '未分组',
        level: 'L1',
        children: [],
      };
      orphanIds.forEach(function (gid) {
        pagesByGroup[gid].forEach(function (pg) {
          orphan.children.push(pg);
        });
      });
      if (orphan.children.length) roots.push(orphan);
    }
    return roots;
  }

  /** @deprecated 兼容旧调用：返回 L1 + 扁平 pages */
  function buildNavTreeFromSitemap(doc) {
    var site = buildSiteTreeFromSitemap(doc, { forNav: true });
    return site.map(function (l1) {
      var pages = [];
      function walk(n) {
        if (n.type === 'page') {
          pages.push(n.page || n);
          (n.children || []).forEach(walk);
        } else {
          (n.children || []).forEach(walk);
        }
      }
      walk(l1);
      return { id: l1.id, name: l1.name, pages: pages };
    });
  }

  function filterSiteTree(nodes, q, opts) {
    if (!q) return nodes;
    opts = opts || {};
    function matchText(n) {
      var blob = opts.nameOnly
        ? [n.name, n.id].join(' ')
        : [n.name, n.id, n.path, n.version, n.status, n.level].join(' ');
      return blob.toLowerCase().indexOf(q) !== -1;
    }
    function filt(list) {
      var out = [];
      (list || []).forEach(function (n) {
        if (n.type === 'page') {
          var kids = filt(n.children);
          if (matchText(n) || kids.length) {
            out.push(Object.assign({}, n, { children: kids }));
          }
        } else {
          var gKids = filt(n.children);
          if (gKids.length || matchText(n)) {
            out.push(Object.assign({}, n, { children: gKids.length ? gKids : n.children || [] }));
          }
        }
      });
      return out;
    }
    return filt(nodes);
  }

  function escapeRegExp(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightPlainSnippet(text, query, radius) {
    radius = radius == null ? 36 : radius;
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    var q = String(query || '').trim();
    if (!raw) return '';
    if (!q) return raw.slice(0, radius * 2);
    var lower = raw.toLowerCase();
    var idx = lower.indexOf(q.toLowerCase());
    if (idx < 0) return raw.slice(0, radius * 2);
    var start = Math.max(0, idx - radius);
    var end = Math.min(raw.length, idx + q.length + radius);
    var slice = (start > 0 ? '…' : '') + raw.slice(start, end) + (end < raw.length ? '…' : '');
    var re = new RegExp('(' + escapeRegExp(q) + ')', 'ig');
    return escapeHtml(slice).replace(re, '<mark class="prd-hub__mark">$1</mark>');
  }

  function highlightElement(rootEl, query) {
    if (!rootEl || !query) return;
    var q = String(query).trim();
    if (!q) return;
    var re = new RegExp(escapeRegExp(q), 'gi');
    var walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (textNode) {
      var str = textNode.nodeValue || '';
      if (!str || !re.test(str)) return;
      re.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var last = 0;
      var m;
      while ((m = re.exec(str))) {
        if (m.index > last) frag.appendChild(document.createTextNode(str.slice(last, m.index)));
        var mark = document.createElement('mark');
        mark.className = 'prd-hub__mark';
        mark.textContent = m[0];
        frag.appendChild(mark);
        last = m.index + m[0].length;
      }
      if (last < str.length) frag.appendChild(document.createTextNode(str.slice(last)));
      if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function strokeIcon(d) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'ps-glyph');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', d);
    svg.appendChild(path);
    return svg;
  }

  var GLYPH = {
    close: 'M6 18 18 6M6 6l12 12',
    expand:
      'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
    collapse:
      'M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25',
    copy:
      'M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184',
    edit:
      'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10',
    chevron: 'm19.5 8.25-7.5 7.5-7.5-7.5',
    arrowUp: 'M12 19.5v-15m0 0-6.75 6.75M12 4.5l6.75 6.75',
    arrowDown: 'M12 4.5v15m0 0 6.75-6.75M12 19.5l-6.75-6.75',
    enter: 'm7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499',
    stack:
      'M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122',
  };

  function nodeIcon(kind) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'ps-node-icon');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute(
      'd',
      kind === 'folder'
        ? 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z'
        : 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
    );
    svg.appendChild(path);
    return svg;
  }

  /**
   * 三列表格树：页面名称 | 版本号 | 原型状态
   * options: { mode: 'nav'|'prd', packageBase, currentPageId, query, onPageClick }
   */
  function renderSiteTreeTable(container, tree, options) {
    options = options || {};
    var mode = options.mode || 'nav';
    var packageBase = options.packageBase || '';
    var currentPageId = options.currentPageId || '';
    var collapsed = options.collapsedMap || {};

    container.innerHTML = '';
    var table = el('div', { className: 'ps-tree-table' });
    var head = el('div', { className: 'ps-tree-table__head' });
    head.appendChild(el('div', { className: 'ps-tree-table__col ps-tree-table__col--name', text: '页面名称' }));
    head.appendChild(el('div', { className: 'ps-tree-table__col ps-tree-table__col--ver', text: '版本号' }));
    head.appendChild(el('div', { className: 'ps-tree-table__col ps-tree-table__col--status', text: '原型状态' }));
    table.appendChild(head);
    var body = el('div', { className: 'ps-tree-table__body' });

    function appendRows(nodes, depth) {
      (nodes || []).forEach(function (n) {
        var row = el('div', {
          className: 'ps-tree-table__row' + (n.type === 'group' ? ' is-group' : ' is-page'),
        });
        row.style.setProperty('--ps-tree-depth', String(depth || 0));
        if (n.type === 'page' && n.id === currentPageId) row.classList.add('is-current');

        var nameCol = el('div', { className: 'ps-tree-table__col ps-tree-table__col--name' });
        var nameInner = el('div', { className: 'ps-tree-table__name' });

        if (n.type === 'group') {
          var key = 'g:' + n.id;
          var isOpen = collapsed[key] !== true;
          var caret = el('button', {
            className: 'ps-tree-table__caret' + (isOpen ? ' is-open' : ''),
            type: 'button',
            'aria-label': isOpen ? '收起' : '展开',
          });
          caret.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            collapsed[key] = isOpen;
            if (options.onCollapseChange) options.onCollapseChange(collapsed);
            renderSiteTreeTable(container, tree, Object.assign({}, options, { collapsedMap: collapsed }));
          });
          nameInner.appendChild(caret);
          nameInner.appendChild(nodeIcon('folder'));
          nameInner.appendChild(el('span', { className: 'ps-tree-table__label', text: n.name }));
          nameCol.appendChild(nameInner);
          row.appendChild(nameCol);
          row.appendChild(el('div', { className: 'ps-tree-table__col ps-tree-table__col--ver', text: '' }));
          row.appendChild(el('div', { className: 'ps-tree-table__col ps-tree-table__col--status', text: '' }));
          body.appendChild(row);
          if (isOpen) appendRows(n.children, (depth || 0) + 1);
          return;
        }

        nameInner.appendChild(el('span', { className: 'ps-tree-table__spine', 'aria-hidden': 'true' }));
        nameInner.appendChild(nodeIcon('page'));
        var href = resolvePageHref(n.page || n, packageBase);
        var st = prototypeStatusMeta(n.status);
        var canOpen = href && n.status !== 'planned';
        if (mode === 'prd') {
          var aPrd = el('a', {
            className: 'ps-tree-table__label-link',
            href: '#prd-page-' + n.id,
            text: n.name,
          });
          nameInner.appendChild(aPrd);
        } else if (canOpen) {
          var a = el('a', {
            className: 'ps-tree-table__label-link',
            href: href,
            text: n.name,
          });
          nameInner.appendChild(a);
        } else {
          nameInner.appendChild(
            el('span', {
              className: 'ps-tree-table__label is-muted',
              text: n.name,
            })
          );
        }
        nameCol.appendChild(nameInner);
        row.appendChild(nameCol);
        row.appendChild(
          el('div', {
            className: 'ps-tree-table__col ps-tree-table__col--ver',
            text: n.version ? 'v' + n.version.replace(/^v/i, '') : '—',
          })
        );
        var statusCol = el('div', { className: 'ps-tree-table__col ps-tree-table__col--status' });
        statusCol.appendChild(
          el('span', {
            className: 'ps-tree-table__tag ps-tree-table__tag--' + st.tone,
            text: st.label,
          })
        );
        row.appendChild(statusCol);
        body.appendChild(row);
        if (n.children && n.children.length) appendRows(n.children, (depth || 0) + 1);
      });
    }

    if (!tree || !tree.length) {
      body.appendChild(el('div', { className: 'ps-empty', text: '暂无页面' }));
    } else {
      appendRows(tree, 0);
    }
    table.appendChild(body);
    container.appendChild(table);
    return { collapsedMap: collapsed };
  }

  /**
   * PRD / 简易目录树：左侧箭头、统一深度缩进、无版本状态列。
   * options: {
   *   mode, collapsedMap, onCollapseChange, currentPageId, packageBase,
   *   packageEntry: { id, name, href } | null,
   *   onActiveChange
   * }
   */
  function renderSiteTreeNav(container, tree, options) {
    options = options || {};
    var mode = options.mode || 'prd';
    var packageBase = options.packageBase || '';
    var currentPageId = options.currentPageId || '';
    var collapsed = options.collapsedMap || {};
    var packageEntry = options.packageEntry || null;

    function nodeKey(n) {
      return (n.type === 'group' ? 'g:' : 'p:') + n.id;
    }

    function expandAncestorsForId(nodes, targetId, trail) {
      trail = trail || [];
      var found = false;
      (nodes || []).forEach(function (n) {
        if (n.type === 'page' && n.id === targetId) {
          found = true;
          return;
        }
        var next = trail.concat([n]);
        if (expandAncestorsForId(n.children, targetId, next)) {
          found = true;
          next.forEach(function (anc) {
            if (anc.children && anc.children.length) {
              delete collapsed[nodeKey(anc)];
            }
          });
        }
      });
      return found;
    }

    if (currentPageId) {
      expandAncestorsForId(tree, currentPageId);
    }

    container.innerHTML = '';
    var root = el('ul', { className: 'ps-toc-tree', role: 'tree' });

    function toggleNode(n) {
      var key = nodeKey(n);
      var isOpen = collapsed[key] !== true;
      collapsed[key] = isOpen;
      if (options.onCollapseChange) options.onCollapseChange(collapsed);
      renderSiteTreeNav(container, tree, Object.assign({}, options, { collapsedMap: collapsed }));
    }

    function makeCaret(n, isOpen) {
      var caret = el('button', {
        className: 'ps-toc-tree__caret' + (isOpen ? ' is-open' : ''),
        type: 'button',
        'aria-expanded': isOpen ? 'true' : 'false',
        'aria-label': (isOpen ? '收起' : '展开') + ' ' + (n.name || ''),
      });
      caret.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleNode(n);
      });
      caret.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          toggleNode(n);
        }
      });
      return caret;
    }

    function makeSpacer() {
      return el('span', {
        className: 'ps-toc-tree__caret-spacer',
        'aria-hidden': 'true',
      });
    }

    function appendNodes(list, ul, depth) {
      (list || []).forEach(function (n) {
        var hasKids = !!(n.children && n.children.length);
        var key = nodeKey(n);
        var isOpen = !hasKids || collapsed[key] !== true;
        var isCurrent =
          n.type === 'page' && (n.id === currentPageId || (packageEntry && packageEntry.id === n.id));
        var li = el('li', {
          className:
            'ps-toc-tree__item' +
            (n.type === 'group' ? ' is-group' : ' is-page') +
            (isCurrent ? ' is-current' : '') +
            (hasKids ? ' has-children' : '') +
            (isOpen ? ' is-open' : ''),
          role: 'treeitem',
          'aria-expanded': hasKids ? (isOpen ? 'true' : 'false') : undefined,
        });

        var row = el('div', { className: 'ps-toc-tree__row' });
        row.style.setProperty('--ps-toc-depth', String(depth || 0));

        if (hasKids) {
          row.appendChild(makeCaret(n, isOpen));
        } else {
          row.appendChild(makeSpacer());
        }
        row.appendChild(nodeIcon(n.type === 'group' ? 'folder' : 'page'));

        if (n.type === 'group') {
          var gLabel = el('span', {
            className: 'ps-toc-tree__label ps-toc-tree__label--group',
            text: n.name,
            title: n.name,
          });
          row.appendChild(gLabel);
          row.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('.ps-toc-tree__caret')) return;
            toggleNode(n);
          });
          li.appendChild(row);
          if (hasKids && isOpen) {
            var gUl = el('ul', { className: 'ps-toc-tree__children', role: 'group' });
            appendNodes(n.children, gUl, (depth || 0) + 1);
            li.appendChild(gUl);
          }
          ul.appendChild(li);
          return;
        }

        var href =
          mode === 'prd' ? '#prd-page-' + n.id : resolvePageHref(n.page || n, packageBase);
        var canOpen = mode === 'prd' || (href && n.status !== 'planned');
        var labelClass =
          'ps-toc-tree__label' +
          (isCurrent ? ' is-current' : '') +
          (canOpen ? '' : ' is-muted');

        if (canOpen && href) {
          var a = el('a', {
            className: labelClass,
            href: href,
            text: n.name,
            title: n.name,
          });
          a.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (options.onNavigate) options.onNavigate(n.id);
          });
          row.appendChild(a);
        } else {
          row.appendChild(
            el('span', {
              className: labelClass,
              text: n.name,
              title: n.name,
            })
          );
        }

        // 有子页：整行点击空白不折叠；仅箭头折叠（已绑定）
        li.appendChild(row);
        if (hasKids && isOpen) {
          var pUl = el('ul', { className: 'ps-toc-tree__children', role: 'group' });
          appendNodes(n.children, pUl, (depth || 0) + 1);
          li.appendChild(pUl);
        }
        ul.appendChild(li);
      });
    }

    if (packageEntry) {
      var pkgLi = el('li', {
        className:
          'ps-toc-tree__item is-page is-package' +
          (currentPageId === packageEntry.id ? ' is-current' : ''),
        role: 'treeitem',
      });
      var pkgRow = el('div', { className: 'ps-toc-tree__row' });
      pkgRow.style.setProperty('--ps-toc-depth', '0');
      pkgRow.appendChild(makeSpacer());
      pkgRow.appendChild(nodeIcon('page'));
      var pkgLink = el('a', {
        className:
          'ps-toc-tree__label' + (currentPageId === packageEntry.id ? ' is-current' : ''),
        href: packageEntry.href || '#prd-package',
        text: packageEntry.name || '项目概述',
        title: packageEntry.name || '项目概述',
      });
      pkgLink.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (options.onNavigate) options.onNavigate(packageEntry.id);
      });
      pkgRow.appendChild(pkgLink);
      pkgLi.appendChild(pkgRow);
      root.appendChild(pkgLi);
    }

    if (!tree || !tree.length) {
      if (!packageEntry) {
        container.appendChild(el('div', { className: 'ps-empty', text: '暂无页面' }));
        return { collapsedMap: collapsed };
      }
    } else {
      appendNodes(tree, root, 0);
    }
    container.appendChild(root);
    return { collapsedMap: collapsed };
  }

  function resolvePageHref(page, packageBase) {
    if (!page) return null;
    if (page.path) {
      try {
        return new URL(page.path, packageBase).href;
      } catch (e) {
        return page.path;
      }
    }
    return null;
  }

  function changelogLabel(doc, pageId, meta) {
    if (!pageId) return '项目';
    if (doc && doc.labels && doc.labels[pageId]) return doc.labels[pageId];
    if (meta && meta.page && meta.page.id === pageId && meta.page.name) return meta.page.name;
    return pageId;
  }

  function normalizeChangelogEntries(doc, meta) {
    var out = [];
    var packageList = (doc && doc.package) || [];
    if (!Array.isArray(packageList)) packageList = [];
    packageList.forEach(function (entry, idx) {
      if (!entry || typeof entry !== 'object') return;
      out.push({
        date: entry.date || '',
        summary: entry.summary || '',
        items: Array.isArray(entry.items) ? entry.items : [],
        scope: 'package',
        pageId: null,
        label: '项目',
        _sort: String(entry.date || '') + '-0-' + idx,
      });
    });
    var pages = (doc && doc.pages) || {};
    Object.keys(pages).forEach(function (pageId) {
      var list = pages[pageId];
      if (!Array.isArray(list)) return;
      list.forEach(function (entry, idx) {
        if (!entry || typeof entry !== 'object') return;
        out.push({
          date: entry.date || '',
          summary: entry.summary || '',
          items: Array.isArray(entry.items) ? entry.items : [],
          scope: 'page',
          pageId: pageId,
          label: changelogLabel(doc, pageId, meta),
          _sort: String(entry.date || '') + '-1-' + pageId + '-' + idx,
        });
      });
    });
    out.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a._sort < b._sort ? 1 : -1;
    });
    return out;
  }

  function filterChangelogEntries(entries, view, pageId) {
    if (view === 'page') {
      if (!pageId) return [];
      return entries.filter(function (e) {
        return e.scope === 'page' && e.pageId === pageId;
      });
    }
    return entries;
  }

  function changelogModuleKey(entry) {
    if (!entry) return '';
    if (entry.scope === 'package') return 'package';
    return entry.pageId || '';
  }

  function collectChangelogModules(entries, doc, meta) {
    var seen = {};
    var list = [];
    (entries || []).forEach(function (e) {
      var key = changelogModuleKey(e);
      if (!key || seen[key]) return;
      seen[key] = true;
      list.push({
        key: key,
        label: e.scope === 'package' ? '项目' : changelogLabel(doc, e.pageId, meta),
      });
    });
    list.sort(function (a, b) {
      if (a.key === 'package') return -1;
      if (b.key === 'package') return 1;
      return a.label < b.label ? -1 : 1;
    });
    return list;
  }

  function collectChangelogDates(entries) {
    var map = {};
    (entries || []).forEach(function (e) {
      if (e && e.date) map[e.date] = true;
    });
    return map;
  }

  function applyChangelogFilters(entries, filters) {
    var list = entries || [];
    var moduleKey = filters && filters.moduleKey;
    if (moduleKey) {
      list = list.filter(function (e) {
        return changelogModuleKey(e) === moduleKey;
      });
    }
    var date = filters && filters.date;
    if (date) {
      list = list.filter(function (e) {
        return e.date === date;
      });
    }
    var query = filters && filters.query ? String(filters.query).trim().toLowerCase() : '';
    if (query) {
      list = list.filter(function (e) {
        var blob = [e.summary || '']
          .concat(Array.isArray(e.items) ? e.items : [])
          .join('\n')
          .toLowerCase();
        return blob.indexOf(query) !== -1;
      });
    }
    return list;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatYmd(y, m0, d) {
    return y + '-' + pad2(m0 + 1) + '-' + pad2(d);
  }

  function renderChangelogList(entries, emptyText) {
    var root = el('div', { className: 'ps-changelog' });
    if (!entries || !entries.length) {
      root.appendChild(el('div', { className: 'ps-empty', text: emptyText || '暂无更新记录' }));
      return root;
    }
    entries.forEach(function (entry) {
      var head = el('div', { className: 'ps-changelog__head' });
      head.appendChild(el('span', { className: 'ps-changelog__date', text: entry.date || '未标注日期' }));
      head.appendChild(
        el('span', {
          className: 'ps-changelog__badge' + (entry.scope === 'package' ? ' is-package' : ' is-page'),
          text: entry.label || (entry.scope === 'package' ? '项目' : entry.pageId),
        })
      );
      var card = el('article', { className: 'ps-changelog__item' }, [
        head,
        el('h3', { className: 'ps-changelog__summary', text: entry.summary || '（无摘要）' }),
      ]);
      if (entry.items && entry.items.length) {
        var ul = el('ul', { className: 'ps-changelog__items' });
        entry.items.forEach(function (it) {
          ul.appendChild(el('li', { html: inlineMd(String(it)) }));
        });
        card.appendChild(ul);
      }
      root.appendChild(card);
    });
    return root;
  }

  function buildChangelogCalendar(opts) {
    var marked = opts.markedDates || {};
    var selected = opts.selectedDate || null;
    var cursor = opts.cursorMonth || new Date();
    var year = cursor.getFullYear();
    var month = cursor.getMonth();
    var root = el('div', { className: 'ps-cal' });

    var head = el('div', { className: 'ps-cal__head' });
    head.appendChild(
      el('button', {
        type: 'button',
        className: 'ps-cal__nav',
        text: '‹',
        title: '上个月',
        onClick: function (e) {
          e.stopPropagation();
          opts.onMonthChange(new Date(year, month - 1, 1));
        },
      })
    );
    head.appendChild(el('div', { className: 'ps-cal__title', text: year + '年' + (month + 1) + '月' }));
    head.appendChild(
      el('button', {
        type: 'button',
        className: 'ps-cal__nav',
        text: '›',
        title: '下个月',
        onClick: function (e) {
          e.stopPropagation();
          opts.onMonthChange(new Date(year, month + 1, 1));
        },
      })
    );
    root.appendChild(head);

    var week = el('div', { className: 'ps-cal__week' });
    ['日', '一', '二', '三', '四', '五', '六'].forEach(function (w) {
      week.appendChild(el('span', { text: w }));
    });
    root.appendChild(week);

    var grid = el('div', { className: 'ps-cal__grid' });
    var firstDow = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var i;
    for (i = 0; i < firstDow; i++) {
      grid.appendChild(el('span', { className: 'ps-cal__day is-empty' }));
    }
    for (i = 1; i <= daysInMonth; i++) {
      (function (day) {
        var ymd = formatYmd(year, month, day);
        var has = !!marked[ymd];
        var isSel = selected === ymd;
        var btn = el('button', {
          type: 'button',
          className:
            'ps-cal__day' +
            (has ? ' has-mark' : '') +
            (isSel ? ' is-selected' : '') +
            (!has ? ' is-muted' : ''),
          text: String(day),
          onClick: function (e) {
            e.stopPropagation();
            if (!has) return;
            opts.onSelectDate(isSel ? null : ymd);
          },
        });
        if (has) {
          btn.appendChild(el('i', { className: 'ps-cal__dot', 'aria-hidden': 'true' }));
        }
        grid.appendChild(btn);
      })(i);
    }
    root.appendChild(grid);

    var foot = el('div', { className: 'ps-cal__foot' });
    foot.appendChild(
      el('button', {
        type: 'button',
        className: 'ps-cal__clear',
        text: '清除日期',
        onClick: function (e) {
          e.stopPropagation();
          opts.onSelectDate(null);
        },
      })
    );
    root.appendChild(foot);
    return root;
  }

  /* ---- UI shell ---- */
  var quickFindInstalled = false;

  function prdSectionUrl(prdUrl, id) {
    if (!prdUrl) return '';
    try {
      var url = new URL(prdUrl, global.location.href);
      url.hash = id === 'package' ? 'prd-package' : 'prd-page-' + id;
      return url.href;
    } catch (e) {
      return prdUrl;
    }
  }

  function installQuickFind(options) {
    if (quickFindInstalled || !global.document) return;
    options = options || {};
    if (!options.sitemapUrl && !(options.inline && options.inline.sitemap != null) && !options.specBase) {
      return;
    }
    quickFindInstalled = true;

    var prdUrl = options.prdUrl || '';
    var specRoot = normalizeBase(options.specBase || '../proto-spec/');
    var pkgBase = packageBaseFromOptions(options);
    var packagePrdUrl = options.packagePrdUrl || '';
    if (!prdUrl && packagePrdUrl) {
      try {
        prdUrl = new URL('../index.html', new URL(packagePrdUrl, global.location.href)).href;
      } catch (e1) {}
    }
    if (!packagePrdUrl && prdUrl) {
      try {
        packagePrdUrl = new URL('docs/prd.md', new URL(prdUrl, global.location.href)).href;
      } catch (e2) {}
    }

    var corpus = null;
    var loading = null;
    var failed = '';
    var query = '';
    var active = 0;
    var open = false;
    var composing = false;
    var pointer = false;

    var root = el('div', { className: 'ps-quick', id: 'psQuickFind' });
    var mask = el('div', { className: 'ps-quick__mask' });
    var panel = el('div', {
      className: 'ps-quick__panel',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': '搜索页面和正文',
    });
    var input = el('input', {
      className: 'ps-quick__input',
      type: 'text',
      placeholder: '搜索页面和正文',
      'aria-label': '搜索页面和正文',
      autocomplete: 'off',
    });
    var list = el('div', { className: 'ps-quick__list', role: 'listbox' });
    var hint = el('div', { className: 'ps-quick__hint' });
    function mouseLeftIcon() {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('class', 'ps-glyph');
      function path(d, filled) {
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        if (filled) {
          p.setAttribute('fill', 'currentColor');
          p.setAttribute('stroke', 'none');
        } else {
          p.setAttribute('fill', 'none');
          p.setAttribute('stroke', 'currentColor');
          p.setAttribute('stroke-width', '1.5');
          p.setAttribute('stroke-linecap', 'round');
          p.setAttribute('stroke-linejoin', 'round');
        }
        svg.appendChild(p);
      }
      path('M12 3.75a4.25 4.25 0 0 0-4.25 4.25v8a4.25 4.25 0 0 0 8.5 0v-8A4.25 4.25 0 0 0 12 3.75Z');
      path('M12 3.75v4.75');
      path('M7.75 8.5h8.5');
      path('M8.9 5.9c.55-.85 1.55-1.35 2.7-1.4v3.35H8.55c.1-.75.4-1.4.35-1.95Z', true);
      return svg;
    }
    function keycap(icon, name) {
      var cap = el('span', { className: 'ps-quick__key', title: name, 'aria-hidden': 'true' });
      cap.appendChild(typeof icon === 'string' ? strokeIcon(icon) : icon);
      return cap;
    }
    function hintItem(nodes) {
      var item = el('span', { className: 'ps-quick__hint-item' });
      nodes.forEach(function (node) {
        item.appendChild(node);
      });
      return item;
    }
    hint.appendChild(
      hintItem([keycap(GLYPH.arrowUp, '上'), keycap(GLYPH.arrowDown, '下'), document.createTextNode('选择')])
    );
    hint.appendChild(el('span', { className: 'ps-quick__hint-sep', text: '｜' }));
    hint.appendChild(hintItem([keycap(GLYPH.enter, '回车'), document.createTextNode('跳转原型')]));
    hint.appendChild(el('span', { className: 'ps-quick__hint-sep', text: '｜' }));
    hint.appendChild(hintItem([keycap(mouseLeftIcon(), '鼠标左键'), document.createTextNode('跳转 PRD 页面')]));
    panel.appendChild(input);
    panel.appendChild(list);
    panel.appendChild(hint);
    root.appendChild(mask);
    root.appendChild(panel);
    document.body.appendChild(root);

    function loadPageMd(pageId) {
      return fetchText(resolveUrl(specRoot, pageId + '.md'))
        .then(function (raw) {
          return parseFrontmatter(raw).body;
        })
        .catch(function () {
          return fetchText(resolveUrl(specRoot, pageId + '/spec.md'))
            .then(function (raw) {
              return parseFrontmatter(raw).body;
            })
            .catch(function () {
              return fetchText(resolveUrl(specRoot, pageId + '/business.md')).catch(function () {
                return '';
              });
            });
        });
    }

    function ensureCorpus() {
      if (corpus) return Promise.resolve(corpus);
      if (loading) return loading;
      failed = '';
      loading = loadSitemapDoc({
        sitemapUrl: options.sitemapUrl,
        inline: options.inline,
        specBase: options.specBase,
      })
        .then(function (doc) {
          var pages = flattenSitemapPages(doc.pages || []).filter(function (p) {
            return !p.hideInPrdPageList && p.status !== 'deprecated';
          });
          var tasks = pages.map(function (p) {
            return loadPageMd(p.id).then(function (md) {
              return {
                id: p.id,
                name: p.name || p.id,
                href: resolvePageHref(p, pkgBase),
                body: md || '',
              };
            });
          });
          var intro = packagePrdUrl
            ? fetchText(packagePrdUrl)
                .then(function (md) {
                  return {
                    id: 'package',
                    name: /全局约定|共享规则|通用规则|跨页约定/.test(md || '') ? '总体说明' : '项目概述',
                    href: prdSectionUrl(prdUrl, 'package'),
                    body: md || '',
                  };
                })
                .catch(function () {
                  return null;
                })
            : Promise.resolve(null);
          return Promise.all([intro, Promise.all(tasks)]).then(function (pair) {
            var items = [];
            if (pair[0] && pair[0].body) items.push(pair[0]);
            corpus = items.concat(pair[1]);
            loading = null;
            return corpus;
          });
        })
        .catch(function () {
          loading = null;
          failed = '暂时无法检索';
          corpus = [];
          return corpus;
        });
      return loading;
    }

    function hitsFor(q) {
      var text = String(q || '').trim();
      if (!text || !corpus) return [];
      var lower = text.toLowerCase();
      var hits = [];
      corpus.forEach(function (item) {
        var blob = [item.name, item.id, item.body || ''].join('\n');
        if (blob.toLowerCase().indexOf(lower) === -1) return;
        hits.push({
          id: item.id,
          name: item.name,
          protoHref: item.href || prdSectionUrl(prdUrl, item.id),
          prdHref: prdSectionUrl(prdUrl, item.id) || item.href,
          snippetHtml: highlightPlainSnippet(blob, text),
        });
      });
      return hits;
    }

    function paint() {
      list.innerHTML = '';
      var q = String(query || '').trim();
      if (failed) {
        list.appendChild(el('div', { className: 'ps-quick__empty', text: failed }));
        return;
      }
      if (!corpus) {
        list.appendChild(el('div', { className: 'ps-quick__empty', text: '正在准备' }));
        return;
      }
      if (!q) {
        list.appendChild(el('div', { className: 'ps-quick__empty', text: '输入关键字' }));
        return;
      }
      var hits = hitsFor(q);
      if (!hits.length) {
        list.appendChild(el('div', { className: 'ps-quick__empty', text: '无匹配内容' }));
        return;
      }
      if (active >= hits.length) active = 0;
      if (active < 0) active = hits.length - 1;
      hits.forEach(function (hit, i) {
        var item = el('button', {
          type: 'button',
          className: 'ps-quick__hit' + (i === active ? ' is-active' : ''),
          role: 'option',
          'aria-selected': i === active ? 'true' : 'false',
        });
        item.appendChild(el('div', { className: 'ps-quick__hit-title', text: hit.name }));
        var sn = el('div', { className: 'ps-quick__hit-snippet' });
        sn.innerHTML = hit.snippetHtml || '';
        item.appendChild(sn);
        item.addEventListener('mouseenter', function () {
          if (!pointer || active === i) return;
          pointer = false;
          active = i;
          var nodes = list.querySelectorAll('.ps-quick__hit');
          for (var n = 0; n < nodes.length; n++) {
            var on = n === i;
            nodes[n].classList.toggle('is-active', on);
            nodes[n].setAttribute('aria-selected', on ? 'true' : 'false');
          }
        });
        item.addEventListener('click', function () {
          jump(hit.prdHref);
        });
        list.appendChild(item);
      });
      var current = list.querySelector('.is-active');
      if (current && current.scrollIntoView) current.scrollIntoView({ block: 'nearest' });
    }

    function jump(url) {
      if (!url) return;
      closeQuick();
      global.location.href = url;
    }

    function openQuick() {
      open = true;
      root.classList.add('is-open');
      query = '';
      input.value = '';
      active = 0;
      paint();
      ensureCorpus().then(function () {
        if (open) paint();
      });
      setTimeout(function () {
        input.focus();
      }, 0);
    }

    function closeQuick() {
      open = false;
      root.classList.remove('is-open');
    }

    function move(step) {
      var hits = hitsFor(query);
      if (!hits.length) return;
      pointer = false;
      active = (active + step + hits.length) % hits.length;
      paint();
    }

    list.addEventListener('mousemove', function () {
      pointer = true;
    });
    mask.addEventListener('click', closeQuick);
    input.addEventListener('compositionstart', function () {
      composing = true;
    });
    input.addEventListener('compositionend', function () {
      composing = false;
      query = input.value || '';
      active = 0;
      paint();
    });
    input.addEventListener('input', function () {
      if (composing) return;
      query = input.value || '';
      active = 0;
      paint();
    });
    input.addEventListener('keydown', function (e) {
      var key = e.key || '';
      var up = key === 'ArrowUp' || e.keyCode === 38;
      var down = key === 'ArrowDown' || e.keyCode === 40;
      if (up || down) {
        e.preventDefault();
        e.stopPropagation();
        move(down ? 1 : -1);
      } else if (key === 'Enter') {
        e.preventDefault();
        var hits = hitsFor(query);
        if (hits[active]) jump(hits[active].protoHref);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeQuick();
      }
    });

    document.addEventListener('keydown', function (e) {
      var key = e.key || '';
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (key === 'k' || key === 'K')) {
        if (e.repeat) return;
        e.preventDefault();
        if (open) closeQuick();
        else openQuick();
        return;
      }
      if (!open) return;
      if (key === 'Escape') {
        e.preventDefault();
        closeQuick();
      }
    });
  }

  function sideOfAnchor(anchor) {
    return String(anchor).indexOf('left') === 0 ? 'left' : 'right';
  }

  function placeFab(root, anchor) {
    var side = sideOfAnchor(anchor);
    var vert = anchor.split('-')[1] || 'bottom';
    root.dataset.side = side;
    root.dataset.anchor = anchor;
    root.style.left = side === 'left' ? '0' : '';
    root.style.right = side === 'right' ? '0' : '';
    root.style.top = '';
    root.style.bottom = '';
    root.style.transform = '';
    if (vert === 'top') root.style.top = '96px';
    else if (vert === 'center') {
      root.style.top = '50%';
      root.style.transform = side === 'right' ? 'translate(50%, -50%)' : 'translate(-50%, -50%)';
      root._center = true;
    } else root.style.bottom = '96px';
    root._center = vert === 'center';
    applyFabHide(root);
  }

  function applyFabHide(root) {
    if (root._center) {
      // keep center transform and add hide via margin trick
      var side = root.dataset.side;
      if (root.classList.contains('is-revealed') || root.classList.contains('is-open') || root.classList.contains('is-dragging')) {
        root.style.transform = 'translate(0, -50%)';
      } else {
        root.style.transform = side === 'right' ? 'translate(50%, -50%)' : 'translate(-50%, -50%)';
      }
      return;
    }
    // non-center uses CSS [data-side] transform
  }

  function nearestAnchor(x, y) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var side = x < w / 2 ? 'left' : 'right';
    var vert = y < h * 0.33 ? 'top' : y > h * 0.66 ? 'bottom' : 'center';
    return side + '-' + vert;
  }

  var REVIEW_POS_KEY = 'proto-spec.reviewToolbar';
  var REVIEW_GROUPS = ['role', 'status', 'scenario'];
  var REVIEW_GROUP_LABEL = { role: '角色', status: '状态', scenario: '权限场景' };

  function mountReviewToolbar(options) {
    var perspectives = Array.isArray(options.demoPerspectives) ? options.demoPerspectives : [];
    var active = options.demoPerspectiveActive;
    var groups = { role: [], status: [], scenario: [] };
    perspectives.forEach(function (item) {
      if (!item) return;
      var group = item.group != null ? String(item.group) : 'role';
      if (!groups[group]) group = 'role';
      groups[group].push(item);
    });
    var visible = REVIEW_GROUPS.filter(function (group) {
      return groups[group].length > 0;
    });
    if (!visible.length) return;

    function itemKey(item, field) {
      return item && item[field] != null ? String(item[field]) : '';
    }

    function activeKey(group) {
      if (active && typeof active === 'object') {
        return active[group] == null ? '' : String(active[group]);
      }
      return active != null ? String(active) : '';
    }

    function matches(item, group) {
      var key = activeKey(group);
      if (!key) return false;
      return key === itemKey(item, 'id') || key === itemKey(item, 'role') || key === itemKey(item, 'status');
    }

    function currentItem(group) {
      var list = groups[group];
      for (var i = 0; i < list.length; i++) {
        if (matches(list[i], group)) return list[i];
      }
      return list[0];
    }

    var bar = el('div', {
      className: 'ps-review',
      id: 'psReviewToolbar',
      role: 'toolbar',
      'aria-label': '评审工具',
    });
    bar.appendChild(el('span', { className: 'ps-review__brand', text: '评审工具' }));

    var openSlot = null;

    function closeMenus() {
      if (!openSlot) return;
      openSlot.classList.remove('is-open');
      var trigger = openSlot.querySelector('.ps-review__trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      openSlot = null;
    }

    function alignMenu(slot) {
      var menu = slot.querySelector('.ps-review__menu');
      if (!menu) return;
      menu.classList.remove('is-up');
      menu.style.left = '0';
      menu.style.right = 'auto';
      var slotRect = slot.getBoundingClientRect();
      var menuRect = menu.getBoundingClientRect();
      var spaceBelow = window.innerHeight - slotRect.bottom;
      if (spaceBelow < menuRect.height + 8 && slotRect.top > menuRect.height + 8) {
        menu.classList.add('is-up');
      }
      menuRect = menu.getBoundingClientRect();
      if (menuRect.right > window.innerWidth - 8) {
        menu.style.left = 'auto';
        menu.style.right = '0';
      }
      if (menu.getBoundingClientRect().left < 8) {
        menu.style.left = '0';
        menu.style.right = 'auto';
      }
    }

    visible.forEach(function (group) {
      bar.appendChild(el('span', { className: 'ps-review__sep', 'aria-hidden': 'true' }));
      var list = groups[group];
      var current = currentItem(group);
      var currentLabel = current && current.label != null ? String(current.label) : '';
      var slot = el('div', { className: 'ps-review__slot' });
      if (list.length < 2) {
        slot.classList.add('is-static');
        slot.appendChild(
          el('span', { className: 'ps-review__static' }, [
            el('span', { className: 'ps-review__key', text: REVIEW_GROUP_LABEL[group] + ':' }),
            el('span', { className: 'ps-review__val', text: currentLabel }),
          ])
        );
        bar.appendChild(slot);
        return;
      }
      var trigger = el('button', {
        type: 'button',
        className: 'ps-review__trigger',
        title: (current && current.title) || REVIEW_GROUP_LABEL[group] + '：' + currentLabel,
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
      });
      trigger.appendChild(el('span', { className: 'ps-review__key', text: REVIEW_GROUP_LABEL[group] + ':' }));
      trigger.appendChild(el('span', { className: 'ps-review__val', text: currentLabel }));
      trigger.appendChild(el('span', { className: 'ps-review__caret', 'aria-hidden': 'true' }));
      var menu = el('div', { className: 'ps-review__menu', role: 'menu' });
      list.forEach(function (item) {
        var label = item.label != null ? String(item.label) : itemKey(item, 'id');
        var option = el('button', {
          type: 'button',
          className: 'ps-review__option' + (item === current ? ' is-active' : ''),
          role: 'menuitem',
          title: item.title || label,
          text: label,
        });
        option.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeMenus();
          if (typeof options.onDemoPerspective === 'function') options.onDemoPerspective(item);
        });
        menu.appendChild(option);
      });
      slot.appendChild(trigger);
      slot.appendChild(menu);
      bar.appendChild(slot);
    });
    document.body.appendChild(bar);

    function place(x, y) {
      var maxX = Math.max(0, window.innerWidth - bar.offsetWidth);
      var maxY = Math.max(0, window.innerHeight - bar.offsetHeight);
      var left = Math.max(0, Math.min(maxX, x));
      var top = Math.max(0, Math.min(maxY, y));
      bar.style.left = left + 'px';
      bar.style.top = top + 'px';
      bar.style.right = 'auto';
      bar.style.bottom = 'auto';
      return { left: left, top: top };
    }

    var stored = loadStorage(REVIEW_POS_KEY, '');
    var initial = null;
    if (stored) {
      try {
        initial = JSON.parse(stored);
      } catch (e) {
        initial = null;
      }
    }
    if (initial && Number.isFinite(Number(initial.left)) && Number.isFinite(Number(initial.top))) {
      place(Number(initial.left), Number(initial.top));
    } else {
      place(window.innerWidth - bar.offsetWidth - 16, 16);
    }

    var drag = { active: false, moved: false, pointerId: null, startX: 0, startY: 0, origLeft: 0, origTop: 0 };

    bar.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest && e.target.closest('.ps-review__menu, .ps-review__option')) return;
      var rect = bar.getBoundingClientRect();
      drag.active = true;
      drag.moved = false;
      drag.pointerId = e.pointerId;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.origLeft = rect.left;
      drag.origTop = rect.top;
    });
    bar.addEventListener('pointermove', function (e) {
      if (!drag.active || drag.pointerId !== e.pointerId) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      if (!drag.moved && dx * dx + dy * dy > 36) {
        drag.moved = true;
        bar.classList.add('is-dragging');
        closeMenus();
        try {
          bar.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
      if (drag.moved) place(drag.origLeft + dx, drag.origTop + dy);
    });
    function endDrag(e) {
      if (!drag.active || (e && drag.pointerId != null && e.pointerId !== drag.pointerId)) return;
      var moved = drag.moved;
      var pointerId = drag.pointerId;
      drag.active = false;
      drag.moved = false;
      drag.pointerId = null;
      bar.classList.remove('is-dragging');
      if (moved) {
        var rect = bar.getBoundingClientRect();
        saveStorage(REVIEW_POS_KEY, JSON.stringify(place(rect.left, rect.top)));
        var swallow = function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          bar.removeEventListener('click', swallow, true);
        };
        bar.addEventListener('click', swallow, true);
        setTimeout(function () {
          bar.removeEventListener('click', swallow, true);
        }, 0);
      }
      if (pointerId != null) {
        try {
          bar.releasePointerCapture(pointerId);
        } catch (err) {}
      }
    }
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);

    bar.addEventListener('click', function (e) {
      var option = e.target.closest && e.target.closest('.ps-review__option');
      if (option && bar.contains(option)) return;
      var trigger = e.target.closest && e.target.closest('.ps-review__trigger');
      if (!trigger || !bar.contains(trigger)) return;
      e.preventDefault();
      e.stopPropagation();
      var slot = trigger.parentNode;
      var willOpen = slot !== openSlot;
      closeMenus();
      if (!willOpen) return;
      slot.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      openSlot = slot;
      alignMenu(slot);
    });

    document.addEventListener('pointerdown', function (e) {
      if (bar.contains(e.target)) return;
      closeMenus();
    });
    document.addEventListener(
      'keydown',
      function (e) {
        if (e.key !== 'Escape' || !openSlot) return;
        e.stopPropagation();
        closeMenus();
      },
      true
    );
    window.addEventListener('resize', function () {
      var rect = bar.getBoundingClientRect();
      saveStorage(REVIEW_POS_KEY, JSON.stringify(place(rect.left, rect.top)));
      if (openSlot) alignMenu(openSlot);
    });
  }

  function createRuntime(options) {
    options = options || {};
    var storedWidth = Number(loadStorage(STORAGE.width, ''));
    // 旧默认 640 → 新默认 880（仅为未手动拉宽的用户升级一次）
    if (storedWidth === 640) storedWidth = 880;
    var state = {
      mode: null, // null | 'spec' | 'changelog' | 'nav'
      fullscreen: false,
      dragging: false,
      width: storedWidth || Number(options.defaultWidth) || 880,
      anchor: loadStorage(STORAGE.anchor, options.anchor || 'right-bottom'),
      meta: null,
      modules: [],
      activeKey: null,
      cache: {},
      changelogDoc: null,
      changelogEntries: null,
      changelogView: 'page', // page | all
      changelogQuery: '',
      changelogDate: null,
      changelogModule: null, // null | 'package' | pageId；仅全部视图
      changelogCalMonth: null,
      changelogCalOpen: false,
      sitemapDoc: null,
      navTree: null,
      navQuery: '',
      packageBase: packageBaseFromOptions(options),
    };
    if (!Number.isFinite(state.width) || state.width < 640) state.width = 880;
    if (ANCHORS.indexOf(state.anchor) < 0) state.anchor = 'right-bottom';
    installQuickFind(options);

    var fabRoot = el('div', { className: 'ps-fab-root', id: 'psFabRoot' });
    var fabMenu = el('div', { className: 'ps-fab-menu' });
    var fabEdge = el('div', { className: 'ps-fab-edge', id: 'psFabEdge' });
    var fabRevealTimer = null;
    var fabOverFab = false;
    var fabOverEdge = false;
    var FAB_HOLD_KEY = 'proto-spec.fabHold';
    var fabHoldUntil = 0;
    try {
      if (sessionStorage.getItem(FAB_HOLD_KEY) === '1') {
        sessionStorage.removeItem(FAB_HOLD_KEY);
        fabHoldUntil = Date.now() + 600;
      }
    } catch (e) {}

    function rememberFabHold() {
      try {
        sessionStorage.setItem(FAB_HOLD_KEY, '1');
      } catch (e) {}
    }

    function setFabRevealed(on) {
      if (on) fabRoot.classList.add('is-revealed');
      else if (!state.mode && !state.dragging) fabRoot.classList.remove('is-revealed');
      applyFabHide(fabRoot);
    }

    function syncFabReveal() {
      clearTimeout(fabRevealTimer);
      if (Date.now() < fabHoldUntil || fabOverFab || fabOverEdge || state.mode || state.dragging) {
        setFabRevealed(true);
        return;
      }
      fabRevealTimer = setTimeout(function () {
        if (!fabOverFab && !fabOverEdge && !state.mode && !state.dragging) {
          setFabRevealed(false);
        }
      }, 120);
    }

    function placeFabEdge(anchor) {
      var side = sideOfAnchor(anchor);
      fabEdge.dataset.side = side;
    }

    mountReviewToolbar(options);

    if (options.prdUrl) {
      fabRoot.classList.add('has-prd');
      var fabPrd = el('a', {
        className: 'ps-fab-secondary',
        href: options.prdUrl,
        text: 'PRD 汇总',
        title: '打开 PRD 汇总',
      });
      fabPrd.addEventListener('click', function (e) {
        e.stopPropagation();
      });
      fabMenu.appendChild(fabPrd);
    }

    var fabChangelog = el('button', {
      type: 'button',
      className: 'ps-fab-secondary',
      text: '更新记录',
      title: '查看本页与全部项目更新记录',
      onClick: function (e) {
        e.stopPropagation();
        if (state.mode === 'changelog') closeAll();
        else openChangelog();
      },
    });
    var fabNav = el('button', {
      type: 'button',
      className: 'ps-fab-secondary',
      text: '导航目录',
      title: '按 L1 浏览并跳转全部页面',
      onClick: function (e) {
        e.stopPropagation();
        if (state.mode === 'nav') closeAll();
        else openNav();
      },
    });
    fabMenu.appendChild(fabChangelog);
    fabMenu.appendChild(fabNav);

    var fabMain = el('button', {
      type: 'button',
      className: 'ps-fab',
      text: options.fabLabel || '原型说明',
      title: '拖动可改位置；点击打开说明',
    });
    fabRoot.appendChild(fabMenu);
    fabRoot.appendChild(fabMain);
    document.body.appendChild(fabEdge);
    document.body.appendChild(fabRoot);
    placeFab(fabRoot, state.anchor);
    placeFabEdge(state.anchor);
    if (fabHoldUntil) {
      fabRoot.classList.add('is-revealed');
      applyFabHide(fabRoot);
    }

    fabRoot.addEventListener('mouseenter', function () {
      fabOverFab = true;
      syncFabReveal();
    });
    fabRoot.addEventListener('mouseleave', function () {
      fabOverFab = false;
      syncFabReveal();
    });
    fabEdge.addEventListener('mouseenter', function () {
      fabOverEdge = true;
      syncFabReveal();
    });
    fabEdge.addEventListener('mouseleave', function () {
      fabOverEdge = false;
      syncFabReveal();
    });

    var mask = el('div', { className: 'ps-mask', id: 'psMask' });

    function resolveWorkspaceRoot() {
      if (options.workspaceRoot) return String(options.workspaceRoot).replace(/[/\\]+$/, '');
      try {
        if (typeof window !== 'undefined' && window.__PROTO_WORKSPACE_ROOT__) {
          return String(window.__PROTO_WORKSPACE_ROOT__).replace(/[/\\]+$/, '');
        }
      } catch (e) {}
      var stored = loadStorage('proto-spec.workspaceRoot', '');
      return stored ? String(stored).replace(/[/\\]+$/, '') : '';
    }

    function resolveSpecFileAbs() {
      if (options.specFileAbs) return String(options.specFileAbs);
      var pageId = options.pageId || (state.meta && state.meta.page && state.meta.page.id);
      if (!pageId) return '';
      var root = resolveWorkspaceRoot();
      if (!root) return '';
      var rel = options.specRel || 'proto-spec/' + pageId + '.md';
      rel = String(rel).replace(/\\/g, '/').replace(/^\.\//, '');
      return root.replace(/\\/g, '/') + '/' + rel;
    }

    function resolveSpecRelPath() {
      var pageId = options.pageId || (state.meta && state.meta.page && state.meta.page.id);
      if (options.specRel) return String(options.specRel).replace(/\\/g, '/').replace(/^\.\//, '');
      return pageId ? 'proto-spec/' + pageId + '.md' : 'proto-spec/<page-id>.md';
    }

    function toEditorFileUri(scheme, absPath) {
      var p = String(absPath).replace(/\\/g, '/');
      if (!/^[A-Za-z]:\//.test(p) && p.charAt(0) !== '/') p = '/' + p;
      var parts = p.split('/');
      var encoded = parts.map(function (seg, idx) {
        if (idx === 0 && seg === '') return '';
        return encodeURIComponent(seg);
      });
      return scheme + '://file' + encoded.join('/');
    }

    function copyTextToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).catch(function () {
          return legacyCopy(text);
        });
      }
      return Promise.resolve(legacyCopy(text));
    }

    function legacyCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
      document.body.removeChild(ta);
    }

    var WORKSPACE_ROOT_KEY = 'proto-spec.workspaceRoot';
    var EDITOR_KEY = 'proto-spec.editor';
    var EDITORS = [
      { id: 'cursor', label: 'Cursor', scheme: 'cursor' },
      { id: 'trae', label: 'Trae', scheme: 'trae' },
      { id: 'vscode', label: 'VS Code', scheme: 'vscode' },
      { id: 'text', label: '文本编辑器', scheme: '' },
    ];
    var rootPrompt = null;

    function resolveEditorId() {
      var id = loadStorage(EDITOR_KEY, 'cursor');
      var known = false;
      EDITORS.forEach(function (item) {
        if (item.id === id) known = true;
      });
      return known ? id : 'cursor';
    }

    function editorById(id) {
      var found = EDITORS[0];
      EDITORS.forEach(function (item) {
        if (item.id === id) found = item;
      });
      return found;
    }

    function normalizeWorkspaceRootInput(raw) {
      var p = String(raw || '').trim();
      if (
        (p.charAt(0) === '"' && p.charAt(p.length - 1) === '"') ||
        (p.charAt(0) === "'" && p.charAt(p.length - 1) === "'")
      ) {
        p = p.slice(1, -1).trim();
      }
      p = p.replace(/\\/g, '/').replace(/\/+$/, '');
      var note = '';
      if (/\/proto-spec\/[^/]+\.md$/i.test(p)) {
        p = p.replace(/\/proto-spec\/[^/]+\.md$/i, '');
        note = '已去掉文件名和 proto-spec，保存的是上一级文件夹。';
      } else if (/\/proto-spec$/i.test(p)) {
        p = p.replace(/\/proto-spec$/i, '');
        note = '已去掉末尾的 proto-spec，保存的是上一级文件夹。';
      }
      return { path: p, note: note };
    }

    function isAbsolutePath(p) {
      return p.charAt(0) === '/' || /^[A-Za-z]:\//.test(p);
    }

    function closeRootPrompt() {
      if (!rootPrompt) return;
      rootPrompt.mask.classList.remove('is-open');
    }

    function ensureRootPrompt() {
      if (rootPrompt) return rootPrompt;
      var err = el('p', { className: 'ps-root-prompt__error' });
      var hint = el('p', { className: 'ps-root-prompt__hint' });
      var input = el('input', {
        className: 'ps-root-prompt__input',
        type: 'text',
        placeholder: '/Users/你的用户名/…/prototypes/项目名',
        spellcheck: 'false',
        autocomplete: 'off',
      });
      var appNote = el('p', { className: 'ps-root-prompt__hint' });
      var apps = el('div', { className: 'ps-root-prompt__apps', role: 'radiogroup', 'aria-label': '用哪个应用打开' });
      EDITORS.forEach(function (item) {
        var radio = el('input', { type: 'radio', name: 'ps-spec-editor', value: item.id });
        radio.addEventListener('change', function () {
          appNote.textContent = item.id === 'text' ? '网页不能直接打开文本编辑器，将改为复制文件路径。' : '';
        });
        apps.appendChild(el('label', { className: 'ps-root-prompt__app' }, [radio, item.label]));
      });
      var mask = el('div', {
        className: 'ps-root-prompt',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': '打开说明文件',
      });
      var card = el('div', { className: 'ps-root-prompt__card' });
      card.appendChild(el('h3', { className: 'ps-root-prompt__title', text: '打开说明文件' }));
      card.appendChild(el('p', {
        className: 'ps-root-prompt__lead',
        text: '右键 proto-spec 的上一级文件夹，复制路径。同一地址只需填一次。',
      }));
      card.appendChild(el('p', {
        className: 'ps-root-prompt__example',
        text: '示例：/Users/zhangsan/work/prototypes/park-initiation',
      }));
      card.appendChild(el('p', { className: 'ps-root-prompt__label', text: '用哪个应用打开' }));
      card.appendChild(apps);
      card.appendChild(appNote);
      card.appendChild(el('label', { className: 'ps-root-prompt__label', text: '原型包路径' }));
      card.appendChild(input);
      card.appendChild(hint);
      card.appendChild(err);
      card.appendChild(el('div', { className: 'ps-root-prompt__foot' }, [
        el('button', { type: 'button', className: 'ps-icon-btn', text: '取消', onClick: closeRootPrompt }),
        el('button', {
          type: 'button',
          className: 'ps-root-prompt__ok',
          text: '保存并打开',
          onClick: function () {
            var parsed = normalizeWorkspaceRootInput(input.value);
            err.textContent = '';
            hint.textContent = parsed.note || '';
            if (!parsed.path) {
              err.textContent = '请先粘贴路径。';
              input.focus();
              return;
            }
            if (/^https?:\/\//i.test(parsed.path)) {
              err.textContent = '这是网页地址，不是文件夹路径。';
              return;
            }
            if (!isAbsolutePath(parsed.path)) {
              err.textContent = '需要从 / 或盘符开头的完整路径，例如 /Users/…/prototypes/项目名。';
              return;
            }
            var picked = 'cursor';
            Array.prototype.forEach.call(apps.querySelectorAll('input'), function (radio) {
              if (radio.checked) picked = radio.value;
            });
            saveStorage(WORKSPACE_ROOT_KEY, parsed.path);
            saveStorage(EDITOR_KEY, picked);
            closeRootPrompt();
            openLocalSpecFile();
          },
        }),
      ]));
      mask.appendChild(card);
      mask.addEventListener('click', function (e) {
        if (e.target === mask) closeRootPrompt();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeRootPrompt();
        if (e.key === 'Enter') {
          e.preventDefault();
          var ok = mask.querySelector('.ps-root-prompt__ok');
          if (ok) ok.click();
        }
      });
      document.body.appendChild(mask);
      rootPrompt = {
        mask: mask,
        input: input,
        err: err,
        hint: hint,
        apps: apps,
        appNote: appNote,
      };
      return rootPrompt;
    }

    function openRootPrompt() {
      var ui = ensureRootPrompt();
      var current = resolveWorkspaceRoot();
      var editorId = resolveEditorId();
      ui.input.value = current || '';
      ui.err.textContent = '';
      ui.hint.textContent = '';
      ui.appNote.textContent = editorId === 'text' ? '网页不能直接打开文本编辑器，将改为复制文件路径。' : '';
      Array.prototype.forEach.call(ui.apps.querySelectorAll('input'), function (radio) {
        radio.checked = radio.value === editorId;
      });
      ui.mask.classList.add('is-open');
      setTimeout(function () {
        ui.input.focus();
        ui.input.select();
      }, 0);
    }

    function launchEditor(abs) {
      var editor = editorById(resolveEditorId());
      copyTextToClipboard(abs);
      if (!editor.scheme) {
        toast('已复制路径。网页不能直接打开文本编辑器，请用文本编辑器打开该文件。');
        return;
      }
      var uri = toEditorFileUri(editor.scheme, abs);
      try {
        var a = document.createElement('a');
        a.href = uri;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e1) {
        try {
          window.location.href = uri;
        } catch (e2) {}
      }
      toast('已复制路径，正在用 ' + editor.label + ' 打开');
    }

    /** 打开本页 Spec：只唤起已选应用，并复制绝对路径。 */
    function openLocalSpecFile() {
      var abs = resolveSpecFileAbs();
      if (!abs) {
        openRootPrompt();
        return;
      }
      launchEditor(abs);
    }

    function buildLocalEditSplit() {
      var wrap = el('div', { className: 'ps-split' });
      var menu = el('div', { className: 'ps-split__menu', role: 'menu' });
      function closeMenu() {
        wrap.classList.remove('is-open');
        caret.setAttribute('aria-expanded', 'false');
      }
      var main = el('button', {
        type: 'button',
        className: 'ps-icon-btn ps-open-spec-btn',
        title: '用已选应用打开本页说明文件',
        onClick: function () {
          closeMenu();
          openLocalSpecFile();
        },
      });
      main.appendChild(strokeIcon(GLYPH.edit));
      main.appendChild(document.createTextNode('编辑文档'));
      var caret = el('button', {
        type: 'button',
        className: 'ps-split__caret',
        'aria-label': '更多',
        'aria-expanded': 'false',
        'aria-haspopup': 'menu',
      });
      var caretIcon = strokeIcon(GLYPH.chevron);
      caretIcon.classList.add('ps-glyph--chevron');
      caret.appendChild(caretIcon);
      caret.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !wrap.classList.contains('is-open');
        wrap.classList.toggle('is-open', open);
        caret.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.appendChild(
        el('button', {
          type: 'button',
          className: 'ps-split__item',
          role: 'menuitem',
          text: '修改路径',
          onClick: function (e) {
            e.stopPropagation();
            closeMenu();
            openRootPrompt();
          },
        })
      );
      document.addEventListener('click', closeMenu);
      wrap.appendChild(main);
      wrap.appendChild(el('span', { className: 'ps-split__rule', 'aria-hidden': 'true' }));
      wrap.appendChild(caret);
      wrap.appendChild(menu);
      return wrap;
    }

    function paintFullscreenBtn(btn, expanded) {
      var label = expanded ? '退出全屏' : '全屏查看';
      btn.setAttribute('aria-label', label);
      btn.title = label;
      while (btn.firstChild) btn.removeChild(btn.firstChild);
      btn.appendChild(strokeIcon(expanded ? GLYPH.collapse : GLYPH.expand));
    }

    function buildDrawer(idPrefix, titleText, drawerOpts) {
      drawerOpts = drawerOpts || {};
      var drawer = el('div', {
        className: 'ps-drawer',
        id: idPrefix + 'Drawer',
        'data-side': sideOfAnchor(state.anchor),
      });
      drawer.style.width = Math.min(state.width, window.innerWidth * 0.92) + 'px';
      var resizeHandle = el('div', { className: 'ps-drawer__resize' });
      var head = el('div', { className: 'ps-drawer__head' });
      var titleBox = el('div');
      var titleEl = el('h2', { className: 'ps-drawer__title', text: titleText });
      var metaEl = el('p', { className: 'ps-drawer__meta', text: '' });
      titleBox.appendChild(titleEl);
      titleBox.appendChild(metaEl);
      var fsBtn = el('button', {
        type: 'button',
        className: 'ps-icon-btn ps-icon-btn--solo',
        onClick: function () {
          state.fullscreen = !state.fullscreen;
          drawer.classList.toggle('is-fullscreen', state.fullscreen);
          paintFullscreenBtn(this, state.fullscreen);
          if (!state.fullscreen) {
            drawer.style.width = Math.min(state.width, window.innerWidth * 0.92) + 'px';
          }
        },
      });
      paintFullscreenBtn(fsBtn, false);
      var closeBtn = el('button', {
        type: 'button',
        className: 'ps-icon-btn ps-icon-btn--solo',
        title: '关闭',
        'aria-label': '关闭',
        onClick: closeAll,
      });
      closeBtn.appendChild(strokeIcon(GLYPH.close));
      var actionKids = [];
      if (options.prdUrl && drawerOpts.showPrdLink) {
        var prdLink = el('a', {
          className: 'ps-icon-btn ps-prd-link',
          href: options.prdUrl,
          title: 'PRD 汇总',
        });
        prdLink.appendChild(strokeIcon(GLYPH.stack));
        prdLink.appendChild(document.createTextNode('PRD 汇总'));
        actionKids.push(prdLink);
      }
      if (drawerOpts.showOpenSpec) {
        actionKids.push(buildLocalEditSplit());
        actionKids.push(el('span', { className: 'ps-drawer__divider', 'aria-hidden': 'true' }));
      }
      actionKids.push(fsBtn);
      actionKids.push(closeBtn);
      var actions = el('div', { className: 'ps-drawer__actions' }, actionKids);
      head.appendChild(titleBox);
      head.appendChild(actions);
      var tabsEl = el('div', { className: 'ps-tabs' });
      var bodyEl = el('div', {
        className: 'ps-drawer__body' + (drawerOpts.showOpenSpec ? ' ps-drawer__body--spec' : ''),
      });
      var panelEl = el('div', { className: 'ps-panel' });
      var tocEl = null;
      if (drawerOpts.showOpenSpec) {
        tocEl = el('aside', { className: 'ps-spec-toc', 'aria-label': '本页目录' });
        tocEl.appendChild(el('div', { className: 'ps-spec-toc__title', text: '目录' }));
        tocEl.appendChild(el('div', { className: 'ps-spec-toc__list' }));
        var mainEl = el('div', { className: 'ps-drawer__main' });
        mainEl.appendChild(panelEl);
        bodyEl.appendChild(tocEl);
        bodyEl.appendChild(mainEl);
      } else {
        bodyEl.appendChild(panelEl);
      }
      drawer.appendChild(resizeHandle);
      drawer.appendChild(head);
      drawer.appendChild(tabsEl);
      drawer.appendChild(bodyEl);
      document.body.appendChild(drawer);
      bindResize(resizeHandle, drawer);
      return {
        drawer: drawer,
        titleEl: titleEl,
        metaEl: metaEl,
        tabsEl: tabsEl,
        panelEl: panelEl,
        tocEl: tocEl,
        fsBtn: fsBtn,
      };
    }

    function bindResize(resizeHandle, drawer) {
      var resizing = false;
      resizeHandle.addEventListener('pointerdown', function (e) {
        resizing = true;
        resizeHandle.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      resizeHandle.addEventListener('pointermove', function (e) {
        if (!resizing || state.fullscreen) return;
        var side = drawer.dataset.side;
        var w = side === 'right' ? window.innerWidth - e.clientX : e.clientX;
        w = Math.max(640, Math.min(window.innerWidth * 0.92, w));
        state.width = w;
        drawer.style.width = w + 'px';
      });
      resizeHandle.addEventListener('pointerup', function () {
        if (!resizing) return;
        resizing = false;
        saveStorage(STORAGE.width, state.width);
      });
    }

    document.body.appendChild(mask);
    var specUi = buildDrawer('ps', '原型说明', { showOpenSpec: true, showPrdLink: true });
    var logUi = buildDrawer('psChangelog', '更新记录');
    var navUi = buildDrawer('psNav', '导航目录', { showPrdLink: true });
    navUi.tabsEl.style.display = 'none';

    logUi.panelEl.addEventListener('click', function (e) {
      var t = e.target;
      if (state.changelogCalOpen) {
        if (!(t && t.closest && t.closest('.ps-changelog-datewrap'))) {
          closeChangelogCalendar();
        }
      }
      if (t && t.closest && t.closest('.ob-filter-item')) return;
      logUi.panelEl.querySelectorAll('.ob-filter-item.is-open').forEach(function (n) {
        n.classList.remove('is-open');
      });
    });

    function hideDrawer(ui) {
      ui.drawer.classList.remove('is-open', 'is-fullscreen');
      ui.fsBtn.title = '全屏查看';
      paintFullscreenBtn(ui.fsBtn, false);
    }

    function showDrawer(ui) {
      ui.drawer.dataset.side = sideOfAnchor(state.anchor);
      ui.drawer.style.width = Math.min(state.width, window.innerWidth * 0.92) + 'px';
      ui.drawer.classList.add('is-open');
    }

    function closeAll() {
      state.mode = null;
      state.fullscreen = false;
      hideDrawer(specUi);
      hideDrawer(logUi);
      hideDrawer(navUi);
      mask.classList.remove('is-open');
      fabRoot.classList.remove('is-open');
      syncFabReveal();
    }

    function openSpec() {
      if (state.mode === 'changelog') hideDrawer(logUi);
      if (state.mode === 'nav') hideDrawer(navUi);
      state.mode = 'spec';
      state.fullscreen = false;
      fabRoot.classList.add('is-open', 'is-revealed');
      applyFabHide(fabRoot);
      mask.classList.add('is-open');
      showDrawer(specUi);
      ensureMeta().then(function () {
        renderTabs();
        activateTab(state.activeKey || (state.modules[0] && state.modules[0].key));
      });
    }

    function openChangelog() {
      if (state.mode === 'spec') hideDrawer(specUi);
      if (state.mode === 'nav') hideDrawer(navUi);
      state.mode = 'changelog';
      state.fullscreen = false;
      fabRoot.classList.add('is-open', 'is-revealed');
      applyFabHide(fabRoot);
      mask.classList.add('is-open');
      showDrawer(logUi);
      ensureMeta()
        .catch(function () {
          /* 无 meta 时仍可尝试只看全部 */
        })
        .then(function () {
          return ensureChangelog();
        })
        .then(function () {
          renderChangelogChrome();
          renderChangelogPanel();
        })
        .catch(function (err) {
          logUi.panelEl.innerHTML = '';
          logUi.panelEl.appendChild(
            el('div', {
              className: 'ps-error',
              text: String(err && err.message ? err.message : err),
            })
          );
        });
    }

    function openNav() {
      if (state.mode === 'spec') hideDrawer(specUi);
      if (state.mode === 'changelog') hideDrawer(logUi);
      state.mode = 'nav';
      state.fullscreen = false;
      fabRoot.classList.add('is-open', 'is-revealed');
      applyFabHide(fabRoot);
      mask.classList.add('is-open');
      showDrawer(navUi);
      ensureSitemap()
        .then(function () {
          renderNavPanel();
        })
        .catch(function (err) {
          navUi.panelEl.innerHTML = '';
          navUi.panelEl.appendChild(
            el('div', {
              className: 'ps-error',
              text: String(err && err.message ? err.message : err),
            })
          );
        });
    }

    function ensureSitemap() {
      if (state.siteTree) return Promise.resolve(state.siteTree);
      navUi.panelEl.innerHTML = '';
      navUi.panelEl.appendChild(el('div', { className: 'ps-empty', text: '正在加载导航…' }));
      return loadSitemapDoc(options).then(function (doc) {
        state.sitemapDoc = doc;
        state.siteTree = buildSiteTreeFromSitemap(doc, { forNav: true });
        state.navTree = buildNavTreeFromSitemap(doc);
        state.navCollapsed = state.navCollapsed || {};
        state.packageBase = packageBaseFromOptions(options);
        return state.siteTree;
      });
    }

    function renderNavPanel() {
      var doc = state.sitemapDoc || {};
      var q = String(state.navQuery || '')
        .trim()
        .toLowerCase();
      var tree = filterSiteTree(state.siteTree || [], q);
      navUi.titleEl.textContent = '导航目录';
      navUi.metaEl.textContent =
        (doc.docVersion ? '文档 v' + doc.docVersion : '站点地图') +
        (doc.updatedAt ? ' · 更新 ' + doc.updatedAt : '') +
        ' · 树形目录';

      navUi.panelEl.innerHTML = '';
      var toolbar = el('div', { className: 'ps-nav-toolbar' });
      var search = el('input', {
        className: 'ps-changelog-search',
        type: 'search',
        placeholder: '筛选页面 / 分组',
      });
      search.value = state.navQuery || '';
      bindImeSafeInput(search, function (val, inputEl) {
        var start = inputEl.selectionStart;
        var end = inputEl.selectionEnd;
        state.navQuery = val;
        renderNavPanel();
        var again = navUi.panelEl.querySelector('.ps-changelog-search');
        if (again) {
          again.focus();
          try {
            if (typeof start === 'number' && typeof end === 'number') {
              again.setSelectionRange(start, end);
            }
          } catch (e) {}
        }
      });
      toolbar.appendChild(search);
      navUi.panelEl.appendChild(toolbar);

      var wrap = el('div', { className: 'ps-nav-list' });
      var currentId =
        (options.meta && options.meta.page && options.meta.page.id) ||
        (state.meta && state.meta.page && state.meta.page.id) ||
        '';
      if (!tree.length) {
        wrap.appendChild(el('div', { className: 'ps-empty', text: q ? '无匹配页面' : '站点地图暂无页面' }));
      } else {
        renderSiteTreeTable(wrap, tree, {
          mode: 'nav',
          packageBase: state.packageBase,
          currentPageId: currentId,
          collapsedMap: state.navCollapsed || {},
          onCollapseChange: function (map) {
            state.navCollapsed = map;
          },
        });
      }
      navUi.panelEl.appendChild(wrap);
    }

    // backward-compatible aliases
    function openDrawer() {
      openSpec();
    }
    function closeDrawer() {
      closeAll();
    }

    mask.addEventListener('click', closeAll);

    function ensureMeta() {
      if (state.meta) return Promise.resolve(state.meta);
      specUi.panelEl.innerHTML = '';
      specUi.panelEl.appendChild(el('div', { className: 'ps-empty', text: '正在加载规格…' }));
      return loadMeta(options)
        .then(function (meta) {
          state.meta = meta;
          return resolveModules(meta, options).then(function (mods) {
            if (meta.extensions && meta.extensions.length) {
              mods = mods.concat(meta.extensions);
            }
            state.modules = mods;
            var page = meta.page || {};
            specUi.titleEl.textContent = page.name || options.title || '原型说明';
            specUi.metaEl.textContent =
              'ID: ' +
              (page.id || '—') +
              ' · v' +
              (page.version || '—') +
              ' · ' +
              ({ draft: '草稿', reviewing: '待确认', confirmed: '已确认', deprecated: '已废弃' }[page.status] || page.status || '—') +
              (page.updatedAt ? ' · 更新 ' + page.updatedAt : '');
            var unknown = mods.filter(function (m) {
              return !RENDERERS[m.type];
            });
            if (unknown.length) {
              console.warn(
                '[ProtoSpec] 未知 module type:',
                unknown.map(function (m) {
                  return m.type;
                })
              );
            }
            return meta;
          });
        })
        .catch(function (err) {
          if (state.mode === 'spec') {
            specUi.panelEl.innerHTML = '';
            specUi.panelEl.appendChild(
              el('div', {
                className: 'ps-error',
                text:
                  String(err && err.message ? err.message : err) +
                  '\n\n提示：请用静态服务器打开页面（file:// 下 fetch 会失败），或传入 inline 规格。',
              })
            );
          }
          throw err;
        });
    }

    function ensureChangelog() {
      if (state.changelogEntries) return Promise.resolve(state.changelogEntries);
      logUi.panelEl.innerHTML = '';
      logUi.panelEl.appendChild(el('div', { className: 'ps-empty', text: '正在加载更新记录…' }));
      return loadChangelogDoc(options).then(function (doc) {
        state.changelogDoc = doc;
        state.changelogEntries = normalizeChangelogEntries(doc, state.meta);
        return state.changelogEntries;
      });
    }

    function renderChangelogChrome() {
      var page = (state.meta && state.meta.page) || {};
      var pageName = page.name || page.id || '当前页';
      logUi.titleEl.textContent = '更新记录';
      logUi.metaEl.textContent =
        (page.id ? '当前页 ' + pageName + '（' + page.id + '）' : '当前页未知') +
        (state.changelogDoc && state.changelogDoc.updatedAt
          ? ' · 日志更新 ' + state.changelogDoc.updatedAt
          : '');
      logUi.tabsEl.innerHTML = '';
      [
        { key: 'page', label: '本页' },
        { key: 'all', label: '全部' },
      ].forEach(function (tab) {
        logUi.tabsEl.appendChild(
          el('button', {
            type: 'button',
            className: 'ps-tab' + (state.changelogView === tab.key ? ' is-active' : ''),
            text: tab.label,
            'data-key': tab.key,
            onClick: function () {
              state.changelogView = tab.key;
              if (tab.key === 'page') state.changelogModule = null;
              state.changelogCalOpen = false;
              renderChangelogChrome();
              renderChangelogPanel();
            },
          })
        );
      });
    }

    function getChangelogScopeBase() {
      var pageId = state.meta && state.meta.page && state.meta.page.id;
      var base = filterChangelogEntries(state.changelogEntries || [], state.changelogView, pageId);
      if (state.changelogView === 'all' && state.changelogModule) {
        base = applyChangelogFilters(base, { moduleKey: state.changelogModule });
      }
      return base;
    }

    function getChangelogFilteredList() {
      return applyChangelogFilters(getChangelogScopeBase(), {
        date: state.changelogDate,
        query: state.changelogQuery,
      });
    }

    function refreshChangelogListOnly() {
      var listWrap = logUi.panelEl.querySelector('.ps-changelog-list');
      if (!listWrap) {
        renderChangelogPanel();
        return;
      }
      var empty =
        state.changelogView === 'page' ? '本页暂无匹配的更新记录' : '暂无匹配的更新记录';
      var baseEmpty =
        state.changelogView === 'page' ? '本页暂无更新记录' : '项目暂无更新记录';
      var scopeBase = getChangelogScopeBase();
      var list = getChangelogFilteredList();
      var msg =
        !scopeBase.length
          ? baseEmpty
          : !list.length
            ? empty
            : '';
      listWrap.innerHTML = '';
      listWrap.appendChild(renderChangelogList(list, msg || empty));
      syncChangelogFilterHints();
    }

    function syncChangelogFilterHints() {
      var dateBtn = logUi.panelEl.querySelector('[data-ps-changelog-date]');
      if (dateBtn) {
        dateBtn.textContent = state.changelogDate ? state.changelogDate : '筛选日期';
        dateBtn.classList.toggle('is-active', !!state.changelogDate);
      }
      var clearBtn = logUi.panelEl.querySelector('[data-ps-changelog-clear]');
      if (clearBtn) {
        var dirty =
          !!state.changelogQuery ||
          !!state.changelogDate ||
          (state.changelogView === 'all' && !!state.changelogModule);
        clearBtn.hidden = !dirty;
      }
    }

    function closeChangelogCalendar() {
      state.changelogCalOpen = false;
      var pop = logUi.panelEl.querySelector('.ps-cal-pop');
      if (pop) pop.classList.remove('is-open');
    }

    function openOrRefreshCalendar() {
      var pop = logUi.panelEl.querySelector('.ps-cal-pop');
      if (!pop) return;
      if (!state.changelogCalMonth) {
        if (state.changelogDate) {
          var parts = String(state.changelogDate).split('-');
          state.changelogCalMonth = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            1
          );
        } else {
          state.changelogCalMonth = new Date();
        }
      }
      pop.innerHTML = '';
      pop.appendChild(
        buildChangelogCalendar({
          markedDates: collectChangelogDates(getChangelogScopeBase()),
          selectedDate: state.changelogDate,
          cursorMonth: state.changelogCalMonth,
          onMonthChange: function (d) {
            state.changelogCalMonth = d;
            openOrRefreshCalendar();
          },
          onSelectDate: function (ymd) {
            state.changelogDate = ymd;
            closeChangelogCalendar();
            syncChangelogFilterHints();
            refreshChangelogListOnly();
          },
        })
      );
      pop.classList.add('is-open');
      state.changelogCalOpen = true;
    }

    function renderChangelogPanel() {
      var pageId = state.meta && state.meta.page && state.meta.page.id;
      var scopeBase = getChangelogScopeBase();
      var list = getChangelogFilteredList();
      var baseEmpty =
        state.changelogView === 'page' ? '本页暂无更新记录' : '项目暂无更新记录';
      var filterEmpty =
        state.changelogView === 'page' ? '本页暂无匹配的更新记录' : '暂无匹配的更新记录';

      logUi.panelEl.innerHTML = '';
      var toolbar = el('div', { className: 'ps-changelog-toolbar' });

      var search = el('input', {
        className: 'ps-changelog-search',
        type: 'search',
        placeholder: '搜索文本',
        value: state.changelogQuery || '',
      });
      search.value = state.changelogQuery || '';
      search.addEventListener('input', function () {
        state.changelogQuery = search.value || '';
        syncChangelogFilterHints();
        refreshChangelogListOnly();
      });
      toolbar.appendChild(search);

      if (state.changelogView === 'all') {
        var modules = collectChangelogModules(
          filterChangelogEntries(state.changelogEntries || [], 'all', pageId),
          state.changelogDoc,
          state.meta
        );
        var currentMod = modules.filter(function (m) {
          return m.key === state.changelogModule;
        })[0];
        var triggerLabel = currentMod ? currentMod.label : '功能模块';

        var filterItem = el('div', { className: 'ob-filter-item ps-changelog-module' });
        var trigger = el('button', {
          type: 'button',
          className: 'ob-filter-trigger',
        });
        var labelEl = el('span', { 'data-filter-label': '1', text: triggerLabel });
        trigger.appendChild(labelEl);
        trigger.appendChild(
          el('span', { className: 'ob-filter-trigger__caret', 'aria-hidden': 'true' })
        );

        var panel = el('div', { className: 'ob-filter-panel', role: 'listbox' });
        panel.appendChild(el('div', { className: 'ob-filter-panel__title', text: '功能模块' }));
        var listEl = el('div', { className: 'ob-filter-panel__list' });

        function applyModuleFilter(key, label) {
          state.changelogModule = key || null;
          labelEl.textContent = label || '功能模块';
          listEl.querySelectorAll('.ob-filter-panel__item').forEach(function (n) {
            n.classList.toggle('is-active', (n.getAttribute('data-value') || '') === (key || ''));
          });
          var marked = collectChangelogDates(getChangelogScopeBase());
          if (state.changelogDate && !marked[state.changelogDate]) {
            state.changelogDate = null;
          }
          filterItem.classList.remove('is-open');
          closeChangelogCalendar();
          syncChangelogFilterHints();
          refreshChangelogListOnly();
          if (state.changelogCalOpen) openOrRefreshCalendar();
        }

        var allBtn = el('button', {
          type: 'button',
          className: 'ob-filter-panel__item' + (!state.changelogModule ? ' is-active' : ''),
          text: '全部',
          'data-value': '',
          'data-label': '功能模块',
        });
        allBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          applyModuleFilter('', '功能模块');
        });
        listEl.appendChild(allBtn);

        modules.forEach(function (m) {
          var btn = el('button', {
            type: 'button',
            className:
              'ob-filter-panel__item' + (state.changelogModule === m.key ? ' is-active' : ''),
            text: m.label,
            'data-value': m.key,
            'data-label': m.label,
          });
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            applyModuleFilter(m.key, m.label);
          });
          listEl.appendChild(btn);
        });

        panel.appendChild(listEl);
        filterItem.appendChild(trigger);
        filterItem.appendChild(panel);

        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var willOpen = !filterItem.classList.contains('is-open');
          logUi.panelEl.querySelectorAll('.ob-filter-item.is-open').forEach(function (n) {
            if (n !== filterItem) n.classList.remove('is-open');
          });
          filterItem.classList.toggle('is-open', willOpen);
          if (willOpen) closeChangelogCalendar();
        });

        toolbar.appendChild(filterItem);
      }

      var dateWrap = el('div', { className: 'ps-changelog-datewrap' });
      var dateBtn = el('button', {
        type: 'button',
        className: 'ps-changelog-datebtn' + (state.changelogDate ? ' is-active' : ''),
        text: state.changelogDate || '筛选日期',
        'data-ps-changelog-date': '1',
        onClick: function (e) {
          e.stopPropagation();
          if (state.changelogCalOpen) closeChangelogCalendar();
          else openOrRefreshCalendar();
        },
      });
      var calPop = el('div', { className: 'ps-cal-pop' });
      dateWrap.appendChild(dateBtn);
      dateWrap.appendChild(calPop);
      toolbar.appendChild(dateWrap);

      var clearBtn = el('button', {
        type: 'button',
        className: 'ps-changelog-clear',
        text: '重置',
        'data-ps-changelog-clear': '1',
        onClick: function () {
          state.changelogQuery = '';
          state.changelogDate = null;
          state.changelogModule = null;
          closeChangelogCalendar();
          renderChangelogPanel();
        },
      });
      var dirty =
        !!state.changelogQuery ||
        !!state.changelogDate ||
        (state.changelogView === 'all' && !!state.changelogModule);
      clearBtn.hidden = !dirty;
      toolbar.appendChild(clearBtn);

      logUi.panelEl.appendChild(toolbar);

      var listWrap = el('div', { className: 'ps-changelog-list' });
      listWrap.appendChild(
        renderChangelogList(list, !scopeBase.length ? baseEmpty : filterEmpty)
      );
      logUi.panelEl.appendChild(listWrap);
    }

    function renderTabs() {
      specUi.tabsEl.innerHTML = '';
      var mods = state.modules || [];
      if (mods.length <= 1) {
        specUi.tabsEl.classList.add('is-hidden');
        specUi.tabsEl.style.display = 'none';
      } else {
        specUi.tabsEl.classList.remove('is-hidden');
        specUi.tabsEl.style.display = '';
      }
      mods.forEach(function (mod) {
        var btn = el('button', {
          type: 'button',
          className: 'ps-tab' + (state.activeKey === mod.key ? ' is-active' : ''),
          text: mod.label || mod.key,
          'data-key': mod.key,
          onClick: function () {
            activateTab(mod.key);
          },
        });
        specUi.tabsEl.appendChild(btn);
      });
    }

    function activateTab(key) {
      if (!key) return;
      state.activeKey = key;
      Array.prototype.forEach.call(specUi.tabsEl.querySelectorAll('.ps-tab'), function (t) {
        t.classList.toggle('is-active', t.getAttribute('data-key') === key);
      });
      var mod = (state.modules || []).filter(function (m) {
        return m.key === key;
      })[0];
      if (!mod) {
        specUi.panelEl.innerHTML = '';
        specUi.panelEl.appendChild(el('div', { className: 'ps-empty', text: '未找到模块 ' + key }));
        if (specUi.tocEl) fillSpecToc(specUi.tocEl, specUi.panelEl, null);
        return;
      }
      if (!RENDERERS[mod.type]) {
        specUi.panelEl.innerHTML = '';
        specUi.panelEl.appendChild(
          el('div', {
            className: 'ps-error',
            text: '未知模块类型: ' + mod.type + '\n请通过 ProtoSpecRuntime.registerRenderer 扩展。',
          })
        );
        if (specUi.tocEl) fillSpecToc(specUi.tocEl, specUi.panelEl, null);
        return;
      }
      specUi.panelEl.innerHTML = '';
      specUi.panelEl.appendChild(el('div', { className: 'ps-empty', text: '加载中…' }));
      var done = function (raw) {
        state.cache[key] = raw;
        specUi.panelEl.innerHTML = '';
        try {
          var node = RENDERERS[mod.type](raw, mod, state);
          specUi.panelEl.appendChild(node);
          if (specUi.tocEl) {
            var mdRoot = specUi.panelEl.querySelector('.ps-md') || node;
            decorateSpecDocument(mdRoot);
            fillSpecToc(specUi.tocEl, specUi.panelEl, mdRoot);
          }
        } catch (e) {
          specUi.panelEl.appendChild(
            el('div', {
              className: 'ps-error',
              text: '渲染失败：' + (e && e.message ? e.message : e),
            })
          );
          if (specUi.tocEl) fillSpecToc(specUi.tocEl, specUi.panelEl, null);
        }
      };
      if (state.cache[key] != null) {
        done(state.cache[key]);
        return;
      }
      loadModuleSource(state.meta, mod, options)
        .then(done)
        .catch(function (err) {
          specUi.panelEl.innerHTML = '';
          specUi.panelEl.appendChild(
            el('div', {
              className: 'ps-error',
              text: String(err && err.message ? err.message : err),
            })
          );
          if (specUi.tocEl) fillSpecToc(specUi.tocEl, specUi.panelEl, null);
        });
    }

    // click vs drag on FAB
    var drag = { active: false, moved: false, startX: 0, startY: 0 };
    fabMain.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      drag.active = true;
      drag.moved = false;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      state.dragging = false;
      fabMain.setPointerCapture(e.pointerId);
    });
    fabMain.addEventListener('pointermove', function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      if (!drag.moved && dx * dx + dy * dy > 36) {
        drag.moved = true;
        state.dragging = true;
        fabRoot.classList.add('is-dragging', 'is-revealed');
      }
      if (drag.moved) {
        fabRoot.style.left = Math.min(window.innerWidth - 40, Math.max(0, e.clientX - 40)) + 'px';
        fabRoot.style.right = 'auto';
        fabRoot.style.top = Math.min(window.innerHeight - 40, Math.max(0, e.clientY - 20)) + 'px';
        fabRoot.style.bottom = 'auto';
        fabRoot.style.transform = 'none';
      }
    });
    function endDrag(e) {
      if (!drag.active) return;
      drag.active = false;
      fabRoot.classList.remove('is-dragging');
      state.dragging = false;
      if (drag.moved) {
        var anchor = nearestAnchor(e.clientX, e.clientY);
        state.anchor = anchor;
        saveStorage(STORAGE.anchor, anchor);
        placeFab(fabRoot, anchor);
        placeFabEdge(anchor);
        if (state.mode) {
          specUi.drawer.dataset.side = sideOfAnchor(anchor);
          logUi.drawer.dataset.side = sideOfAnchor(anchor);
          navUi.drawer.dataset.side = sideOfAnchor(anchor);
        }
      } else {
        if (state.mode === 'spec') closeAll();
        else openSpec();
      }
    }
    fabMain.addEventListener('pointerup', endDrag);
    fabMain.addEventListener('pointercancel', endDrag);

    return {
      open: openDrawer,
      close: closeDrawer,
      openChangelog: openChangelog,
      openNav: openNav,
      reload: function () {
        state.meta = null;
        state.cache = {};
        state.changelogDoc = null;
        state.changelogEntries = null;
        state.sitemapDoc = null;
        state.navTree = null;
        state.siteTree = null;
        if (state.mode === 'spec') {
          ensureMeta().then(function () {
            renderTabs();
            activateTab(state.activeKey);
          });
        } else if (state.mode === 'changelog') {
          ensureChangelog()
            .then(function () {
              renderChangelogChrome();
              renderChangelogPanel();
            })
            .catch(function (err) {
              logUi.panelEl.innerHTML = '';
              logUi.panelEl.appendChild(
                el('div', {
                  className: 'ps-error',
                  text: String(err && err.message ? err.message : err),
                })
              );
            });
        } else if (state.mode === 'nav') {
          ensureSitemap()
            .then(function () {
              renderNavPanel();
            })
            .catch(function (err) {
              navUi.panelEl.innerHTML = '';
              navUi.panelEl.appendChild(
                el('div', {
                  className: 'ps-error',
                  text: String(err && err.message ? err.message : err),
                })
              );
            });
        }
      },
      getState: function () {
        return {
          open: !!state.mode,
          mode: state.mode,
          anchor: state.anchor,
          width: state.width,
          activeKey: state.activeKey,
          changelogView: state.changelogView,
        };
      },
    };
  }

  function mountPrdHub(options) {
    options = options || {};
    installQuickFind(options);
    var root =
      typeof options.root === 'string' ? document.querySelector(options.root) : options.root;
    if (!root) throw new Error('mountPrdHub: 未找到 root');
    var sitemapUrl = options.sitemapUrl;
    var specRoot = normalizeBase(options.specBase || '../proto-spec/');
    var packagePrdUrl = options.packagePrdUrl || null;
    var globalSearchRoot =
      typeof options.globalSearchRoot === 'string'
        ? document.querySelector(options.globalSearchRoot)
        : options.globalSearchRoot || document.querySelector('#prdGlobalSearch');
    var tocMenuRoot =
      typeof options.tocMenuRoot === 'string'
        ? document.querySelector(options.tocMenuRoot)
        : options.tocMenuRoot || document.querySelector('#prdTocMenu');
    var COMPACT_MQ = '(max-width: 960px)';
    var state = {
      pageQuery: '',
      contentQuery: '',
      contentPanelOpen: false,
      tocMenuOpen: false,
      compact: typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(COMPACT_MQ).matches
        : false,
      sections: [],
      siteTree: [],
      tocCollapsed: {},
      sitemapDoc: null,
      activeId: '',
      packageLabel: '项目概述',
      packageMd: '',
      packageHtml: null,
      _globalDocBound: false,
      _tocDocBound: false,
      _mqBound: false,
    };

    root.innerHTML = '';
    root.appendChild(el('div', { className: 'ps-empty', text: '正在加载 PRD 汇总…' }));

    function inferPackageLabel(mdText) {
      var t = String(mdText || '');
      if (/全局约定|共享规则|通用规则|跨页约定/.test(t)) return '总体说明';
      return '项目概述';
    }

    function findSection(id) {
      for (var i = 0; i < state.sections.length; i++) {
        if (state.sections[i].id === id) return state.sections[i];
      }
      return null;
    }

    function syncHash(id) {
      try {
        var hash = id === 'package' ? '#prd-package' : id ? '#prd-page-' + id : '';
        if (hash && location.hash !== hash && history.replaceState) {
          history.replaceState(null, '', hash);
        }
      } catch (e) {}
    }

    function setActiveId(id, opts) {
      opts = opts || {};
      if (state.activeId === id && !opts.force) {
        if (opts.refreshBody) refreshBodyOnly();
        return;
      }
      state.activeId = id || '';
      syncHash(state.activeId);
      if (opts.rerenderToc !== false) refreshTocOnly();
      refreshBodyOnly();
    }

    function pageNameQuery() {
      return String(state.pageQuery || '')
        .trim()
        .toLowerCase();
    }

    function buildPackageEntry(q) {
      if (!state.packageHtml) return null;
      if (q) {
        var blob = (state.packageLabel + ' package').toLowerCase();
        if (blob.indexOf(q) === -1) return null;
      }
      return { id: 'package', name: state.packageLabel, href: '#prd-package' };
    }

    function refreshTocOnly() {
      var tocTreeWrap =
        root.querySelector('.prd-hub__toc-tree') ||
        (tocMenuRoot && tocMenuRoot.querySelector('.prd-hub__toc-tree'));
      if (!tocTreeWrap) return;
      var q = pageNameQuery();
      var filteredTree = filterSiteTree(state.siteTree || [], q, { nameOnly: true });
      var packageEntry = buildPackageEntry(q);
      renderSiteTreeNav(tocTreeWrap, filteredTree, {
        mode: 'prd',
        currentPageId: state.activeId || (packageEntry ? 'package' : ''),
        collapsedMap: state.tocCollapsed || {},
        packageEntry: packageEntry,
        onCollapseChange: function (map) {
          state.tocCollapsed = map;
        },
        onNavigate: function (id) {
          state.contentPanelOpen = false;
          state.tocMenuOpen = false;
          renderGlobalSearch();
          state.activeId = id === 'package' ? 'package' : id;
          syncHash(state.activeId);
          render();
        },
      });
    }

    function bindCompactMq() {
      if (state._mqBound || typeof window === 'undefined' || !window.matchMedia) return;
      state._mqBound = true;
      var mq = window.matchMedia(COMPACT_MQ);
      function onChange() {
        var next = !!mq.matches;
        if (next === state.compact) return;
        state.compact = next;
        if (!next) state.tocMenuOpen = false;
        render();
      }
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    function buildTocElement() {
      var q = pageNameQuery();
      var toc = el('nav', { className: 'prd-hub__toc', 'aria-label': '目录' });
      var tocHead = el('div', { className: 'prd-hub__toc-head' });
      var pageSearch = el('input', {
        className: 'ob-input prd-hub__page-search',
        type: 'search',
        placeholder: '筛选页面名称…',
        'aria-label': '筛选页面名称',
      });
      pageSearch.value = state.pageQuery || '';
      bindImeSafeInput(pageSearch, function (val, inputEl) {
        var start = inputEl.selectionStart;
        var end = inputEl.selectionEnd;
        state.pageQuery = val;
        if (state.compact) state.tocMenuOpen = true;
        render();
        var again =
          root.querySelector('.prd-hub__page-search') ||
          (tocMenuRoot && tocMenuRoot.querySelector('.prd-hub__page-search'));
        if (again) {
          again.focus();
          try {
            if (typeof start === 'number' && typeof end === 'number') {
              again.setSelectionRange(start, end);
            }
          } catch (e2) {}
        }
      });
      tocHead.appendChild(pageSearch);
      toc.appendChild(tocHead);

      var tocTreeWrap = el('div', { className: 'prd-hub__toc-tree' });
      var filteredTree = filterSiteTree(state.siteTree || [], q, { nameOnly: true });
      var packageEntry = buildPackageEntry(q);
      if (!state.activeId && packageEntry) state.activeId = 'package';
      if (!state.activeId && state.sections.length) state.activeId = state.sections[0].id;
      renderSiteTreeNav(tocTreeWrap, filteredTree, {
        mode: 'prd',
        currentPageId: state.activeId,
        collapsedMap: state.tocCollapsed || {},
        packageEntry: packageEntry,
        onCollapseChange: function (map) {
          state.tocCollapsed = map;
        },
        onNavigate: function (id) {
          state.contentPanelOpen = false;
          state.tocMenuOpen = false;
          renderGlobalSearch();
          state.activeId = id;
          syncHash(state.activeId);
          render();
        },
      });
      toc.appendChild(tocTreeWrap);
      return toc;
    }

    function renderTocMenu(toc) {
      if (!tocMenuRoot) return;
      tocMenuRoot.innerHTML = '';
      tocMenuRoot.className = 'prd-hub__toc-menu';
      var btn = el('button', {
        type: 'button',
        className: 'prd-hub__toc-menu-btn' + (state.tocMenuOpen ? ' is-open' : ''),
        'aria-expanded': state.tocMenuOpen ? 'true' : 'false',
        'aria-haspopup': 'true',
        'aria-controls': 'prdTocMenuPanel',
      });
      btn.appendChild(el('span', { className: 'prd-hub__toc-menu-label', text: '目录' }));
      btn.appendChild(el('span', { className: 'prd-hub__toc-menu-caret', 'aria-hidden': 'true' }));
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        state.tocMenuOpen = !state.tocMenuOpen;
        state.contentPanelOpen = false;
        renderGlobalSearch();
        render();
      });
      var panel = el('div', {
        className: 'prd-hub__toc-menu-panel' + (state.tocMenuOpen ? ' is-open' : ''),
        id: 'prdTocMenuPanel',
        role: 'dialog',
        'aria-label': '页面目录',
      });
      if (state.tocMenuOpen && toc) panel.appendChild(toc);
      tocMenuRoot.appendChild(btn);
      tocMenuRoot.appendChild(panel);
      if (!state._tocDocBound) {
        state._tocDocBound = true;
        document.addEventListener('mousedown', function (e) {
          if (!state.tocMenuOpen || !tocMenuRoot) return;
          if (tocMenuRoot.contains(e.target)) return;
          state.tocMenuOpen = false;
          var p = tocMenuRoot.querySelector('.prd-hub__toc-menu-panel');
          var b = tocMenuRoot.querySelector('.prd-hub__toc-menu-btn');
          if (p) p.classList.remove('is-open');
          if (b) {
            b.classList.remove('is-open');
            b.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    function clearTocMenu() {
      if (!tocMenuRoot) return;
      tocMenuRoot.innerHTML = '';
      tocMenuRoot.className = 'prd-hub__toc-menu';
    }

    function buildActiveSectionEl() {
      var id = state.activeId;
      if (id === 'package' && state.packageHtml) {
        var intro = el('section', {
          className: 'prd-hub__section prd-hub__section--package is-active',
          id: 'prd-package',
        });
        intro.appendChild(el('h2', { text: state.packageLabel }));
        var pkgBody = state.packageHtml.cloneNode
          ? state.packageHtml.cloneNode(true)
          : state.packageHtml;
        intro.appendChild(pkgBody);
        if (state.contentQuery) highlightElement(intro, state.contentQuery);
        return intro;
      }
      var sec = findSection(id);
      if (!sec) {
        return el('div', {
          className: 'ps-empty',
          text: state.sections.length ? '请选择左侧目录中的页面' : '暂无页面 PRD',
        });
      }
      var section = el('section', {
        className: 'prd-hub__section is-active',
        id: 'prd-page-' + sec.id,
      });
      var h = el('div', { className: 'prd-hub__section-head' });
      h.appendChild(el('h2', { text: sec.name || sec.id }));
      var st = prototypeStatusMeta(sec.status);
      var metaLine =
        'ID: ' +
        sec.id +
        (sec.version ? ' · v' + String(sec.version).replace(/^v/i, '') : '') +
        ' · ' +
        st.label +
        (sec.layout ? ' · ' + sec.layout : '');
      h.appendChild(el('p', { className: 'prd-hub__meta', text: metaLine }));
      if (sec.href) {
        h.appendChild(el('a', { className: 'ob-link', href: sec.href, text: '打开原型页' }));
      }
      section.appendChild(h);
      if (sec.businessNode) {
        section.appendChild(
          sec.businessNode.cloneNode ? sec.businessNode.cloneNode(true) : sec.businessNode
        );
      } else {
        section.appendChild(el('div', { className: 'ps-empty', text: '暂无页面说明（<page-id>.md）' }));
      }
      if (state.contentQuery) highlightElement(section, state.contentQuery);
      return section;
    }

    function refreshBodyOnly() {
      var body = root.querySelector('.prd-hub__body');
      if (!body) return;
      body.innerHTML = '';
      body.appendChild(buildActiveSectionEl());
      try {
        body.scrollTop = 0;
        window.scrollTo(0, Math.min(window.scrollY, root.getBoundingClientRect().top + window.scrollY - 8));
      } catch (e) {}
    }

    function collectContentHits(query) {
      var q = String(query || '').trim();
      if (!q) return [];
      var qLower = q.toLowerCase();
      var hits = [];
      if (state.packageMd && state.packageMd.toLowerCase().indexOf(qLower) !== -1) {
        hits.push({
          id: 'package',
          name: state.packageLabel,
          snippetHtml: highlightPlainSnippet(state.packageMd, q),
        });
      }
      state.sections.forEach(function (sec) {
        var blob = [sec.name, sec.id, sec.business || ''].join('\n');
        if (blob.toLowerCase().indexOf(qLower) === -1) return;
        hits.push({
          id: sec.id,
          name: sec.name || sec.id,
          snippetHtml: highlightPlainSnippet(blob, q),
        });
      });
      return hits;
    }

    function renderGlobalSearch() {
      if (!globalSearchRoot) return;
      globalSearchRoot.innerHTML = '';
      globalSearchRoot.className = 'prd-hub__global-search';
      var wrap = el('div', { className: 'prd-hub__global-search-inner' });
      var input = el('input', {
        className: 'ob-input prd-hub__global-input',
        type: 'search',
        placeholder: '检索全文内容…',
        'aria-label': '检索 PRD 全文',
      });
      input.value = state.contentQuery || '';
      bindImeSafeInput(input, function (val, inputEl) {
        var start = inputEl.selectionStart;
        var end = inputEl.selectionEnd;
        state.contentQuery = val;
        state.contentPanelOpen = !!String(val || '').trim();
        renderGlobalSearch();
        refreshBodyOnly();
        var again = globalSearchRoot.querySelector('.prd-hub__global-input');
        if (again) {
          again.focus();
          try {
            if (typeof start === 'number' && typeof end === 'number') {
              again.setSelectionRange(start, end);
            }
          } catch (e) {}
        }
      });
      input.addEventListener('focus', function () {
        if (String(state.contentQuery || '').trim()) {
          state.contentPanelOpen = true;
          renderGlobalSearchPanel(wrap);
        }
      });
      wrap.appendChild(input);
      renderGlobalSearchPanel(wrap);
      globalSearchRoot.appendChild(wrap);
      if (!state._globalDocBound) {
        state._globalDocBound = true;
        document.addEventListener('mousedown', function (e) {
          if (!state.contentPanelOpen || !globalSearchRoot) return;
          if (globalSearchRoot.contains(e.target)) return;
          state.contentPanelOpen = false;
          var panel = globalSearchRoot.querySelector('.prd-hub__global-results');
          if (panel) panel.remove();
        });
      }
    }

    function renderGlobalSearchPanel(wrap) {
      var old = wrap.querySelector('.prd-hub__global-results');
      if (old) old.remove();
      var q = String(state.contentQuery || '').trim();
      if (!state.contentPanelOpen || !q) return;
      var hits = collectContentHits(q);
      var panel = el('div', {
        className: 'prd-hub__global-results',
        role: 'listbox',
        'aria-label': '全文检索结果',
      });
      if (!hits.length) {
        panel.appendChild(el('div', { className: 'prd-hub__global-empty', text: '无匹配内容' }));
      } else {
        hits.forEach(function (hit) {
          var item = el('button', {
            type: 'button',
            className: 'prd-hub__global-hit',
            role: 'option',
          });
          item.appendChild(el('div', { className: 'prd-hub__global-hit-title', text: hit.name }));
          var sn = el('div', { className: 'prd-hub__global-hit-snippet' });
          sn.innerHTML = hit.snippetHtml || '';
          item.appendChild(sn);
          item.addEventListener('click', function () {
            state.contentPanelOpen = false;
            renderGlobalSearch();
            setActiveId(hit.id, { force: true });
          });
          panel.appendChild(item);
        });
      }
      wrap.appendChild(panel);
    }

    function render() {
      bindCompactMq();
      root.innerHTML = '';

      var toc = buildTocElement();
      var body = el('div', { className: 'prd-hub__body' });
      body.appendChild(buildActiveSectionEl());

      var layout = el('div', {
        className: 'prd-hub__layout' + (state.compact ? ' is-compact' : ''),
      });
      if (state.compact) {
        layout.appendChild(body);
        renderTocMenu(state.tocMenuOpen ? toc : null);
      } else {
        clearTocMenu();
        state.tocMenuOpen = false;
        layout.appendChild(toc);
        layout.appendChild(body);
      }
      root.appendChild(layout);
      renderGlobalSearch();
      syncHash(state.activeId);
    }

    function applyHashOnLoad() {
      var hash = String(location.hash || '');
      if (hash === '#prd-package' && state.packageHtml) {
        state.activeId = 'package';
      } else if (hash.indexOf('#prd-page-') === 0) {
        var pid = hash.slice('#prd-page-'.length);
        if (findSection(pid)) state.activeId = pid;
      }
    }

    window.addEventListener('hashchange', function () {
      var before = state.activeId;
      applyHashOnLoad();
      if (state.activeId && state.activeId !== before) setActiveId(state.activeId, { force: true });
    });

    var pkgBase = options.packageBase
      ? normalizeBase(options.packageBase)
      : normalizeBase(new URL('.', sitemapUrl || location.href).href);

    return loadSitemapDoc({
      sitemapUrl: sitemapUrl,
      inline: options.inline,
    })
      .then(function (doc) {
        state.sitemapDoc = doc;
        state.siteTree = buildSiteTreeFromSitemap(doc, { forNav: false });
        var pages = flattenSitemapPages(doc.pages || []).filter(function (p) {
          return !p.hideInPrdPageList && p.status !== 'deprecated';
        });
        var tasks = pages.map(function (p) {
          function pageSection(md) {
            return {
              id: p.id,
              name: p.name,
              version: p.version,
              status: p.status,
              layout: p.layout,
              href: resolvePageHref(p, pkgBase),
              business: md,
              businessNode: md ? renderMarkdown(md) : null,
            };
          }
          var flatUrl = resolveUrl(specRoot, p.id + '.md');
          return fetchText(flatUrl)
            .then(function (raw) {
              return pageSection(parseFrontmatter(raw).body);
            })
            .catch(function () {
              var nestedSpec = resolveUrl(specRoot, p.id + '/spec.md');
              return fetchText(nestedSpec)
                .then(function (raw) {
                  return pageSection(parseFrontmatter(raw).body);
                })
                .catch(function () {
                  var businessUrl = resolveUrl(specRoot, p.id + '/business.md');
                  return fetchText(businessUrl)
                    .then(function (md) {
                      return pageSection(md);
                    })
                    .catch(function () {
                      return pageSection('');
                    });
                });
            });
        });
        var introTask = packagePrdUrl
          ? fetchText(packagePrdUrl)
              .then(function (md) {
                state.packageMd = md || '';
                state.packageLabel = inferPackageLabel(md);
                return renderMarkdown(md);
              })
              .catch(function () {
                state.packageMd = '';
                return null;
              })
          : Promise.resolve(null);
        return Promise.all([introTask, Promise.all(tasks)]).then(function (pair) {
          state.packageHtml = pair[0];
          state.sections = pair[1];
          applyHashOnLoad();
          if (!state.activeId) state.activeId = state.packageHtml ? 'package' : '';
          if (!state.activeId && state.sections.length) state.activeId = state.sections[0].id;
          render();
        });
      })
      .catch(function (err) {
        root.innerHTML = '';
        root.appendChild(
          el('div', {
            className: 'ps-error',
            text: String(err && err.message ? err.message : err),
          })
        );
      });
  }

  var api = {
    mount: function (options) {
      if (api._instance) {
        console.warn('[ProtoSpec] already mounted');
        return api._instance;
      }
      api._instance = createRuntime(options || {});
      return api._instance;
    },
    mountPrdHub: mountPrdHub,
    registerRenderer: registerRenderer,
    parseYaml: parseYaml,
    renderMarkdown: renderMarkdown,
    toast: toast,
  };

  global.ProtoSpecRuntime = api;
})(typeof window !== 'undefined' ? window : globalThis);
