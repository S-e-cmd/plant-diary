// build: 2026-07-18-v12
const APP_SPREADSHEET_ID = '1I_9P60jZlzAPB2uOP-mCv4xMJHB-r-EKnVn3b-r7GN4';
const WEATHER_SPREADSHEET_ID = '1PqArTXtaHZS_n2ueqvDUIrRQtj0el4SYwkCg2vxSb3s';
const WEATHER_SHEET_NAME = 'daily_summary';
const TZ = 'Asia/Tokyo';
let ACTION_ALIAS_MAP_CACHE_ = null;

const SHEETS = {
  actual: '実施入力ログ',
  plan: '予定入力ログ',
  daily: 'デイリーサマリー',
  weekly: 'ウィークサマリー',
  monthly: 'マンスサマリー',
  schedule: 'スケジュール',
  plants: '植物マスター',
  places: '場所マスター',
  categories: '作業分類マスター',
  materials: '資材薬剤マスター',
  actionAliases: '作業名マスター',
  settings: '設定'
};

const ACTUAL_HEADERS = ['ID','実施日','登録日時','対象植物','場所・区画','作業分類','作業内容','数量・範囲','資材','希釈倍率・使用量','状態・観察内容','備考','元入力','元予定ID','更新日時','削除フラグ','散布対象','対象病害虫','ローテーション名','薬剤','液肥'];
const PLAN_HEADERS = ['ID','予定日','時期表示','登録日時','内部順序','対象植物','場所・区画','作業分類','予定内容','数量・範囲','予定資材','希釈倍率・使用量','備考','元入力','状態','完了日時','実施ログID','更新日時','削除フラグ','予定形式','開始日','終了日','ローテーション名','ローテーション順','循環有無','散布対象','対象病害虫','薬剤','液肥','GoogleカレンダーイベントID'];

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (!action) {
    return json_({ ok: true, name: '植物栽培管理日誌 API', version: '1.0.0' });
  }
  return handleRequest_({ action: action, params: e.parameter || {} });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return handleRequest_(body);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function handleRequest_(req) {
  try {
    let result;
    switch (req.action) {
      case 'bootstrap': result = getBootstrap_(); break;
      case 'analyze': result = analyzeInput_(req); break;
      case 'checkDuplicates': result = { count: findDuplicateEntries_(req.entries || []).length }; break;
      case 'save': result = saveEntries_(req.entries || [], req.rawText || '', !!req.allowDuplicates); break;
      case 'update': result = updateEntry_(req); break;
      case 'delete': result = deleteEntry_(req); break;
      case 'restore': result = restoreEntry_(req); break;
      case 'completePlan': result = completePlan_(req); break;
      case 'postponePlan': result = postponePlan_(req); break;
      case 'cancelPlan': result = cancelPlan_(req); break;
      case 'syncPlanCalendar': result = syncPlanCalendar_(req); break;
      case 'syncAllPlansCalendar': result = syncAllPlansCalendar_(); break;
      case 'rebuildSummaries': result = rebuildAllSummaries_(); break;
      default: throw new Error('未対応の操作です: ' + req.action);
    }
    return json_({ ok: true, data: result });
  } catch (err) {
    console.error(err && err.stack || err);
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function getBootstrap_() {
  ensureSchema_();
  ensureSummaryVersion_();
  const actuals = readActuals_();
  const plans = readPlans_();
  return {
    actuals: actuals,
    plans: plans,
    trash: readDeleted_(),
    pinned: buildPinnedSchedule_(plans),
    summaries: getSummaries_(),
    masters: getMasters_(),
    weather: getWeatherForDate_(dateKey_(new Date())),
    today: dateKey_(new Date()),
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + APP_SPREADSHEET_ID + '/edit'
  };
}

function ensureSummaryVersion_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SUMMARY_VERSION') === 'weather-app-v2') return;
  rebuildAllSummaries_();
  props.setProperty('SUMMARY_VERSION', 'weather-app-v2');
}

function getSummaries_() {
  const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
  return {
    daily: readSummarySheet_(ss.getSheetByName(SHEETS.daily), 'daily'),
    weekly: readSummarySheet_(ss.getSheetByName(SHEETS.weekly), 'weekly'),
    monthly: readSummarySheet_(ss.getSheetByName(SHEETS.monthly), 'monthly')
  };
}

function readSummarySheet_(sh, type) {
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  return rows.filter(function(r) { return r[0]; }).map(function(r) {
    if (type === 'daily') return { key:dateKey_(r[0]), actualCount:Number(r[1])||0, planCount:Number(r[2])||0, completedCount:Number(r[3])||0, actions:clean_(r[4]), plants:clean_(r[5]), materials:clean_(r[6]), observations:clean_(r[7]), pending:clean_(r[8]), weather:clean_(r[9]), maxTemp:numOrNull_(r[10]), minTemp:numOrNull_(r[11]), rain:numOrNull_(r[12]) };
    if (type === 'weekly') return { key:dateKey_(r[0]), end:dateKey_(r[1]), actualCount:Number(r[2])||0, completedCount:Number(r[3])||0, pendingCount:Number(r[4])||0, plants:clean_(r[5]), categories:clean_(r[6]), materials:clean_(r[7]), observations:clean_(r[8]), pending:clean_(r[9]), weather:clean_(r[10]), maxTemp:numOrNull_(r[11]), minTemp:numOrNull_(r[12]) };
    return { key:Utilities.formatDate(r[0] instanceof Date?r[0]:new Date(String(r[0])+'-01T12:00:00'),TZ,'yyyy-MM'), actualCount:Number(r[1])||0, completedCount:Number(r[2])||0, plants:clean_(r[3]), categories:clean_(r[4]), places:clean_(r[5]), materials:clean_(r[6]), observations:clean_(r[7]), pending:clean_(r[8]), weather:clean_(r[9]), maxTemp:numOrNull_(r[10]), minTemp:numOrNull_(r[11]) };
  });
}

function analyzeInput_(req) {
  const text = String(req.text || '').trim();
  if (!text) throw new Error('入力内容が空です。');
  const inputType = req.inputType === 'plan' ? 'plan' : 'actual';
  const baseDate = normalizeDate_(req.date) || dateKey_(new Date());
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return analyzeLocally_(text, inputType, baseDate);

  const model = PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || 'gemini-2.5-flash';
  const masters = getMasters_();
  const prompt = [
    '植物栽培管理日誌の入力を構造化してください。',
    '基準日: ' + baseDate,
    '画面で選択された区分: ' + (inputType === 'actual' ? '実施' : '予定'),
    '入力: ' + text,
    '',
    '規則:',
    '- 複数の作業があれば作業単位で分割する。',
    '- 同義語は候補を並べず、標準的な作業名1つに統一する。「除草」「草取り」「草むしり」「雑草取り」「雑草除去」はすべて action=除草 とする。',
    '- 入力が同義語を列挙しただけなら複数件に分割せず、1件だけ返す。例：「除草 草取り 草むしり」は action=除草 の1件。',
    '- 明日、来週、次回など未来の表現は予定にする。過去・当日完了の表現は実施にする。',
    '- 日付を特定できない予定は date を空欄にし、seasonText に「次回」「7月下旬」などを残す。',
    '- 「7/20〜7/31」のような期間は scheduleType を「期間指定」にし、startDate と endDate を設定する。',
    '- 日付に関係ない順番指定は scheduleType を「ローテーション」にし、同じ rotationName と連番の rotationOrder を設定する。',
    '- 散布対象と対象病害虫は分けて抽出する。例：「鉢植えにうどんこ病対策」は sprayTarget=鉢植え、targetPest=うどんこ病。',
    '',
    'Markdown表・作業実施一覧の規則:',
    '- 「予定｜内容｜実施｜備考」の表は、見出し行と区切り行を除き、データ1行につき1件を作る。',
    '- 実施欄が「□」、空欄、未実施なら type=plan。実施欄に日付があれば type=actual とし、date は実施欄の日付を使う。',
    '- 表題に年度または年があれば、その年を省略日付へ補う。2026年度の 2月〜12月は2026年、1月〜3月は文脈上必要なら2027年として扱う。',
    '- 「5/10」のような予定日は日付指定。「5/14〜15」「5/14〜5/20」は期間指定として startDate と endDate を設定する。',
    '- 「2月末」「5月」「7月以降」「開花後随時」「蕾形成期」「石灰1週間後」など確定日でない表現は date を空欄にし、scheduleType=日付未定、seasonTextへ原文を保存する。',
    '- 内容が「ローテ①」「ローテ②」等なら scheduleType=ローテーション、rotationName=薬剤ローテーション、rotationOrder=番号、cyclic=true とする。',
    '- 「薬散①」は単発の散布回数として扱い、明示的にローテと書かれていなければローテーションにしない。',
    '- Markdownの **、□、| は値から除去する。',
    '- 内容欄から作業名、対象植物、資材、薬剤、液肥を分離する。入力にない情報は補わない。',
    '- 資材名を action に埋め込んだままにせず、必ず対応する専用欄にも転記する。複数は「＋」で連結する。',
    '- material は石灰・堆肥・固形肥料・カニガラ・支柱・用土など。pesticide は殺虫剤・殺菌剤など。liquidFertilizer は液肥・活力剤の混用内容。',
    '- 例：「カキ殻石灰散布」なら action=石灰散布、material=カキ殻石灰。',
    '- 例：「春施肥（堆肥・有機・マグァンプ・グリーンダイヤ・カニガラ）」なら action=春施肥、material=堆肥＋有機＋マグァンプ＋グリーンダイヤ＋カニガラ。',
    '- 例：「薬散① トレボン等＋トリフミン」なら action=薬剤散布、pesticide=トレボン等＋トリフミン。',
    '- 例：「液肥① ピータース＋リキダス＋BX＋X」なら action=液肥、liquidFertilizer=ピータース＋リキダス＋BX＋X。',
    '- 消毒の順序が明示されていれば planOrder を「次回」「次々回」「以降」にする。それ以外は「通常」。',
    '- 入力にない数量、薬剤、倍率、状態は推測せず空欄にする。',
    '- 作業分類は候補を優先する: ' + masters.categories.join('、'),
    '- 植物候補: ' + masters.plants.join('、'),
    '- 場所候補: ' + masters.places.join('、')
  ].join('\n');

  const schema = {
    type: 'OBJECT',
    properties: {
      entries: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            type: { type: 'STRING', enum: ['actual','plan'] },
            date: { type: 'STRING' },
            seasonText: { type: 'STRING' },
            planOrder: { type: 'STRING', enum: ['次回','次々回','以降','通常'] },
            plantName: { type: 'STRING' },
            place: { type: 'STRING' },
            category: { type: 'STRING' },
            action: { type: 'STRING' },
            quantity: { type: 'STRING' },
            material: { type: 'STRING' },
            pesticide: { type: 'STRING' },
            liquidFertilizer: { type: 'STRING' },
            dilution: { type: 'STRING' },
            observation: { type: 'STRING' },
            memo: { type: 'STRING' },
            scheduleType: { type: 'STRING', enum: ['日付指定','期間指定','日付未定','ローテーション'] },
            startDate: { type: 'STRING' },
            endDate: { type: 'STRING' },
            rotationName: { type: 'STRING' },
            rotationOrder: { type: 'INTEGER' },
            cyclic: { type: 'BOOLEAN' },
            sprayTarget: { type: 'STRING' },
            targetPest: { type: 'STRING' }
          },
          required: ['type','date','seasonText','planOrder','plantName','place','category','action','quantity','material','pesticide','liquidFertilizer','dilution','observation','memo','scheduleType','startDate','endDate','rotationName','rotationOrder','cyclic','sprayTarget','targetPest']
        }
      }
    },
    required: ['entries']
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.1 }
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  if (res.getResponseCode() < 200 || res.getResponseCode() >= 300) {
    throw new Error('AI整形に失敗しました: ' + res.getContentText().slice(0, 300));
  }
  const data = JSON.parse(res.getContentText());
  const candidate = data.candidates && data.candidates[0];
  const out = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
  if (!out) throw new Error('AIから整形結果が返りませんでした。');
  return normalizeAnalyzed_(JSON.parse(out).entries || [], inputType, baseDate);
}

