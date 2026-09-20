/**
 * Style-review annotator (prototype-only).
 * Click anywhere → pin + note. Export JSON for skill updates.
 */
(function () {
  const KEY = "pm-proto-style-review-notes:" + location.pathname;
  const pins = load();

  const root = document.createElement("div");
  root.id = "sr-annotator";
  root.innerHTML = `
    <style>
      #sr-annotator{position:fixed;inset:0;pointer-events:none;z-index:99990;font:12px/1.4 system-ui,sans-serif}
      #sr-annotator *{box-sizing:border-box}
      .sr-fab{pointer-events:auto;position:fixed;left:16px;bottom:16px;z-index:99999;display:flex;gap:8px;flex-wrap:wrap}
      .sr-fab button{pointer-events:auto;border:1px solid #cdd5e4;background:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;box-shadow:0 4px 12px rgba(19,32,57,.12);font:inherit}
      .sr-fab button.sr-primary{background:#0d6cf2;color:#fff;border-color:#0d6cf2}
      .sr-fab button.is-on{outline:2px solid #0d6cf2;outline-offset:2px}
      .sr-pin{pointer-events:auto;position:absolute;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:#eb4242;color:#fff;display:grid;place-items:center;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(235,66,66,.4)}
      .sr-pin:hover{transform:scale(1.08)}
      .sr-panel{pointer-events:auto;position:fixed;right:16px;bottom:16px;width:min(360px,calc(100vw - 32px));max-height:50vh;overflow:auto;background:#fff;border:1px solid #e2e8f3;border-radius:12px;box-shadow:0 12px 32px rgba(19,32,57,.18);padding:12px;display:none}
      .sr-panel.is-open{display:block}
      .sr-panel h3{margin:0 0 8px;font-size:14px}
      .sr-panel textarea{width:100%;min-height:88px;resize:vertical;border:1px solid #cdd5e4;border-radius:8px;padding:8px;font:inherit}
      .sr-panel .sr-meta{color:#8592ad;margin:6px 0 8px;font-size:11px}
      .sr-panel .sr-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
      .sr-hint{pointer-events:none;position:fixed;left:50%;top:12px;transform:translateX(-50%);background:rgba(19,32,57,.88);color:#fff;padding:8px 14px;border-radius:999px;display:none}
      body.sr-marking{cursor:crosshair}
      body.sr-marking #sr-annotator .sr-hint{display:block}
    </style>
    <div class="sr-hint">点击页面任意位置添加标注 · Esc 退出标注模式</div>
    <div class="sr-fab">
      <button type="button" id="srToggle" class="sr-primary">标注模式</button>
      <button type="button" id="srExport">导出标注 JSON</button>
      <button type="button" id="srClear">清空本页</button>
    </div>
    <div class="sr-panel" id="srPanel">
      <h3>样式问题标注</h3>
      <div class="sr-meta" id="srMeta"></div>
      <textarea id="srNote" placeholder="例如：侧栏品牌区太突兀 / 表格行高过大 / 主色偏亮…"></textarea>
      <div class="sr-actions">
        <button type="button" id="srDelete">删除</button>
        <button type="button" id="srSave" class="sr-primary">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  let marking = false;
  let activeId = null;

  const toggle = root.querySelector("#srToggle");
  const panel = root.querySelector("#srPanel");
  const noteEl = root.querySelector("#srNote");
  const metaEl = root.querySelector("#srMeta");

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(pins));
  }

  function renderPins() {
    root.querySelectorAll(".sr-pin").forEach((n) => n.remove());
    pins.forEach((p, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "sr-pin";
      el.textContent = String(i + 1);
      el.style.left = p.xPct + "%";
      el.style.top = p.yPct + "%";
      el.title = p.note || "(未填写)";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openPin(p.id);
      });
      root.appendChild(el);
    });
  }

  function openPin(id) {
    activeId = id;
    const p = pins.find((x) => x.id === id);
    if (!p) return;
    metaEl.textContent =
      location.pathname +
      " · " +
      Math.round(p.xPct) +
      "%," +
      Math.round(p.yPct) +
      "% · " +
      (p.target || "页面区域");
    noteEl.value = p.note || "";
    panel.classList.add("is-open");
  }

  function addPin(clientX, clientY, targetText) {
    const xPct = (clientX / window.innerWidth) * 100;
    const yPct = ((clientY + window.scrollY) / document.documentElement.scrollHeight) * 100;
    const id = "p" + Date.now();
    pins.push({
      id,
      page: location.pathname,
      pageTitle: document.title,
      xPct,
      yPct,
      target: targetText,
      note: "",
      createdAt: new Date().toISOString(),
    });
    save();
    renderPins();
    openPin(id);
  }

  toggle.addEventListener("click", () => {
    marking = !marking;
    document.body.classList.toggle("sr-marking", marking);
    toggle.classList.toggle("is-on", marking);
    toggle.textContent = marking ? "退出标注" : "标注模式";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && marking) {
      marking = false;
      document.body.classList.remove("sr-marking");
      toggle.classList.remove("is-on");
      toggle.textContent = "标注模式";
    }
  });

  document.addEventListener(
    "click",
    (e) => {
      if (!marking) return;
      if (e.target.closest("#sr-annotator")) return;
      e.preventDefault();
      e.stopPropagation();
      const t = e.target;
      const label =
        (t.getAttribute && (t.getAttribute("aria-label") || t.className)) ||
        t.tagName ||
        "";
      addPin(e.clientX, e.clientY, String(label).slice(0, 80));
    },
    true
  );

  root.querySelector("#srSave").addEventListener("click", () => {
    const p = pins.find((x) => x.id === activeId);
    if (!p) return;
    p.note = noteEl.value.trim();
    save();
    renderPins();
    panel.classList.remove("is-open");
  });

  root.querySelector("#srDelete").addEventListener("click", () => {
    const idx = pins.findIndex((x) => x.id === activeId);
    if (idx >= 0) pins.splice(idx, 1);
    save();
    renderPins();
    panel.classList.remove("is-open");
  });

  root.querySelector("#srClear").addEventListener("click", () => {
    if (!confirm("清空本页全部标注？")) return;
    pins.length = 0;
    save();
    renderPins();
    panel.classList.remove("is-open");
  });

  root.querySelector("#srExport").addEventListener("click", () => {
    const all = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("pm-proto-style-review-notes:")) {
        all[k.replace("pm-proto-style-review-notes:", "")] = JSON.parse(
          localStorage.getItem(k) || "[]"
        );
      }
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "style-review-notes.json";
    a.click();
  });

  renderPins();
})();
