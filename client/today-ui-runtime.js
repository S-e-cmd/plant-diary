let installed = false;

export function installTodayUiRuntime() {
  if (installed || typeof globalThis.renderActiveTab !== 'function') return false;
  const originalRenderActiveTab = globalThis.renderActiveTab;

  globalThis.renderActiveTab = function renderActiveTabWithOutlookOrder() {
    const active = typeof globalThis.activeTab === 'function' ? globalThis.activeTab() : '';
    if (active !== 'today') return originalRenderActiveTab();
    if (typeof globalThis.renderToday === 'function') globalThis.renderToday();
    if (typeof globalThis.renderOutlook === 'function') globalThis.renderOutlook();
  };

  installed = true;
  return true;
}