function analyzeLocally_(text, inputType, baseDate) {
  const chunks = text.split(/[\n。]+/).map(function(v) { return v.trim(); }).filter(Boolean);
  return normalizeAnalyzed_(chunks.map(function(chunk) {
    const future = /明日|明後日|来週|次回|次々回|予定|する予定/.test(chunk);
    let date = baseDate;
    if (/明日/.test(chunk)) date = addDays_(baseDate, 1);
    if (/明後日/.test(chunk)) date = addDays_(baseDate, 2);
    let order = '通常';
    if (/次々回/.test(chunk)) order = '次々回'; else if (/次回/.test(chunk)) order = '次回';
    return { type: future ? 'plan' : inputType, date: date, seasonText: '', planOrder: order, plantName: '', place: '', category: inferCategory_(chunk), action: chunk, quantity: '', material: '', pesticide: '', liquidFertilizer: '', dilution: '', observation: '', memo: '' };
  }), inputType, baseDate, true);
}

function normalizeAnalyzed_(entries, fallbackType, baseDate, localOnly) {
  return entries.map(function(e, i) {
    const supplies = inferSupplyFields_(e);
    return {
      clientId: Utilities.getUuid(),
      type: e.type === 'plan' ? 'plan' : 'actual',
      date: normalizeDate_(e.date) || (e.type === 'plan' && e.seasonText ? '' : baseDate),
      seasonText: clean_(e.seasonText),
      planOrder: ['次回','次々回','以降','通常'].indexOf(e.planOrder) >= 0 ? e.planOrder : '通常',
      plantName: clean_(e.plantName), place: clean_(e.place), category: clean_(e.category) || inferCategory_(e.action),
      action: canonicalAction_(e.action), quantity: clean_(e.quantity), material: supplies.material, pesticide: supplies.pesticide, liquidFertilizer: supplies.liquidFertilizer, dilution: clean_(e.dilution),
      observation: clean_(e.observation), memo: clean_(e.memo),
      scheduleType: validScheduleType_(e.scheduleType, e), startDate: normalizeDate_(e.startDate), endDate: normalizeDate_(e.endDate),
      rotationName: clean_(e.rotationName), rotationOrder: Number(e.rotationOrder) || 0, cyclic: e.cyclic !== false,
      sprayTarget: clean_(e.sprayTarget), targetPest: clean_(e.targetPest), localOnly: !!localOnly
    };
  }).filter(function(e) { return e.action || e.observation || e.memo; }).filter(function(e, i, all) {
    const key = [e.type,e.date,e.seasonText,e.plantName,e.place,e.action].join('|');
    return all.findIndex(function(x) { return [x.type,x.date,x.seasonText,x.plantName,x.place,x.action].join('|') === key; }) === i;
  });
}

