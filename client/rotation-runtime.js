import { installRotationSeasonUi } from './rotation-season-ui.js';
import { isRotationPlan, needsNextCycle, rotationViewModel } from './rotation-utils.js';

function localToday_() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function createRotationRuntime(getState) {
  if (typeof getState !== 'function') throw new TypeError('getState is required');

  const fullViewModel = (minimumTotal = 12) => {
    const state = getState();
    return rotationViewModel(state.plans || [], state.actuals || [], minimumTotal, {
      seasons: state.rotationSeasons || {},
      today: state.today || localToday_()
    });
  };

  const runtime = {
    isRotationPlan,

    viewModel(minimumTotal = 12) {
      const model = fullViewModel(minimumTotal);
      return model?.mode === 'active' ? model : null;
    },

    seasonViewModel(minimumTotal = 12) {
      return fullViewModel(minimumTotal);
    },

    needsNextCycle(rotationName) {
      return needsNextCycle(getState().plans || [], rotationName);
    }
  };

  installRotationSeasonUi({ getState, getModel: runtime.seasonViewModel });
  return runtime;
}
