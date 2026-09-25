// 接续判定：纯逻辑，不碰页面和存储，可单独维护。
window.ChangeoverLogic = (() => {
  const SKIP_DAMAGE = "需跳过";

  function isPlayable(segment) {
    return Boolean(segment) && segment.damage !== SKIP_DAMAGE;
  }

  // 从给定片序里挑出可放映片段，相邻两段组成一个接续点。
  function buildAdjacentPairs(segments) {
    const playable = segments.filter(isPlayable);
    const pairs = [];
    for (let index = 0; index < playable.length - 1; index += 1) {
      pairs.push({ fromId: playable[index].id, toId: playable[index + 1].id });
    }
    return pairs;
  }

  function isAdjacent(segments, fromId, toId) {
    return buildAdjacentPairs(segments).some((pair) => pair.fromId === fromId && pair.toId === toId);
  }

  // 判定一条接续登记是否可保存，不通过时给出原因。
  function validateChangeover(overlap, signal, fromSegment, toSegment) {
    if (!fromSegment || !toSegment) {
      return { ok: false, reason: "接续两端的片段已不存在。" };
    }
    if (!Number.isFinite(overlap) || overlap <= 0) {
      return { ok: false, reason: "重叠秒数要大于 0。" };
    }
    if (!Number.isFinite(signal) || signal < 0) {
      return { ok: false, reason: "信号距片尾秒数不能为负。" };
    }
    const shorter = Math.min(Number(fromSegment.duration) || 0, Number(toSegment.duration) || 0);
    if (overlap > shorter) {
      return { ok: false, reason: `重叠 ${overlap} 秒超过较短片段（${shorter} 秒），不保存。` };
    }
    if (signal < overlap) {
      return { ok: false, reason: `信号距片尾 ${signal} 秒比重叠 ${overlap} 秒更靠近片尾，不保存。` };
    }
    return { ok: true, reason: "" };
  }

  return { isPlayable, buildAdjacentPairs, isAdjacent, validateChangeover };
})();
