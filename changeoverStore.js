// 接续保存：只负责接续记录的读写与本地持久化，与判定、页面交互分开维护。
window.ChangeoverStore = (() => {
  const storageKey = "zfl17-film-strip-changeovers";

  let records = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify(records));
  }

  function all() {
    return records.slice();
  }

  function find(fromId, toId) {
    return records.find((record) => record.fromId === fromId && record.toId === toId);
  }

  // 同一对接续点重复登记时覆盖旧数值。
  function save(fromId, toId, overlap, signal) {
    const existing = find(fromId, toId);
    if (existing) {
      existing.overlap = overlap;
      existing.signal = signal;
    } else {
      records.push({ id: crypto.randomUUID(), fromId, toId, overlap, signal });
    }
    persist();
  }

  function remove(id) {
    records = records.filter((record) => record.id !== id);
    persist();
  }

  return { all, find, save, remove };
})();
