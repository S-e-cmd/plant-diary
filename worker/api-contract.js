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

function isNonEmptyObject_(value) {
  return !!(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length);
}

function isObject_(value) {
  return !!(value && typeof value === 'object' && !Array.isArray(value));
}

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
  if (!isNonEmptyObject_(req.patch)) {
    throw new ApiContractError('updateには空でないpatchオブジェクトが必要です。');
  }
}

function requireEntryList_(req) {
  if (req.action !== 'save' && req.action !== 'checkDuplicates') return;
  if (!Array.isArray(req.entries)) {
    throw new ApiContractError(`${req.action}にはentries配列が必要です。`);
  }
  if (!req.entries.length) {
    throw new ApiContractError(`${req.action}には1件以上のentryが必要です。`);
  }
  for (const entry of req.entries) {
    if (!isNonEmptyObject_(entry)) {
      throw new ApiContractError(`${req.action}の各entryは空でないオブジェクトで指定してください。`);
    }
    if (!RECORD_TYPES.has(String(entry.type || '').trim())) {
      throw new ApiContractError(`${req.action}の各entry.typeはactualまたはplanで指定してください。`);
    }
    if (!String(entry.action || '').trim()) {
      throw new ApiContractError(`${req.action}の各entryには作業内容が必要です。`);
    }
  }
}

function requireCompletePlanEntry_(req) {
  if (req.action !== 'completePlan') return;
  if (!isNonEmptyObject_(req.entry)) {
    throw new ApiContractError('completePlanには空でないentryオブジェクトが必要です。');
  }
}

function normalizeAnalyze_(req) {
  if (req.action !== 'parse' && req.action !== 'analyze') return null;
  const text = String(req.rawText ?? req.text ?? '').trim();
  if (!text) {
    throw new ApiContractError('分析には作業内容が必要です。');
  }
  const inputType = String(req.type ?? req.inputType ?? '').trim();
  if (!RECORD_TYPES.has(inputType)) {
    throw new ApiContractError('分析のtypeはactualまたはplanで指定してください。');
  }
  return {
    ...req,
    action: 'analyze',
    text,
    inputType
  };
}

function requireAppSettings_(req) {
  if (req.action !== 'saveAppSettings') return;
  if (!isObject_(req.settings)) {
    throw new ApiContractError('saveAppSettingsにはsettingsオブジェクトが必要です。');
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
  requireEntryList_(req);
  requireCompletePlanEntry_(req);
  requireAppSettings_(req);

  const analyze = normalizeAnalyze_(req);
  if (analyze) return analyze;

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
