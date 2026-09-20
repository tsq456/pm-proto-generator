/**
 * ProtoMock — lightweight mock data + CRUD for static PM prototypes.
 *
 * - Seed from inline arrays or JSON (fetch)
 * - Persist mutations in localStorage (cross-page within same origin)
 * - No React / no build; works with http(s) static servers
 *
 * Usage:
 *   await ProtoMock.bootstrap({
 *     namespace: 'my-proto',
 *     entities: {
 *       tenant: { idKey: 'id', seedUrl: '../mock-data/tenants.json' }
 *     }
 *   });
 *   ProtoMock.list('tenant');
 *   ProtoMock.create('tenant', { name: '…' });
 */
(function (global) {
  const STORE = {};
  let NAMESPACE = "default";
  let READY = false;

  function storageKey(entity) {
    return "pm-proto-mock:" + NAMESPACE + ":" + entity;
  }

  function uid(prefix) {
    return (
      (prefix || "id") +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function readPersisted(entity) {
    try {
      const raw = localStorage.getItem(storageKey(entity));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writePersisted(entity, rows) {
    try {
      localStorage.setItem(storageKey(entity), JSON.stringify(rows));
    } catch (e) {
      console.warn("[ProtoMock] persist failed", e);
    }
  }

  function ensure(entity) {
    if (!STORE[entity]) {
      throw new Error("[ProtoMock] unknown entity: " + entity);
    }
    return STORE[entity];
  }

  function emit(entity, action, payload) {
    try {
      global.dispatchEvent(
        new CustomEvent("protomock:change", {
          detail: { entity, action, payload, namespace: NAMESPACE },
        })
      );
    } catch {
      /* ignore */
    }
  }

  async function loadSeed(def) {
    if (Array.isArray(def.seed)) return clone(def.seed);
    if (def.seedUrl) {
      const res = await fetch(def.seedUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("seed fetch failed: " + def.seedUrl);
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || data.rows || [];
    }
    return [];
  }

  const ProtoMock = {
    /** @returns {Promise<typeof ProtoMock>} */
    async bootstrap(options) {
      options = options || {};
      NAMESPACE = options.namespace || "default";
      const entities = options.entities || {};
      const names = Object.keys(entities);
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const def = entities[name] || {};
        const idKey = def.idKey || "id";
        const seed = await loadSeed(def);
        const persisted = options.fresh ? null : readPersisted(name);
        STORE[name] = {
          idKey: idKey,
          seed: clone(seed),
          rows: clone(persisted && Array.isArray(persisted) ? persisted : seed),
        };
        if (!persisted || options.fresh) writePersisted(name, STORE[name].rows);
      }
      READY = true;
      return ProtoMock;
    },

    isReady: function () {
      return READY;
    },

    namespace: function () {
      return NAMESPACE;
    },

    list: function (entity) {
      return clone(ensure(entity).rows);
    },

    get: function (entity, id) {
      const bag = ensure(entity);
      const row = bag.rows.find(function (r) {
        return String(r[bag.idKey]) === String(id);
      });
      return row ? clone(row) : null;
    },

    create: function (entity, record) {
      const bag = ensure(entity);
      const row = clone(record || {});
      if (row[bag.idKey] == null || row[bag.idKey] === "") {
        row[bag.idKey] = uid(entity);
      }
      if (!row.createdAt) row.createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");
      bag.rows.unshift(row);
      writePersisted(entity, bag.rows);
      emit(entity, "create", clone(row));
      return clone(row);
    },

    update: function (entity, id, patch) {
      const bag = ensure(entity);
      const idx = bag.rows.findIndex(function (r) {
        return String(r[bag.idKey]) === String(id);
      });
      if (idx < 0) return null;
      bag.rows[idx] = Object.assign({}, bag.rows[idx], clone(patch || {}));
      bag.rows[idx][bag.idKey] = id;
      writePersisted(entity, bag.rows);
      emit(entity, "update", clone(bag.rows[idx]));
      return clone(bag.rows[idx]);
    },

    remove: function (entity, id) {
      const bag = ensure(entity);
      const before = bag.rows.length;
      bag.rows = bag.rows.filter(function (r) {
        return String(r[bag.idKey]) !== String(id);
      });
      const ok = bag.rows.length < before;
      if (ok) {
        writePersisted(entity, bag.rows);
        emit(entity, "remove", { id: id });
      }
      return ok;
    },

    /** Replace all rows (e.g. after bulk import). */
    replace: function (entity, rows) {
      const bag = ensure(entity);
      bag.rows = clone(rows || []);
      writePersisted(entity, bag.rows);
      emit(entity, "replace", clone(bag.rows));
      return ProtoMock.list(entity);
    },

    /** Restore seed and clear persisted mutations for one entity. */
    reset: function (entity) {
      const bag = ensure(entity);
      bag.rows = clone(bag.seed);
      writePersisted(entity, bag.rows);
      emit(entity, "reset", clone(bag.rows));
      return ProtoMock.list(entity);
    },

    /** Clear all entities in this namespace. */
    resetAll: function () {
      Object.keys(STORE).forEach(function (name) {
        ProtoMock.reset(name);
      });
    },

    queryParam: function (name) {
      try {
        return new URLSearchParams(location.search).get(name);
      } catch {
        return null;
      }
    },

    /** Escape text for safe HTML insertion. */
    escape: function (s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
  };

  global.ProtoMock = ProtoMock;
})(typeof window !== "undefined" ? window : globalThis);
