// 接续页面交互：渲染接续表、响应登记与删除；判定交给 ChangeoverLogic，保存交给 ChangeoverStore。
window.ChangeoverUI = (() => {
  const els = {};
  const deps = {
    getViewSegments: () => [],
    getSegment: () => undefined,
    getPosition: () => 0
  };

  function init(options) {
    Object.assign(deps, options);
    els.list = document.querySelector("#changeoverList");
    els.stale = document.querySelector("#changeoverStale");
    els.list.addEventListener("click", onListClick);
    els.stale.addEventListener("click", onStaleClick);
  }

  function render() {
    const pairs = ChangeoverLogic.buildAdjacentPairs(deps.getViewSegments());
    const activeKeys = new Set(pairs.map((pair) => pairKey(pair.fromId, pair.toId)));
    els.list.innerHTML =
      pairs.map(renderPair).join("") || `<p class="empty">当前片序里没有相邻的可放映片段。</p>`;

    const staleRecords = ChangeoverStore.all().filter(
      (record) => !activeKeys.has(pairKey(record.fromId, record.toId))
    );
    els.stale.innerHTML = staleRecords.length
      ? `<h3>已失效接续（拖动、筛选或删段后不再相邻）</h3>${staleRecords.map(renderStale).join("")}`
      : "";
  }

  function renderPair(pair) {
    const from = deps.getSegment(pair.fromId);
    const to = deps.getSegment(pair.toId);
    const record = ChangeoverStore.find(pair.fromId, pair.toId);
    const shorter = Math.min(Number(from.duration) || 0, Number(to.duration) || 0);
    return `
      <div class="changeover-row" data-from="${pair.fromId}" data-to="${pair.toId}">
        <div class="changeover-pair">
          <strong>${deps.getPosition(from.id)}. ${escapeHtml(from.code)}</strong>
          <span class="changeover-arrow">→</span>
          <strong>${deps.getPosition(to.id)}. ${escapeHtml(to.code)}</strong>
          <span class="changeover-meta">较短片段 ${shorter} 秒</span>
          ${record ? `<span class="tag ok">已登记</span>` : ""}
        </div>
        <label>重叠秒数<input type="number" min="1" step="1" data-overlap value="${record ? record.overlap : ""}" /></label>
        <label>信号距片尾<input type="number" min="0" step="1" data-signal value="${record ? record.signal : ""}" /></label>
        <button type="button" data-save>${record ? "更新" : "登记"}</button>
        ${record ? `<button type="button" data-remove="${record.id}">删除</button>` : ""}
        <p class="changeover-msg" data-msg></p>
      </div>
    `;
  }

  function renderStale(record) {
    return `
      <div class="changeover-row stale">
        <div class="changeover-pair">
          <strong>${escapeHtml(codeOf(record.fromId))} → ${escapeHtml(codeOf(record.toId))}</strong>
          <span class="tag damage">已失效</span>
        </div>
        <span class="changeover-meta">重叠 ${record.overlap} 秒｜信号距片尾 ${record.signal} 秒</span>
        <button type="button" data-remove="${record.id}">删除</button>
      </div>
    `;
  }

  function onListClick(event) {
    const saveBtn = event.target.closest("[data-save]");
    const removeBtn = event.target.closest("[data-remove]");
    if (saveBtn) {
      const row = saveBtn.closest(".changeover-row");
      const fromId = row.dataset.from;
      const toId = row.dataset.to;
      const overlap = Number(row.querySelector("[data-overlap]").value);
      const signal = Number(row.querySelector("[data-signal]").value);
      const result = ChangeoverLogic.validateChangeover(
        overlap,
        signal,
        deps.getSegment(fromId),
        deps.getSegment(toId)
      );
      if (!result.ok) {
        row.querySelector("[data-msg]").textContent = result.reason;
        return;
      }
      ChangeoverStore.save(fromId, toId, overlap, signal);
      render();
      return;
    }
    if (removeBtn) {
      ChangeoverStore.remove(removeBtn.dataset.remove);
      render();
    }
  }

  function onStaleClick(event) {
    const removeBtn = event.target.closest("[data-remove]");
    if (removeBtn) {
      ChangeoverStore.remove(removeBtn.dataset.remove);
      render();
    }
  }

  function pairKey(fromId, toId) {
    return `${fromId}->${toId}`;
  }

  function codeOf(id) {
    return deps.getSegment(id)?.code ?? "已删除片段";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { init, render };
})();