function inferSupplyFields_(e) {
  const action = clean_(e.action);
  const category = clean_(e.category);
  const result = {
    material: clean_(e.material),
    pesticide: clean_(e.pesticide),
    liquidFertilizer: clean_(e.liquidFertilizer)
  };
  const groups = [];
  const re = /[（(]([^）)]+)[）)]/g;
  let match;
  while ((match = re.exec(action))) groups.push(match[1]);
  let candidates = groups.join('＋').replace(/[・、,]/g, '＋').replace(/＋+/g, '＋');

  if (!candidates) {
    match = action.match(/(?:液肥|薬散|薬剤散布|消毒|ローテ)[①-⑳0-9]*\s*[:：]?\s+(.+)$/);
    if (match) candidates = clean_(match[1]).replace(/[・、,]/g, '＋').replace(/＋+/g, '＋');
  }
  if (!candidates) {
    match = action.match(/^(.+?)(?:を)?(?:散布|施用)$/);
    if (match && /石灰|堆肥|肥料|カニガラ|用土|支柱/.test(match[1])) candidates = clean_(match[1]);
  }
  if (!candidates) return result;

  const liquid = /液肥|活力剤|ピータース|リキダス|ハイポ|エナジー/.test(action + category);
  const pesticide = /薬散|薬剤散布|消毒|殺菌|殺虫|防除|トレボン|トリフミン|ジアミド|アミスター/.test(action + category);
  if (liquid && !result.liquidFertilizer) result.liquidFertilizer = candidates;
  else if (pesticide && !result.pesticide) result.pesticide = candidates;
  else if (!result.material) result.material = candidates;
  return result;
}

function saveEntries_(entries, rawText, allowDuplicates) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('登録する内容がありません。');
  const duplicates = findDuplicateEntries_(entries);
  if (duplicates.length && !allowDuplicates) throw new Error('同じ日付・作業・対象の記録がすでにあります。');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
    const actualRows = [], planRows = [], saved = [];
    const now = new Date();
    entries.forEach(function(e) {
      const id = Utilities.getUuid();
      if (e.type === 'plan') {
        const row = [id, normalizeDate_(e.date), clean_(e.seasonText), now, validOrder_(e.planOrder), clean_(e.plantName), clean_(e.place), clean_(e.category), clean_(e.action), clean_(e.quantity), clean_(e.material), clean_(e.dilution), clean_(e.memo), rawText, '未完了', '', '', now, false, validScheduleType_(e.scheduleType,e), normalizeDate_(e.startDate), normalizeDate_(e.endDate), clean_(e.rotationName), Number(e.rotationOrder)||0, e.cyclic !== false, clean_(e.sprayTarget), clean_(e.targetPest), clean_(e.pesticide), clean_(e.liquidFertilizer), ''];
        planRows.push(row); saved.push({ id: id, type: 'plan' });
      } else {
        const row = [id, normalizeDate_(e.date) || dateKey_(now), now, clean_(e.plantName), clean_(e.place), clean_(e.category), clean_(e.action), clean_(e.quantity), clean_(e.material), clean_(e.dilution), clean_(e.observation), clean_(e.memo), rawText, clean_(e.sourcePlanId), now, false, clean_(e.sprayTarget), clean_(e.targetPest), clean_(e.rotationName), clean_(e.pesticide), clean_(e.liquidFertilizer)];
        actualRows.push(row); saved.push({ id: id, type: 'actual' });
      }
    });
    appendRows_(ss.getSheetByName(SHEETS.actual), actualRows);
    appendRows_(ss.getSheetByName(SHEETS.plan), planRows);
    rebuildAllSummaries_();
    return { saved: saved, bootstrap: getBootstrap_() };
  } finally {
    lock.releaseLock();
  }
}

function updateEntry_(req) {
  const type = req.type === 'plan' ? 'plan' : 'actual';
  const item = req.entry || {};
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(type === 'plan' ? SHEETS.plan : SHEETS.actual);
  const row = findRowById_(sh, req.id || item.id);
  if (!row) throw new Error('対象の記録が見つかりません。');
  const old = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  const now = new Date();
  if (type === 'plan') {
    const values = [old[0], normalizeDate_(item.date), clean_(item.seasonText), old[3], validOrder_(item.planOrder), clean_(item.plantName), clean_(item.place), clean_(item.category), clean_(item.action), clean_(item.quantity), clean_(item.material), clean_(item.dilution), clean_(item.memo), old[13], item.status || old[14] || '未完了', old[15], old[16], now, false, validScheduleType_(item.scheduleType,item), normalizeDate_(item.startDate), normalizeDate_(item.endDate), clean_(item.rotationName), Number(item.rotationOrder)||0, item.cyclic !== false, clean_(item.sprayTarget), clean_(item.targetPest), clean_(item.pesticide), clean_(item.liquidFertilizer), clean_(old[29])];
    sh.getRange(row, 1, 1, values.length).setValues([values]);
    if (old[29]) {
      removeCalendarEvent_(old[29]);
      sh.getRange(row, 30).setValue('');
      const eventId = hasCalendarDate_(item) ? createCalendarEvent_(item) : '';
      sh.getRange(row, 30).setValue(eventId);
    }
  } else {
    const values = [old[0], normalizeDate_(item.date), old[2], clean_(item.plantName), clean_(item.place), clean_(item.category), clean_(item.action), clean_(item.quantity), clean_(item.material), clean_(item.dilution), clean_(item.observation), clean_(item.memo), old[12], old[13], now, false, clean_(item.sprayTarget), clean_(item.targetPest), clean_(item.rotationName), clean_(item.pesticide), clean_(item.liquidFertilizer)];
    sh.getRange(row, 1, 1, values.length).setValues([values]);
  }
  rebuildAllSummaries_();
  return getBootstrap_();
}

