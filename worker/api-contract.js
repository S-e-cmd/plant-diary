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
    return {
      ...req,
      action: 'batchPlans',
      kind: req.operation ?? req.kind ?? ''
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
