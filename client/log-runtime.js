import { dateRange, dayDistance, planTiming } from './log-date-utils.js';
import { filterLogs, filterPeriod, isSearchActive, paginateLogs, sortLogs } from './log-list-utils.js';
import { installLogToolsUi } from './log-tools-ui.js';

export function createLogRuntime(getState, getToday) {
  if (typeof getState !== 'function') throw new TypeError('getState is required');
  installLogToolsUi(getState);
  const todayProvider = typeof getToday === 'function' ? getToday : () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return {
    dateRange() {
      const state = getState();
      return dateRange(state.cursor, state.view);
    },

    dayDistance(item) {
      return dayDistance(item, todayProvider());
    },

    planTiming(item) {
      return planTiming(item, todayProvider());
    },

    buildLogList(actuals, plans) {
      const state = getState();
      const range = dateRange(state.cursor, state.view);
      const searchActive = isSearchActive(state.search);
      let items = [...(actuals || []), ...(plans || [])];
      items = searchActive ? filterLogs(items, state.search) : filterPeriod(items, range);
      items = sortLogs(items, state.logSort);
      const pagination = paginateLogs(items, state.logPage, state.logPageSize);
      return { range, searchActive, items, ...pagination };
    }
  };
}