function deleteEntry_(req) {
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(req.type === 'plan' ? SHEETS.plan : SHEETS.actual);
  const row = findRowById_(sh, req.id);
  if (!row) throw new Error('対象の記録が見つかりません。');
  if (req.type === 'plan') removeCalendarEvent_(sh.getRange(row, 30).getValue());
  const deleteCol = req.type === 'plan' ? 19 : 16;
  sh.getRange(row, deleteCol).setValue(true);
  const updateCol = req.type === 'plan' ? 18 : 15;
  sh.getRange(row, updateCol).setValue(new Date());
  rebuildAllSummaries_();
  return getBootstrap_();
}

function restoreEntry_(req) {
  const isPlan = req.type === 'plan';
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(isPlan ? SHEETS.plan : SHEETS.actual);
  const row = findRowById_(sh, req.id);
  if (!row) throw new Error('削除済みの記録が見つかりません。');
  sh.getRange(row, isPlan ? 19 : 16).setValue(false);
  sh.getRange(row, isPlan ? 18 : 15).setValue(new Date());
  rebuildAllSummaries_();
  return getBootstrap_();
}

function findDuplicateEntries_(entries) {
  const actuals = readActuals_(), plans = readPlans_();
  return entries.filter(function(e) {
    const list = e.type === 'plan' ? plans : actuals;
    const key = duplicateKey_(e);
    return list.some(function(x) { return duplicateKey_(x) === key; });
  });
}

function duplicateKey_(e) {
  const date = normalizeDate_(e.date) || normalizeDate_(e.startDate) || clean_(e.seasonText);
  return [e.type === 'plan'?'plan':'actual',date,normalizeTextKey_(canonicalAction_(e.action)),normalizeTextKey_(e.plantName),normalizeTextKey_(e.place)].join('|');
}

function completePlan_(req) {
  const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
  const planSheet = ss.getSheetByName(SHEETS.plan);
  const row = findRowById_(planSheet, req.id);
  if (!row) throw new Error('予定が見つかりません。');
  const p = planSheet.getRange(row, 1, 1, PLAN_HEADERS.length).getValues()[0];
  if (String(p[14]) === '完了') throw new Error('この予定は完了済みです。');
  const actual = req.entry || {};
  const actualId = Utilities.getUuid();
  const now = new Date();
  removeCalendarEvent_(p[29]);
  appendRows_(ss.getSheetByName(SHEETS.actual), [[actualId, normalizeDate_(actual.date) || dateKey_(now), now, clean_(actual.plantName || p[5]), clean_(actual.place || p[6]), clean_(actual.category || p[7]), clean_(actual.action || p[8]), clean_(actual.quantity || p[9]), clean_(actual.material || p[10]), clean_(actual.dilution || p[11]), clean_(actual.observation), clean_(actual.memo || p[12]), '予定から完了登録', p[0], now, false, clean_(actual.sprayTarget || p[25]), clean_(actual.targetPest || p[26]), clean_(actual.rotationName || p[22]), clean_(actual.pesticide || p[27]), clean_(actual.liquidFertilizer || p[28])]]);
  planSheet.getRange(row, 15, 1, 4).setValues([['完了', now, actualId, now]]);
  promoteTreatmentOrders_(planSheet, p);
  rebuildAllSummaries_();
  return getBootstrap_();
}

function postponePlan_(req) {
  const date = normalizeDate_(req.date);
  if (!date) throw new Error('延期先の日付を指定してください。');
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.plan);
  const row = findRowById_(sh, req.id);
  if (!row) throw new Error('予定が見つかりません。');
  const p = sh.getRange(row, 1, 1, PLAN_HEADERS.length).getValues()[0];
  if (p[18] === true || String(p[14]) === '完了' || String(p[14]) === '中止') throw new Error('未完了の予定だけ延期できます。');
  const hadCalendarEvent = !!p[29];
  removeCalendarEvent_(p[29]);
  sh.getRange(row, 2).setValue(date);
  sh.getRange(row, 3).setValue('');
  sh.getRange(row, 15).setValue('延期');
  sh.getRange(row, 18).setValue(new Date());
  sh.getRange(row, 20, 1, 3).setValues([['日付指定','','']]);
  sh.getRange(row, 30).setValue('');
  if (hadCalendarEvent) {
    const updated = sh.getRange(row, 1, 1, PLAN_HEADERS.length).getValues()[0];
    sh.getRange(row, 30).setValue(createCalendarEvent_(planObjectFromRow_(updated)));
  }
  rebuildAllSummaries_();
  return getBootstrap_();
}

function cancelPlan_(req) {
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.plan);
  const row = findRowById_(sh, req.id);
  if (!row) throw new Error('予定が見つかりません。');
  const p = sh.getRange(row, 1, 1, PLAN_HEADERS.length).getValues()[0];
  if (p[18] === true || String(p[14]) === '完了' || String(p[14]) === '中止') throw new Error('未完了の予定だけ見送りにできます。');
  removeCalendarEvent_(p[29]);
  sh.getRange(row, 15).setValue('中止');
  sh.getRange(row, 18).setValue(new Date());
  sh.getRange(row, 30).setValue('');
  rebuildAllSummaries_();
  return getBootstrap_();
}

function syncPlanCalendar_(req) {
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.plan);
  const row = findRowById_(sh, req.id);
  if (!row) throw new Error('予定が見つかりません。');
  const p = sh.getRange(row, 1, 1, PLAN_HEADERS.length).getValues()[0];
  if (p[18] === true || String(p[14]) === '完了' || String(p[14]) === '中止') throw new Error('未完了の予定だけ登録できます。');
  if (p[29]) return getBootstrap_();
  const eventId = createCalendarEvent_(planObjectFromRow_(p));
  sh.getRange(row, 30).setValue(eventId);
  return getBootstrap_();
}

