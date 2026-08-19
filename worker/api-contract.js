import { isValidIsoDate } from '../shared/iso-date.js';

export class ApiContractError extends Error {}

export function normalizeApiPayload(payload) {
  const req = payload && typeof payload === 'object' ? { ...payload } : {};

  if (req.action === 'parse') {
    return {
      ...req,
      action: 'analyze',
      text: req.rawText ?? req.text ?? '',
      inputType: req.type ?? req.inputType ?? 'actual'
    };
  }

  if (req.action === 'calendar') {
    return { ...req, action: 'syncPlanCalendar' };
  }

  if (req.action === 'calendarBulk') {
    return { action: 'syncAllPlansCalendar' };
  }

  if (req.action === 'bulkPlans') {
    const kind = req.operation ?? req.kind ?? '';
    if (kind === 'postpone' && !isValidIsoDate(req.date)) {
      throw new ApiContractError('一括延期には有効な延期後の日付（YYYY-MM-DD）が必要です。');
    }
    return {
      ...req,
      action: 'batchPlans',
      kind
    };
  }

  return req;
}

export function normalizeApiBody(body) {
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return body;
  }
  return JSON.stringify(normalizeApiPayload(payload));
}
