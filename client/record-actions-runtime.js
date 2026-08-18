export function createRecordActionsRuntime({
  getState,
  api,
  applyBootstrap,
  busy,
  toast,
  showTab,
  renderPreview,
  saveDraft,
  localDate,
  escapeHtml,
  openModal,
  closeModal,
  promptFn = globalThis.prompt,
  confirmFn = globalThis.confirm,
  query = selector => document.querySelector(selector),
  makeId = () => crypto.randomUUID()
}) {
  if (typeof getState !== 'function') throw new TypeError('getState is required');
  if (typeof api !== 'function') throw new TypeError('api is required');

  const findRecord = (type, id) => {
    const state = getState();
    return (type === 'plan' ? state.plans : state.actuals).find(item => item.id === id);
  };

  const toActualEntry = item => ({
    ...item,
    clientId: makeId(),
    id: '',
    type: 'actual',
    date: localDate(new Date()),
    status: '',
    calendarEventId: ''
  });

  return {
    openEdit(type, id) {
      const item = findRecord(type, id);
      if (!item) return;
      openModal(
        '編集',
        `<label class="label">作業内容</label><textarea id="editAction">${escapeHtml(item.action)}</textarea>` +
        `<label class="label">備考</label><input id="editMemo" value="${escapeHtml(item.memo || '')}">` +
        '<button class="primary" id="saveEdit">保存</button>'
      );
      query('#saveEdit').onclick = async () => {
        busy(true, '保存中…');
        try {
          const data = await api({
            action: 'update',
            type,
            id,
            patch: { action: query('#editAction').value, memo: query('#editMemo').value }
          });
          applyBootstrap(data);
          closeModal();
          toast('更新しました');
        } catch (error) {
          toast(error.message);
        } finally {
          busy(false);
        }
      };
    },

    async removeEntry(type, id) {
      if (!confirmFn('削除しますか？')) return;
      busy(true, '削除中…');
      try {
        const data = await api({ action: 'delete', type, id });
        applyBootstrap(data);
        toast('削除しました');
      } catch (error) {
        toast(error.message);
      } finally {
        busy(false);
      }
    },

    reuseEntry(type, id) {
      const item = findRecord(type, id);
      if (!item) return;
      const state = getState();
      state.entries = [toActualEntry(item)];
      state.inputType = 'actual';
      showTab('input');
      renderPreview();
      saveDraft();
    },

    openComplete(id) {
      const state = getState();
      const item = state.plans.find(value => value.id === id);
      if (!item) return;
      state.completingPlanId = id;
      state.entries = [toActualEntry(item)];
      state.inputType = 'actual';
      showTab('input');
      renderPreview();
      saveDraft();
    },

    async openPostpone(id) {
      const date = promptFn('延期後の日付（YYYY-MM-DD）');
      if (!date) return;
      busy(true, '延期中…');
      try {
        const data = await api({ action: 'postponePlan', id, date });
        applyBootstrap(data);
        toast('延期しました');
      } catch (error) {
        toast(error.message);
      } finally {
        busy(false);
      }
    },

    async cancelPlan(id) {
      if (!confirmFn('見送りにしますか？')) return;
      busy(true, '更新中…');
      try {
        const data = await api({ action: 'cancelPlan', id });
        applyBootstrap(data);
        toast('見送りにしました');
      } catch (error) {
        toast(error.message);
      } finally {
        busy(false);
      }
    },

    async syncCalendar(id) {
      busy(true, 'カレンダー登録中…');
      try {
        const data = await api({ action: 'calendar', id });
        applyBootstrap(data);
        toast('登録しました');
      } catch (error) {
        toast(error.message);
      } finally {
        busy(false);
      }
    },

    openRotationExecute(id) {
      this.openComplete(id);
    },

    async skipRotation(id) {
      busy(true, '更新中…');
      try {
        const data = await api({ action: 'skipRotation', id });
        applyBootstrap(data);
        toast('今回は飛ばしました');
      } catch (error) {
        toast(error.message);
      } finally {
        busy(false);
      }
    }
  };
}