function syncAllPlansCalendar_() {
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.plan);
  if (sh.getLastRow() < 2) return { registered: 0, skipped: 0, bootstrap: getBootstrap_() };
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, PLAN_HEADERS.length).getValues();
  let registered = 0, skipped = 0;
  rows.forEach(function(p, i) {
    const eligible = p[0] && p[18] !== true && String(p[14]) !== '完了' && String(p[14]) !== '中止' && !p[29] && (dateKey_(p[1]) || dateKey_(p[20]));
    if (!eligible) { skipped++; return; }
    const eventId = createCalendarEvent_(planObjectFromRow_(p));
    sh.getRange(i + 2, 30).setValue(eventId);
    registered++;
  });
  return { registered: registered, skipped: skipped, bootstrap: getBootstrap_() };
}

function planObjectFromRow_(p) {
  return { date:dateKey_(p[1]), plantName:clean_(p[5]), place:clean_(p[6]), category:clean_(p[7]), action:clean_(p[8]), quantity:clean_(p[9]), material:clean_(p[10]), dilution:clean_(p[11]), memo:clean_(p[12]), scheduleType:clean_(p[19]), startDate:dateKey_(p[20]), endDate:dateKey_(p[21]), sprayTarget:clean_(p[25]), targetPest:clean_(p[26]), pesticide:clean_(p[27]), liquidFertilizer:clean_(p[28]) };
}

function createCalendarEvent_(p) {
  const startKey = p.scheduleType === '期間指定' ? normalizeDate_(p.startDate) : normalizeDate_(p.date);
  if (!startKey) throw new Error('日付未定の予定はカレンダーへ登録できません。');
  const calendar = CalendarApp.getDefaultCalendar();
  const title = '[植物日誌] ' + clean_(p.action) + (p.plantName ? '（' + clean_(p.plantName) + '）' : '');
  const description = [
    p.category && '分類: ' + p.category,
    p.place && '場所: ' + p.place,
    p.quantity && '数量・範囲: ' + p.quantity,
    p.material && '資材: ' + p.material,
    p.pesticide && '薬剤: ' + p.pesticide,
    p.liquidFertilizer && '液肥: ' + p.liquidFertilizer,
    p.dilution && '倍率・使用量: ' + p.dilution,
    p.sprayTarget && '散布対象: ' + p.sprayTarget,
    p.targetPest && '対象病害虫: ' + p.targetPest,
    p.memo && '備考: ' + p.memo
  ].filter(Boolean).join('\n');
  const start = calendarDate_(startKey);
  let event;
  if (p.scheduleType === '期間指定' && normalizeDate_(p.endDate)) {
    event = calendar.createAllDayEvent(title, start, calendarDate_(addDays_(p.endDate, 1)), { description: description, location: clean_(p.place) });
  } else {
    event = calendar.createAllDayEvent(title, start, { description: description, location: clean_(p.place) });
  }
  return event.getId();
}

function hasCalendarDate_(p) {
  return !!(normalizeDate_(p.date) || (p.scheduleType === '期間指定' && normalizeDate_(p.startDate)));
}

function removeCalendarEvent_(eventId) {
  if (!eventId) return;
  try {
    const event = CalendarApp.getDefaultCalendar().getEventById(String(eventId));
    if (event) event.deleteEvent();
  } catch (err) {
    console.warn('カレンダーイベント削除をスキップ: ' + err);
  }
}

function calendarDate_(s) {
  const p = normalizeDate_(s).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
}

function promoteTreatmentOrders_(sheet, completed) {
  if (completed[4] !== '次回') return;
  const values = sheet.getDataRange().getValues();
  const completedObject = planObjectFromRow_(completed);
  const kind = isSprayPlan_(completedObject) ? 'spray' : isLiquidPlan_(completedObject) ? 'liquid' : '';
  if (!kind) return;
  const rotationName = clean_(completed[22]);
  let promotedAfterNext = false;
  for (let i = 1; i < values.length; i++) {
    if (values[i][18] === true || ['未完了','延期'].indexOf(String(values[i][14])) < 0) continue;
    const item = planObjectFromRow_(values[i]);
    const itemKind = isSprayPlan_(item) ? 'spray' : isLiquidPlan_(item) ? 'liquid' : '';
    if (itemKind !== kind || (rotationName && clean_(values[i][22]) !== rotationName)) continue;
    if (values[i][4] === '次々回') sheet.getRange(i + 1, 5).setValue('次回');
    else if (!promotedAfterNext && values[i][4] === '以降') {
      sheet.getRange(i + 1, 5).setValue('次々回');
      promotedAfterNext = true;
    }
  }
  if (completed[24] !== false && rotationName) {
    const copy = completed.slice();
    copy[0] = Utilities.getUuid(); copy[1] = ''; copy[2] = 'ローテーション継続'; copy[3] = new Date();
    copy[4] = '以降'; copy[14] = '未完了'; copy[15] = ''; copy[16] = ''; copy[17] = new Date(); copy[18] = false; copy[29] = '';
    appendRows_(sheet, [copy]);
  }
}

function readActuals_() {
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.actual);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, ACTUAL_HEADERS.length).getValues().filter(function(r) { return r[0] && r[15] !== true; }).map(function(r) {
    return { type:'actual', id:String(r[0]), date:dateKey_(r[1]), createdAt:iso_(r[2]), plantName:clean_(r[3]), place:clean_(r[4]), category:clean_(r[5]), action:canonicalAction_(r[6]), quantity:clean_(r[7]), material:clean_(r[8]), dilution:clean_(r[9]), observation:clean_(r[10]), memo:clean_(r[11]), sourcePlanId:clean_(r[13]), updatedAt:iso_(r[14]), sprayTarget:clean_(r[16]), targetPest:clean_(r[17]), rotationName:clean_(r[18]), pesticide:clean_(r[19]), liquidFertilizer:clean_(r[20]) };
  }).sort(sortByDateDesc_);
}

function readPlans_() {
  const sh = SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.plan);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, PLAN_HEADERS.length).getValues().filter(function(r) { return r[0] && r[18] !== true; }).map(function(r) {
    return { type:'plan', id:String(r[0]), date:dateKey_(r[1]), seasonText:clean_(r[2]), createdAt:iso_(r[3]), planOrder:validOrder_(r[4]), plantName:clean_(r[5]), place:clean_(r[6]), category:clean_(r[7]), action:canonicalAction_(r[8]), quantity:clean_(r[9]), material:clean_(r[10]), dilution:clean_(r[11]), memo:clean_(r[12]), status:clean_(r[14]) || '未完了', completedAt:iso_(r[15]), actualId:clean_(r[16]), updatedAt:iso_(r[17]), scheduleType:clean_(r[19])||'日付指定', startDate:dateKey_(r[20]), endDate:dateKey_(r[21]), rotationName:clean_(r[22]), rotationOrder:Number(r[23])||0, cyclic:r[24]!==false, sprayTarget:clean_(r[25]), targetPest:clean_(r[26]), pesticide:clean_(r[27]), liquidFertilizer:clean_(r[28]), calendarEventId:clean_(r[29]) };
  }).sort(sortPlan_);
}

