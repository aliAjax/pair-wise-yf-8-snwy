"use strict";

// 接续判定模块：纯函数，只根据片段与接续数据做判断，不碰 DOM 和 localStorage。
const SpliceJudge = (() => {
  // 标注为“需跳过”的片段不能参与双机换片。
  function isProjectable(segment) {
    return Boolean(segment) && segment.damage !== "需跳过";
  }

  // 由一组（已经过筛选、按放映顺序排好的）可放映片段，取出全部相邻接续点。
  function adjacentPairs(segments) {
    const pairs = [];
    for (let i = 0; i + 1 < segments.length; i += 1) {
      const from = segments[i];
      const to = segments[i + 1];
      pairs.push({
        fromId: from.id,
        toId: to.id,
        fromCode: from.code,
        toCode: to.code,
        fromDuration: Number(from.duration) || 0,
        toDuration: Number(to.duration) || 0
      });
    }
    return pairs;
  }

  function pairKey(fromId, toId) {
    return `${fromId}→${toId}`;
  }

  // 校验一条接续登记是否可以保存。
  // 规则：
  // 1. 重叠不能超过较短片段（否则上一段片尾会盖住下一段开场）；
  // 2. 片尾信号距片尾不能比重叠更近（否则看到信号时已来不及换片）。
  function validate({ overlap, cueDistance, fromDuration, toDuration }) {
    const overlapValue = Number(overlap);
    const cueValue = Number(cueDistance);
    const reasons = [];

    if (!Number.isFinite(overlapValue) || overlapValue <= 0) {
      reasons.push("重叠秒数需为大于 0 的数字");
    }
    if (!Number.isFinite(cueValue) || cueValue < 0) {
      reasons.push("信号距片尾秒数需为不小于 0 的数字");
    }

    if (reasons.length === 0) {
      const shorter = Math.min(Number(fromDuration) || 0, Number(toDuration) || 0);
      if (overlapValue > shorter) {
        reasons.push(`重叠 ${overlapValue} 秒超过较短片段时长 ${shorter} 秒`);
      }
      if (cueValue < overlapValue) {
        reasons.push(`信号距片尾 ${cueValue} 秒，比重叠 ${overlapValue} 秒更近`);
      }
    }

    return {
      ok: reasons.length === 0,
      overlap: overlapValue,
      cueDistance: cueValue,
      reasons
    };
  }

  // 依据当前相邻接续点，筛掉已经不再相邻的接续（拖动、筛选、删段后调用）。
  function liveSplices(splices, pairs) {
    const keys = new Set(pairs.map((pair) => pairKey(pair.fromId, pair.toId)));
    return splices.filter((splice) => keys.has(pairKey(splice.fromId, splice.toId)));
  }

  return { isProjectable, adjacentPairs, pairKey, validate, liveSplices };
})();
