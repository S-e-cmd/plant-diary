import { isValidIsoDate } from '../shared/iso-date.js';

export class ApiContractError extends Error {}

const SUPPORTED_ACTIONS = new Set([
  'bootstrap',
  'bootstrapCore',
  'parse',
  'analyze',
  'checkDuplicates',
  'save',
  'update',
  'delete',
  'restore',
  'completePlan',
  'postponePlan',
  'cancelPlan',
  'skipRotation',
  'endRotationSeason',
  'startRotationSeason',
  'calendar',
  'syncPlanCalendar',
  'calendarBulk',
  'syncAllPlansCalendar',
  'bulkPlans',
  'batchPlans',
  'saveAppSettings',
  'getAnalysis',
  'rebuildSummaries'
]);
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

function requireSupportedAction_(req) {
  const action = String(req.action || '').trim();
  if (!SUPPORTED_ACTIONS.has(action)) {
    throw new ApiContractError('未対応の操作です。');
  }
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

function normalizeRotationSeason_(req) {
  if (req.action !== 'endRotationSeason' && req.action !== 'startRotationSeason') return null;
  const rotationName = String(req.rotationName || '').trim();
  if (!rotationName) {
    throw new ApiContractError(`${req.action}にはrotationNameが必要です。`);
  }
  const normalized = { ...req, rotationName };
  if (req.action === 'endRotationSeason') {
    const startMonthDay = String(req.startMonthDay || '06-15').trim();
    if (!/^\d{2}-\d{2}$/.test(startMonthDay)) {
      throw new ApiContractError('再開目安はMM-DD形式で指定してください。');
    }
    const [month, day] = startMonthDay.split('-').map(Number);
    const probe = new Date(Date.UTC(2000, month - 1, day));
    if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
      throw new ApiContractError('再開目安に実在する月日を指定してください。');
    }
    normalized.startMonthDay = startMonthDay;
  }
  return normalized;
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

function normalizeBatchPlans_(req) {
  if (req.action !== 'bulkPlans' && req.action !== 'batchPlans') return null;
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

export function normalizeApiPayload(payload) {
  const req = payload && typeof payload === 'object' && !Array.isArray(payload) ? { ...payload } : {};
  requireSupportedAction_(req);
  requireId_(req);
  requireRecordType_(req);
  requireUpdatePatch_(req);
  requireEntryList_(req);
  requireCompletePlanEntry_(req);
  requireAppSettings_(req);

  const analyze = normalizeAnalyze_(req);
  if (analyze) return analyze;

  const rotationSeason = normalizeRotationSeason_(req);
  if (rotationSeason) return rotationSeason;

  const batchPlans = normalizeBatchPlans_(req);
  if (batchPlans) return batchPlans;

  if (req.action === 'calendar') {
    return { ...req, action: 'syncPlanCalendar' };
  }

  if (req.action === 'calendarBulk') {
    return { action: 'syncAllPlansCalendar' };
  }

  if (req.action === 'postponePlan' && !isValidIsoDate(req.date)) {
    throw new ApiContractError('延期には有効な延期後の日付（YYYY-MM-DD）が必要です。');
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