function readDeleted_() {
  const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
  const actualSheet = ss.getSheetByName(SHEETS.actual), planSheet = ss.getSheetByName(SHEETS.plan);
  const out = [];
  if (actualSheet.getLastRow() >= 2) {
    actualSheet.getRange(2, 1, actualSheet.getLastRow() - 1, ACTUAL_HEADERS.length).getValues().forEach(function(r) {
      if (r[0] && r[15] === true) out.push({ type:'actual', id:String(r[0]), date:dateKey_(r[1]), plantName:clean_(r[3]), place:clean_(r[4]), category:clean_(r[5]), action:canonicalAction_(r[6]), memo:clean_(r[11]), updatedAt:iso_(r[14]) });
    });
  }
  if (planSheet.getLastRow() >= 2) {
    planSheet.getRange(2, 1, planSheet.getLastRow() - 1, PLAN_HEADERS.length).getValues().forEach(function(r) {
      if (r[0] && r[18] === true) out.push({ type:'plan', id:String(r[0]), date:dateKey_(r[1]), seasonText:clean_(r[2]), plantName:clean_(r[5]), place:clean_(r[6]), category:clean_(r[7]), action:canonicalAction_(r[8]), memo:clean_(r[12]), updatedAt:iso_(r[17]) });
    });
  }
  return out.sort(function(a,b) { return (b.updatedAt||'').localeCompare(a.updatedAt||''); });
}

function buildPinnedSchedule_(plans) {
  const pending = plans.filter(function(p) { return p.status === '未完了' || p.status === '延期'; });
  const sprayPlans = pending.filter(isSprayPlan_).sort(sortPlan_);
  const liquidPlans = pending.filter(isLiquidPlan_).sort(sortPlan_);
  const workPlans = pending.filter(function(p) { return !isSprayPlan_(p) && !isLiquidPlan_(p); }).sort(sortPlan_);
  const sprayNext = sprayPlans.find(function(p) { return p.planOrder === '次回'; }) || sprayPlans[0] || null;
  const sprayAfterNext = sprayPlans.find(function(p) { return p.planOrder === '次々回' && (!sprayNext || p.id !== sprayNext.id); }) || sprayPlans.filter(function(p) { return !sprayNext || p.id !== sprayNext.id; })[0] || null;
  const liquidNext = liquidPlans.find(function(p) { return p.planOrder === '次回'; }) || liquidPlans[0] || null;
  const liquidAfterNext = liquidPlans.find(function(p) { return p.planOrder === '次々回' && (!liquidNext || p.id !== liquidNext.id); }) || liquidPlans.filter(function(p) { return !liquidNext || p.id !== liquidNext.id; })[0] || null;
  return {
    sprayNext: sprayNext,
    sprayAfterNext: sprayAfterNext,
    liquidNext: liquidNext,
    liquidAfterNext: liquidAfterNext,
    workItems: workPlans.slice(0, 4),
    overdueCount: pending.filter(function(p) { return p.date && p.date < dateKey_(new Date()); }).length
  };
}

function isSprayPlan_(p) {
  return /薬剤散布|病害虫防除/.test(p.category || '') || /消毒|薬散|殺菌|殺虫/.test(p.action || '') || !!p.pesticide || !!p.targetPest;
}

function isLiquidPlan_(p) {
  return /液肥/.test(p.category || '') || /液肥/.test(p.action || '') || !!p.liquidFertilizer;
}

function getMasters_() {
  const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
  return {
    plants: readMaster_(ss.getSheetByName(SHEETS.plants), 1),
    places: readMaster_(ss.getSheetByName(SHEETS.places), 1),
    categories: readMaster_(ss.getSheetByName(SHEETS.categories), 1),
    materials: readMaster_(ss.getSheetByName(SHEETS.materials), 1)
  };
}

function readMaster_(sh, nameIndex) {
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, Math.max(nameIndex + 1, 2)).getValues().filter(function(r) { return r[0] === true || String(r[0]).toUpperCase() === 'TRUE'; }).map(function(r) { return clean_(r[nameIndex]); }).filter(Boolean);
}

function getWeatherForDate_(date) {
  if (!date) return null;
  try {
    const sh = SpreadsheetApp.openById(WEATHER_SPREADSHEET_ID).getSheetByName(WEATHER_SHEET_NAME);
    if (!sh || sh.getLastRow() < 4) return null;
    const data = sh.getRange(4, 1, sh.getLastRow() - 3, 12).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (dateKey_(data[i][0]) === date) {
        return { date:date, location:clean_(data[i][1]), am:normalizeWeatherText_(data[i][2]), pm:normalizeWeatherText_(data[i][3]), maxTemp:numOrNull_(data[i][4]), minTemp:numOrNull_(data[i][6]), avgTemp:numOrNull_(data[i][8]), maxWind:numOrNull_(data[i][9]), rain:numOrNull_(data[i][10]), wbgt:numOrNull_(data[i][11]) };
      }
    }
  } catch (err) { console.warn('天気参照失敗: ' + err); }
  return null;
}

function readWeatherMap_() {
  const map = {};
  try {
    const sh = SpreadsheetApp.openById(WEATHER_SPREADSHEET_ID).getSheetByName(WEATHER_SHEET_NAME);
    if (!sh || sh.getLastRow() < 4) return map;
    sh.getRange(4, 1, sh.getLastRow() - 3, 12).getValues().forEach(function(r) {
      const d = dateKey_(r[0]);
      if (d) map[d] = { date:d, am:normalizeWeatherText_(r[2]), pm:normalizeWeatherText_(r[3]), maxTemp:numOrNull_(r[4]), minTemp:numOrNull_(r[6]), rain:numOrNull_(r[10]) };
    });
  } catch (err) { console.warn('天気一覧参照失敗: ' + err); }
  return map;
}

function summarizeWeather_(weather, start, end) {
  const rows = Object.keys(weather).filter(function(d) { return d >= start && d <= end; }).map(function(d) { return weather[d]; });
  const counts = {};
  rows.forEach(function(w) { unique_([w.am,w.pm].filter(Boolean)).forEach(function(v) { counts[v] = (counts[v] || 0) + 1; }); });
  const labels = Object.keys(counts).sort(function(a,b) { return counts[b] - counts[a]; });
  const highs = rows.map(function(w) { return w.maxTemp; }).filter(function(v) { return v !== null; });
  const lows = rows.map(function(w) { return w.minTemp; }).filter(function(v) { return v !== null; });
  let weatherText = '';
  if (labels.length === 1) weatherText = labels[0];
  else if (labels.length === 2) weatherText = labels[0] + '中心、時々' + labels[1];
  else if (labels.length > 2) weatherText = labels[0] + '中心、' + labels.slice(1).join('・') + 'もあり';
  return { weather:weatherText, maxTemp:highs.length?Math.max.apply(null,highs):'', minTemp:lows.length?Math.min.apply(null,lows):'' };
}

