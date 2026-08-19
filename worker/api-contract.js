import { isValidIsoDate } from '../shared/iso-date.js';

export class ApiContractError extends Error {}

const ID_REQUIRED_ACTIONS = new Set([
  'update',
  'delete',
  'restore',
  'postponePlan',
  'cancelPlan',
  'calendar',
  'syncPlanCalendar',
  'completePlan',
  'skipRotation'
]);
const TYPE_REQUIRED_ACTIONS = new Set(['update', 'delete', 'restore']);
const RECORD_TYPES = new Set(['actual', 'plan']);
const BULK_PLAN_OPERATIONS = new Set(['complete', 'postpone', 'cancel']);

function requireId_(req) {
  if (!ID_REQUIRED_ACTIONS.has(req.action)) return;
  if (!String(req.id || '').trim()) {
    throw new ApiContractError(`${req.action}には対象IDが必要です。`);
  }
}

function requireRecordType_(req) {
  if (!TYPE_REQUIRED_ACTIONS.has(req.action)) return;
  if (!RECORD_TYPES.has(String(req.type || '').trim())) {
    throw new ApiContractError(`${req.action}のtypeはactualまたはplanで指定してください。`);
  }
}

function requireUpdatePatch_(req) {
  if (req.action !== 'update') return;
  const patch = req.patch;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || Object.keys(patch).length === 0) {
    throw new ApiContractError('updateには空でないpatchオブジェクトが必要です。');
  }
}

function normalizeBulkPlanIds_(ids) {
  if (!Array.isArray(ids)) {
    throw new ApiContractError('一括操作には対象IDの配列が必要です。');
  }
  const normalized = [...new Set(ids.map(id => String(id ?? '').trim()).filter(Boolean))];
  if (!normalized.length) {
    throw new ApiContractError('一括操作には1件以上の対象IDが必要です。');
  }
  return normalized;
}

export function normalizeApiPayload(payload) {
  const req = payload && typeof payload === 'object' ? { ...payload } : {};
  requireId_(req);
  requireRecordType_(req);
  requireUpdatePatch_(req);

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

  if (req.action === 'postponePlan' && !isValidIsoDate(req.date)) {
    throw new ApiContractError('延期には有効な延期後の日付（YYYY-MM-DD）が必要です。');
  }

  if (req.action === 'bulkPlans') {
    const kind = String(req.operation ?? req.kind ?? '').trim();
    if (!BULK_PLAN_OPERATIONS.has(kind)) {
      throw new ApiContractError('一括操作はcomplete、postpone、cancelのいずれかを指定してください。');
    }
    const ids = normalizeBulkPlanIds_(req.ids);
    if (kind === 'postpone' && !isValidIsoDate(req.date)) {
      throw new ApiContractError('一括延期には有効な延期後の日付（YYYY-MM-DD）が必要です。');
    }
    return {
      ...req,
      ids,
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
