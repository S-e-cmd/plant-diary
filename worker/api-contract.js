export class ApiContractError extends Error {}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate_(date) {
  const value = String(date || '').trim();
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

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
    if (kind === 'postpone' && !isValidIsoDate_(req.date)) {
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
