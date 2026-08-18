import { isFavoriteRecord, quickKey, quickTemplate, recentQuickCandidates } from './quick-input-utils.js';

export function createQuickInputRuntime(getState, makeId = () => crypto.randomUUID()) {
  if (typeof getState !== 'function') throw new TypeError('getState is required');

  return {
    quickKey,

    quickTemplate(item) {
      return quickTemplate(item, makeId);
    },

    isFavorite(item) {
      return isFavoriteRecord(item, getState().quickFavorites || []);
    },

    buildGroups() {
      const state = getState();
      const favorites = (state.quickFavorites || []).filter(item => item.action);
      const recent = recentQuickCandidates(state.actuals || [], favorites, 8);
      return { favorites, recent };
    },

    toggleFavorite(item) {
      const state = getState();
      const favorites = state.quickFavorites || [];
      const key = quickKey(item);
      const index = favorites.findIndex(value => quickKey(value) === key);
      if (index >= 0) {
        favorites.splice(index, 1);
        return { added: false, favorites };
      }
      favorites.unshift(quickTemplate(item, makeId));
      return { added: true, favorites };
    }
  };
}
