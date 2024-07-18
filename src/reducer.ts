import { Model } from './Model';
import { State, Action } from './interfaces';
import { mutations } from './mutations';

/**
 * Reducer function to handle state updates.
 * @param state The current state.
 * @param action The action to perform.
 * @returns The new state.
 */
export const reducer = (state: State, action: Action) => {
  const mutation = mutations[action.type];
  if (mutation) {
    const newState = { ...state };
    mutation(newState, action.payload);
    Model.store = newState;
    return newState;
  }
  return state;
};
