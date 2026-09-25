"use strict";

// 接续保存模块：只管接续数据的存取与清理，不含任何判定规则和页面逻辑。
const SpliceStore = (() => {
  const storageKey = "zfl17-film-strip-desk-splices";

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!Array.isArray(saved)) return [];
      return saved
        .filter(
          (item) =>
            item &&
            typeof item.fromId === "string" &&
            typeof item.toId === "string"
        )
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
          fromId: item.fromId,
          toId: item.toId,
          overlap: Number(item.overlap) || 0,
          cueDistance: Number(item.cueDistance) || 0
        }));
    } catch {
      return [];
    }
  }

  function save(splices) {
    localStorage.setItem(storageKey, JSON.stringify(splices));
  }

  function add(splices, splice) {
    const next = splices.concat(splice);
    save(next);
    return next;
  }

  function remove(splices, id) {
    const next = splices.filter((item) => item.id !== id);
    save(next);
    return next;
  }

  // 用最新的相邻接续点剔除已失效的接续，并把清理结果落盘。
  function prune(splices, pairs) {
    const next = SpliceJudge.liveSplices(splices, pairs);
    if (next.length !== splices.length) save(next);
    return next;
  }

  return { load, save, add, remove, prune };
})();
