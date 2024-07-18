import React, { ReactNode, useReducer } from 'react';
import { State, ActionContext } from './interfaces';
import { actions } from './actions';
import { StoreStateContext, StoreDispatchContext } from './context';
import { reducer } from './reducer';

export const StoreProvider: React.FC<{
  children: ReactNode;
  initialState?: State;
}> = ({ children, initialState = {} }) => {
  const [state, reactDispatch] = useReducer(reducer, initialState);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const dispatch = React.useCallback(async (type: string, payload?: any) => {
    const action = actions[type];
    if (action) {
      const context: ActionContext = {
        state: stateRef.current,
        commit: (mutationType: string, mutationPayload?: any) => {
          reactDispatch({
            type: mutationType,
            payload: mutationPayload,
          });
        },
        dispatch: (actionType: string, actionPayload?: any) =>
          dispatch(actionType, actionPayload),
      };
      return action(context, payload);
    }
    throw new Error(`Unknown action type: ${type}`);
  }, []);

  return (
    <StoreStateContext.Provider value={state}>
      <StoreDispatchContext.Provider value={dispatch}>
        {children}
      </StoreDispatchContext.Provider>
    </StoreStateContext.Provider>
  );
};
