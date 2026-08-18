import { isRotationPlan, needsNextCycle, rotationViewModel } from './rotation-utils.js';

export function createRotationRuntime(getState) {
  if (typeof getState !== 'function') throw new TypeError('getState is required');

  return {
    isRotationPlan,

    viewModel(minimumTotal = 12) {
      const state = getState();
      return rotationViewModel(state.plans || [], state.actuals || [], minimumTotal);
    },

    needsNextCycle(rotationName) {
      return needsNextCycle(getState().plans || [], rotationName);
    }
  };
}