function normalizeWeatherText_(v) {
  const s = clean_(v);
  if (!s) return '';
  if (/雷/.test(s)) return '雷雨';
  if (/豪雨|大雨|激しい雨|強い雨/.test(s)) return '強い雨';
  if (/雨|小雨|適度な雨|にわか雨/.test(s)) return '雨';
  if (/雪|みぞれ/.test(s)) return '雪';
  if (/霧|もや/.test(s)) return '霧';
  if (/厚い雲|曇りがち|曇天|くもり|曇り|^雲$/.test(s)) return '曇り';
  if (/快晴|晴天|晴れ/.test(s)) return '晴れ';
  return s;
}

function formatDailyWeather_(w) {
  if (!w) return '';
  const am = normalizeWeatherText_(w.am), pm = normalizeWeatherText_(w.pm);
  if (am && pm && am !== pm) return am + '→' + pm;
  return am || pm;
}

function monthEnd_(month) {
  const p = month.split('-').map(Number);
  return Utilities.formatDate(new Date(p[0], p[1], 0, 12), TZ, 'yyyy-MM-dd');
}

function rebuildAllSummaries_() {
  const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
  const actuals = readActuals_();
  const plans = readPlans_();
  const weather = readWeatherMap_();
  rebuildDaily_(ss.getSheetByName(SHEETS.daily), actuals, plans, weather);
  rebuildWeekly_(ss.getSheetByName(SHEETS.weekly), actuals, plans, weather);
  rebuildMonthly_(ss.getSheetByName(SHEETS.monthly), actuals, plans, weather);
  rebuildSchedule_(ss.getSheetByName(SHEETS.schedule), plans);
  return { actualCount: actuals.length, planCount: plans.length };
}

function rebuildDaily_(sh, actuals, plans, weather) {
  clearBody_(sh);
  const dates = unique_(actuals.map(function(x){return x.date;}).concat(plans.map(function(x){return x.date;})).filter(Boolean)).sort().reverse();
  const rows = dates.map(function(d) {
    const a = actuals.filter(function(x){return x.date===d;});
    const p = plans.filter(function(x){return x.date===d;});
    const w = weather[d] || null;
    return [d,a.length,p.length,p.filter(function(x){return x.status==='完了';}).length,joinUnique_(a,'action'),joinUnique_(a,'plantName'),joinUnique_(a,'material'),joinUnique_(a,'observation'),p.filter(function(x){return x.status!=='完了';}).map(function(x){return x.action;}).join('／'),formatDailyWeather_(w),w&&w.maxTemp,w&&w.minTemp,w&&w.rain,'','',new Date()];
  });
  appendRows_(sh, rows);
}

function rebuildWeekly_(sh, actuals, plans, weather) {
  clearBody_(sh);
  const groups = {};
  actuals.forEach(function(x){ const k=weekStart_(x.date); (groups[k]||(groups[k]={a:[],p:[]})).a.push(x); });
  plans.forEach(function(x){ if(!x.date)return; const k=weekStart_(x.date); (groups[k]||(groups[k]={a:[],p:[]})).p.push(x); });
  const rows = Object.keys(groups).sort().reverse().map(function(k){ const g=groups[k],w=summarizeWeather_(weather,k,addDays_(k,6)); return [k,addDays_(k,6),g.a.length,g.p.filter(function(x){return x.status==='完了';}).length,g.p.filter(function(x){return x.status!=='完了';}).length,groupText_(g.a,'plantName'),groupText_(g.a,'category'),joinUnique_(g.a,'material'),joinUnique_(g.a,'observation'),g.p.filter(function(x){return x.status!=='完了';}).map(function(x){return x.action;}).join('／'),w.weather,w.maxTemp,w.minTemp,new Date()]; });
  appendRows_(sh, rows);
}

function rebuildMonthly_(sh, actuals, plans, weather) {
  clearBody_(sh);
  const groups = {};
  actuals.forEach(function(x){ const k=x.date.slice(0,7); (groups[k]||(groups[k]={a:[],p:[]})).a.push(x); });
  plans.forEach(function(x){ const k=(x.date||dateKey_(new Date())).slice(0,7); (groups[k]||(groups[k]={a:[],p:[]})).p.push(x); });
  const rows = Object.keys(groups).sort().reverse().map(function(k){ const g=groups[k],start=k+'-01',end=monthEnd_(k),w=summarizeWeather_(weather,start,end); return [k,g.a.length,g.p.filter(function(x){return x.status==='完了';}).length,groupText_(g.a,'plantName'),groupText_(g.a,'category'),groupText_(g.a,'place'),joinUnique_(g.a,'material'),joinUnique_(g.a,'observation'),g.p.filter(function(x){return x.status!=='完了';}).map(function(x){return x.action;}).join('／'),w.weather,w.maxTemp,w.minTemp,new Date()]; });
  appendRows_(sh, rows);
}

function rebuildSchedule_(sh, plans) {
  clearBody_(sh);
  const today = dateKey_(new Date());
  const rows = plans.filter(function(p){return p.status!=='完了'&&p.status!=='中止';}).map(function(p,i){ return [i+1,p.id,p.planOrder,p.date,p.seasonText,p.plantName,p.place,p.category,p.action,p.material,p.status,!!(p.date&&p.date<today),new Date(),p.scheduleType,p.startDate,p.endDate,p.rotationName,p.rotationOrder,p.sprayTarget,p.targetPest,p.pesticide,p.liquidFertilizer]; });
  appendRows_(sh, rows);
}

function ensureSchema_() {
  const ss = SpreadsheetApp.openById(APP_SPREADSHEET_ID);
  ensureActionAliasSheet_(ss);
  setHeaders_(ss.getSheetByName(SHEETS.actual), ACTUAL_HEADERS);
  setHeaders_(ss.getSheetByName(SHEETS.plan), PLAN_HEADERS);
  setHeaders_(ss.getSheetByName(SHEETS.daily), ['日付','実施件数','予定件数','完了予定件数','実施作業','対象植物','使用資材','観察内容','未完了予定','天気','最高気温','最低気温','降水量','要約','備考','最終更新日時']);
  setHeaders_(ss.getSheetByName(SHEETS.weekly), ['週開始日','週終了日','実施件数','完了予定件数','未完了予定件数','対象植物','作業分類','使用資材','観察内容','未完了予定','天気','最高気温','最低気温','最終更新日時']);
  setHeaders_(ss.getSheetByName(SHEETS.monthly), ['月','実施件数','完了予定件数','対象植物','作業分類','場所・区画','使用資材','観察内容','未完了予定','天気','最高気温','最低気温','最終更新日時']);
  setHeaders_(ss.getSheetByName(SHEETS.schedule), ['表示順','予定ID','表示区分','予定日','時期表示','対象植物','場所・区画','作業分類','予定内容','予定資材','状態','期限超過','最終更新日時','予定形式','開始日','終了日','ローテーション名','ローテーション順','散布対象','対象病害虫','薬剤','液肥']);
}

