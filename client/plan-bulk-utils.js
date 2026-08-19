import { ISO_DATE_PATTERN, isValidIsoDate } from '../shared/iso-date.js';

export { ISO_DATE_PATTERN, isValidIsoDate };

export function normalizePlanIds(ids) {
  return [...new Set((Array.isArray(ids) ? ids : []).map(id => String(id || '').trim()).filter(Boolean))];
}

export function buildBulkPlanRequest(operation, ids, date = '') {
  const normalizedIds = normalizePlanIds(ids);
  if (!normalizedIds.length) throw new Error('予定を選択してください');

  const action = String(operation || '').trim();
  if (!['complete', 'postpone', 'cancel'].includes(action)) {
    throw new Error('未対応の一括操作です');
  }

  if (action === 'postpone') {
    const targetDate = String(date || '').trim();
    if (!isValidIsoDate(targetDate)) throw new Error('延期後の日付をYYYY-MM-DD形式で指定してください');
    return { action: 'bulkPlans', ids: normalizedIds, operation: action, date: targetDate };
  }

  return { action: 'bulkPlans', ids: normalizedIds, operation: action };
}
