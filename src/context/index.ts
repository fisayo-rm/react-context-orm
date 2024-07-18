import { createContext } from 'react';
import { State } from '../interfaces';

/**
 * Context for the store state.
 */
export const StoreStateContext = createContext<State | undefined>(undefined);

/**
 * Context for the dispatch function.
 */
export const StoreDispatchContext = createContext<
  ((type: string, payload?: any) => Promise<any>) | undefined
>(undefined);

export * from './StoreProvider';
export * from './useDispatch';
export * from './useStoreState';