function ensureActionAliasSheet_(ss) {
  let sh = ss.getSheetByName(SHEETS.actionAliases);
  if (!sh) sh = ss.insertSheet(SHEETS.actionAliases);
  sh.getRange(1,1,1,3).setValues([['有効','標準作業名','別名']]);
  sh.setFrozenRows(1);
  if (sh.getLastRow() < 2) {
    sh.getRange(2,1,12,3).setValues([
      [true,'除草','草取り'],[true,'除草','草むしり'],[true,'除草','草むし'],[true,'除草','雑草取り'],[true,'除草','雑草除去'],
      [true,'水やり','灌水'],[true,'水やり','潅水'],[true,'水やり','水遣り'],
      [true,'花がら摘み','花殻摘み'],[true,'花がら摘み','花がら取り'],
      [true,'植え付け','植付け'],[true,'植え替え','植替え']
    ]);
  }
}

function setHeaders_(sh, headers) {
  if (!sh) throw new Error('必要なシートが見つかりません。');
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
}

function appendRows_(sh, rows) { if (rows && rows.length) sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows); }
function clearBody_(sh) { if (sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent(); }
function findRowById_(sh,id) { if(!id||sh.getLastRow()<2)return 0; const f=sh.getRange(2,1,sh.getLastRow()-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext(); return f?f.getRow():0; }
function validOrder_(v){ return ['次回','次々回','以降','通常'].indexOf(v)>=0?v:'通常'; }
function validScheduleType_(v,e){ if(['日付指定','期間指定','日付未定','ローテーション'].indexOf(v)>=0)return v; if(e&&e.rotationName)return'ローテーション'; if(e&&e.startDate&&e.endDate)return'期間指定'; if(e&&!e.date)return'日付未定'; return'日付指定'; }
function clean_(v){ return v===null||v===undefined?'':String(v).trim(); }
function canonicalAction_(v){
  const original=clean_(v),s=normalizeTextKey_(original);
  if (/^(除草|草取り|草むしり|草むし|雑草取り|雑草除去)+$/.test(s)) return '除草';
  const aliases=getActionAliasMap_();
  return aliases[s] || original;
}
function normalizeTextKey_(v){ return clean_(v).toLowerCase().replace(/[\s　・、,，。．／/・_\-]+/g,''); }
function getActionAliasMap_(){
  if(ACTION_ALIAS_MAP_CACHE_)return ACTION_ALIAS_MAP_CACHE_;
  const map={};
  try{
    const sh=SpreadsheetApp.openById(APP_SPREADSHEET_ID).getSheetByName(SHEETS.actionAliases);
    if(sh&&sh.getLastRow()>=2)sh.getRange(2,1,sh.getLastRow()-1,3).getValues().forEach(function(r){
      if(r[0]===true||String(r[0]).toUpperCase()==='TRUE'){
        const standard=clean_(r[1]),alias=normalizeTextKey_(r[2]);
        if(standard&&alias)map[alias]=standard;
      }
    });
  }catch(err){console.warn('作業名マスター参照失敗: '+err);}
  ACTION_ALIAS_MAP_CACHE_=map;
  return map;
}
function numOrNull_(v){ if(v===null||v===undefined||String(v).trim()==='')return null; const n=Number(v); return Number.isFinite(n)?n:null; }
function iso_(v){ if(!v)return''; const d=v instanceof Date?v:new Date(v); return isNaN(d)?'':d.toISOString(); }
function normalizeDate_(v){ if(!v)return''; if(v instanceof Date)return dateKey_(v); const s=String(v).trim().replace(/\//g,'-'); const m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); return m?m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0'):''; }
function dateKey_(v){ if(!v)return''; const d=v instanceof Date?v:new Date(v); return isNaN(d)?normalizeDate_(v):Utilities.formatDate(d,TZ,'yyyy-MM-dd'); }
function addDays_(s,n){ const p=normalizeDate_(s).split('-').map(Number); const d=new Date(p[0],p[1]-1,p[2]+n,12); return Utilities.formatDate(d,TZ,'yyyy-MM-dd'); }
function weekStart_(s){ const p=normalizeDate_(s).split('-').map(Number); const d=new Date(p[0],p[1]-1,p[2],12); const day=d.getDay()||7; d.setDate(d.getDate()-day+1); return Utilities.formatDate(d,TZ,'yyyy-MM-dd'); }
function unique_(a){ return Array.from(new Set(a)); }
function joinUnique_(a,key){ return unique_(a.map(function(x){return x[key];}).filter(Boolean)).join('／'); }
function groupText_(a,key){ const m={}; a.forEach(function(x){if(x[key])m[x[key]]=(m[x[key]]||0)+1;}); return Object.keys(m).map(function(k){return k+' '+m[k]+'件';}).join('／'); }
function sortByDateDesc_(a,b){ return (b.date||'').localeCompare(a.date||'') || (b.createdAt||'').localeCompare(a.createdAt||''); }
function sortPlan_(a,b){ const order={'次回':0,'次々回':1,'以降':2,'通常':3}; return (order[a.planOrder]-order[b.planOrder]) || (a.date||'9999').localeCompare(b.date||'9999'); }
function inferCategory_(s){ s=String(s||''); if(/消毒|薬剤|殺菌|殺虫/.test(s))return'薬剤散布'; if(/水|灌水/.test(s))return'水管理'; if(/肥料|施肥|追肥/.test(s))return'施肥'; if(/草|除草/.test(s))return'除草'; if(/剪定|摘花|花がら/.test(s))return'剪定・摘花'; if(/植替|植え替|植付|移植/.test(s))return'植付け・植替え'; if(/調査|確認|観察/.test(s))return'生育調査'; return'その他'; }
function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function setGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Gemini APIキー設定', 'APIキーを入力してください。シートには保存されません。', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', r.getResponseText().trim());
  ui.alert('設定しました。');
}

function onOpen() {
  ensureSchema_();
  SpreadsheetApp.getUi().createMenu('植物日誌').addItem('Gemini APIキー設定','setGeminiApiKey').addItem('サマリー再構築','rebuildAllSummaries_').addToUi();
}
