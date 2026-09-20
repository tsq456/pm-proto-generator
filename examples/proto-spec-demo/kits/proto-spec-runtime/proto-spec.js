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

  function renderMermaidBlock(code) {
    var box = el('div', { className: 'ps-mermaid' });
    var toolbar = el('div', { className: 'ps-mermaid__toolbar' }, [
      el('button', {
        type: 'button',
        className: 'ps-icon-btn',
        text: '查看源码',
        onClick: function () {
          fallback.hidden = !fallback.hidden;
          mount.hidden = !mount.hidden;
        },
      }),
    ]);
    var mount = el('div', { className: 'ps-mermaid__mount' });
    var fallback = el('pre', { className: 'ps-mermaid__fallback', text: code });
    fallback.hidden = true;
    box.appendChild(toolbar);
    box.appendChild(mount);
    box.appendChild(fallback);

    function draw() {
      if (global.mermaid && typeof global.mermaid.render === 'function') {
        var id = 'psm-' + Math.random().toString(36).slice(2);
        global.mermaid
          .render(id, code)
          .then(function (res) {
            mount.innerHTML = res.svg;
          })
          .catch(function (err) {
            mount.innerHTML = '';
            fallback.hidden = false;
            mount.appendChild(
              el('div', {
                className: 'ps-error',
                text: 'Mermaid 渲染失败，已保留源码。\n' + (err && err.message ? err.message : err),
              })
            );
          });
      } else {
        mount.appendChild(
          el('div', {
            className: 'ps-empty',
            text: '未加载 Mermaid，已显示源码。可在页面引入 mermaid.min.js 后刷新。',
          })
        );
        fallback.hidden = false;
      }
    }
    setTimeout(draw, 0);
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

  function filterSiteTree(nodes, q) {
    if (!q) return nodes;
    function matchText(n) {
      var blob = [n.name, n.id, n.path, n.version, n.status, n.level].join(' ').toLowerCase();
      return blob.indexOf(q) !== -1;
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
          nameInner.appendChild(el('span', { className: 'ps-tree-table__icon ps-tree-table__icon--folder', 'aria-hidden': 'true' }));
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
        nameInner.appendChild(el('span', { className: 'ps-tree-table__icon ps-tree-table__icon--page', 'aria-hidden': 'true' }));
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
      var pkgLink = el('a', {
        className:
          'ps-toc-tree__label' + (currentPageId === packageEntry.id ? ' is-current' : ''),
        href: packageEntry.href || '#prd-package',
        text: packageEntry.name || '项目概述',
        title: packageEntry.name || '项目概述',
      });
      pkgLink.addEventListener('click', function (e) {
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

    var fabRoot = el('div', { className: 'ps-fab-root', id: 'psFabRoot' });
    var fabMain = el('button', {
      type: 'button',
      className: 'ps-fab',
      text: options.fabLabel || '原型说明',
      title: '拖动可改位置；点击打开说明',
    });
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
    fabRoot.appendChild(fabMain);
    fabRoot.appendChild(fabChangelog);
    fabRoot.appendChild(fabNav);
    document.body.appendChild(fabRoot);
    placeFab(fabRoot, state.anchor);

    fabRoot.addEventListener('mouseenter', function () {
      fabRoot.classList.add('is-revealed');
      applyFabHide(fabRoot);
    });
    fabRoot.addEventListener('mouseleave', function () {
      if (!state.mode && !state.dragging) {
        fabRoot.classList.remove('is-revealed');
        applyFabHide(fabRoot);
      }
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

    /** 打开本页 Spec：优先 cursor:// / vscode://；并复制绝对路径（浏览器禁 file://）。 */
    function openLocalSpecFile() {
      var abs = resolveSpecFileAbs();
      var rel = resolveSpecRelPath();
      if (!abs) {
        copyTextToClipboard(rel).then(function () {
          toast('未配置 workspaceRoot / specFileAbs；已复制相对路径');
        });
        return;
      }
      copyTextToClipboard(abs);
      var cursorUri = toEditorFileUri('cursor', abs);
      var vscodeUri = toEditorFileUri('vscode', abs);
      var tried = false;
      try {
        var a = document.createElement('a');
        a.href = cursorUri;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        tried = true;
      } catch (e1) {}
      if (!tried) {
        try {
          window.location.href = cursorUri;
          tried = true;
        } catch (e2) {}
      }
      setTimeout(function () {
        try {
          var b = document.createElement('a');
          b.href = vscodeUri;
          b.rel = 'noopener';
          b.style.display = 'none';
          document.body.appendChild(b);
          b.click();
          document.body.removeChild(b);
        } catch (e3) {}
      }, 350);
      toast('已复制绝对路径；若未跳转请在 Cursor 中打开该文件');
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
        className: 'ps-icon-btn',
        text: '全屏查看',
        onClick: function () {
          state.fullscreen = !state.fullscreen;
          drawer.classList.toggle('is-fullscreen', state.fullscreen);
          this.textContent = state.fullscreen ? '退出全屏' : '全屏查看';
          if (!state.fullscreen) {
            drawer.style.width = Math.min(state.width, window.innerWidth * 0.92) + 'px';
          }
        },
      });
      var actionKids = [];
      if (drawerOpts.showOpenSpec) {
        actionKids.push(
          el('button', {
            type: 'button',
            className: 'ps-icon-btn ps-open-spec-btn',
            text: '打开 Spec',
            title: '在 Cursor / VS Code 中打开本页 Spec，并复制绝对路径',
            onClick: openLocalSpecFile,
          })
        );
      }
      actionKids.push(fsBtn);
      actionKids.push(
        el('button', {
          type: 'button',
          className: 'ps-icon-btn',
          text: '关闭',
          onClick: closeAll,
        })
      );
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
    var specUi = buildDrawer('ps', '原型说明', { showOpenSpec: true });
    var logUi = buildDrawer('psChangelog', '更新记录');
    var navUi = buildDrawer('psNav', '导航目录');
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
      ui.fsBtn.textContent = '全屏查看';
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
      applyFabHide(fabRoot);
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
      search.addEventListener('input', function () {
        state.navQuery = search.value || '';
        renderNavPanel();
        var again = navUi.panelEl.querySelector('.ps-changelog-search');
        if (again) {
          again.focus();
          try {
            again.setSelectionRange(again.value.length, again.value.length);
          } catch (e) {}
        }
      });
      toolbar.appendChild(search);

      if (options.prdUrl) {
        var prdLink = el('a', {
          className: 'ob-btn ob-btn--secondary ob-btn--sm',
          href: options.prdUrl,
          text: 'PRD 汇总',
        });
        toolbar.appendChild(prdLink);
      }
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
    var root =
      typeof options.root === 'string' ? document.querySelector(options.root) : options.root;
    if (!root) throw new Error('mountPrdHub: 未找到 root');
    var sitemapUrl = options.sitemapUrl;
    var specRoot = normalizeBase(options.specBase || '../proto-spec/');
    var packagePrdUrl = options.packagePrdUrl || null;
    var state = {
      query: '',
      sections: [],
      siteTree: [],
      tocCollapsed: {},
      sitemapDoc: null,
      activeId: '',
      packageLabel: '项目概述',
      _spyBound: false,
    };

    root.innerHTML = '';
    root.appendChild(el('div', { className: 'ps-empty', text: '正在加载 PRD 汇总…' }));

    function pageBlob(sec) {
      return [sec.name, sec.id, sec.business || '', sec.metaText || ''].join('\n').toLowerCase();
    }

    function countPages(nodes) {
      var n = 0;
      function walk(list) {
        (list || []).forEach(function (node) {
          if (node.type === 'page') {
            n++;
            walk(node.children);
          } else walk(node.children);
        });
      }
      walk(nodes);
      return n;
    }

    function inferPackageLabel(mdText) {
      var t = String(mdText || '');
      if (/全局约定|共享规则|通用规则|跨页约定/.test(t)) return '总体说明';
      return '项目概述';
    }

    function setActiveId(id, opts) {
      opts = opts || {};
      if (state.activeId === id && !opts.force) return;
      state.activeId = id || '';
      if (opts.rerenderToc !== false) {
        refreshTocOnly();
      }
    }

    function refreshTocOnly() {
      var tocTreeWrap = root.querySelector('.prd-hub__toc-tree');
      if (!tocTreeWrap) return;
      var q = String(state.query || '')
        .trim()
        .toLowerCase();
      var filteredTree = filterSiteTree(state.siteTree || [], q);
      var packageEntry =
        state.packageHtml && !q
          ? { id: 'package', name: state.packageLabel, href: '#prd-package' }
          : null;
      renderSiteTreeNav(tocTreeWrap, filteredTree, {
        mode: 'prd',
        currentPageId: state.activeId || (packageEntry ? 'package' : ''),
        collapsedMap: state.tocCollapsed || {},
        packageEntry: packageEntry,
        onCollapseChange: function (map) {
          state.tocCollapsed = map;
        },
        onNavigate: function (id) {
          setActiveId(id === 'package' ? 'package' : id, { rerenderToc: true });
        },
      });
    }

    function bindScrollSpy(bodyEl) {
      if (!bodyEl || typeof IntersectionObserver === 'undefined') return;
      if (state._spyObs) {
        state._spyObs.disconnect();
        state._spyObs = null;
      }
      var sections = bodyEl.querySelectorAll('.prd-hub__section[id]');
      if (!sections.length) return;
      state._spyObs = new IntersectionObserver(
        function (entries) {
          var visible = entries
            .filter(function (en) {
              return en.isIntersecting;
            })
            .sort(function (a, b) {
              return a.boundingClientRect.top - b.boundingClientRect.top;
            });
          if (!visible.length) return;
          var id = visible[0].target.id || '';
          if (id === 'prd-package') setActiveId('package');
          else if (id.indexOf('prd-page-') === 0) setActiveId(id.slice('prd-page-'.length));
        },
        { root: null, rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.1, 0.5] }
      );
      sections.forEach(function (sec) {
        state._spyObs.observe(sec);
      });
    }

    function render() {
      var q = String(state.query || '')
        .trim()
        .toLowerCase();
      root.innerHTML = '';
      var head = el('div', { className: 'prd-hub__toolbar' });
      var search = el('input', {
        className: 'ob-input prd-hub__search',
        type: 'search',
        placeholder: '检索页面名称、ID 或业务说明…',
      });
      search.value = state.query || '';
      search.addEventListener('input', function () {
        state.query = search.value || '';
        render();
        var again = root.querySelector('.prd-hub__search');
        if (again) {
          again.focus();
          try {
            again.setSelectionRange(again.value.length, again.value.length);
          } catch (e2) {}
        }
      });
      head.appendChild(search);
      var count = el('span', { className: 'prd-hub__count' });
      head.appendChild(count);
      root.appendChild(head);

      var toc = el('nav', { className: 'prd-hub__toc', 'aria-label': '目录' });
      toc.appendChild(el('div', { className: 'prd-hub__toc-title', text: '目录' }));
      var tocTreeWrap = el('div', { className: 'prd-hub__toc-tree' });
      var filteredTree = filterSiteTree(state.siteTree || [], q);
      var packageEntry =
        state.packageHtml && !q
          ? { id: 'package', name: state.packageLabel, href: '#prd-package' }
          : null;
      if (!state.activeId && packageEntry) state.activeId = 'package';
      renderSiteTreeNav(tocTreeWrap, filteredTree, {
        mode: 'prd',
        currentPageId: state.activeId,
        collapsedMap: state.tocCollapsed || {},
        packageEntry: packageEntry,
        onCollapseChange: function (map) {
          state.tocCollapsed = map;
        },
        onNavigate: function (id) {
          setActiveId(id, { force: true });
        },
      });
      toc.appendChild(tocTreeWrap);
      var body = el('div', { className: 'prd-hub__body' });

      if (state.packageHtml) {
        var intro = el('section', {
          className: 'prd-hub__section prd-hub__section--package',
          id: 'prd-package',
        });
        intro.appendChild(el('h2', { text: state.packageLabel }));
        intro.appendChild(state.packageHtml);
        body.appendChild(intro);
      }

      var visible = 0;
      state.sections.forEach(function (sec) {
        if (q && pageBlob(sec).indexOf(q) === -1) return;
        visible++;
        var id = 'prd-page-' + sec.id;
        var section = el('section', { className: 'prd-hub__section', id: id });
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
        if (sec.businessNode) section.appendChild(sec.businessNode);
        else section.appendChild(el('div', { className: 'ps-empty', text: '暂无页面说明（<page-id>.md）' }));
        body.appendChild(section);
      });
      count.textContent =
        '显示 ' + visible + ' / ' + state.sections.length + ' 页 · 目录 ' + countPages(filteredTree) + ' 项';
      if (!visible && !state.packageHtml) {
        body.appendChild(el('div', { className: 'ps-empty', text: '无匹配的页面 PRD' }));
      }
      var layout = el('div', { className: 'prd-hub__layout' });
      layout.appendChild(toc);
      layout.appendChild(body);
      root.appendChild(layout);
      bindScrollSpy(body);
    }

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
                state.packageLabel = inferPackageLabel(md);
                return renderMarkdown(md);
              })
              .catch(function () {
                return null;
              })
          : Promise.resolve(null);
        return Promise.all([introTask, Promise.all(tasks)]).then(function (pair) {
          state.packageHtml = pair[0];
          state.sections = pair[1];
          if (!state.activeId) state.activeId = state.packageHtml ? 'package' : '';
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
