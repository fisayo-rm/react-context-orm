import { createContext, useContext } from 'react';
import { State } from './interfaces';

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

/**
 * Hook to use the store state.
 * @returns The state of the store.
 */
export const useStoreState = () => {
  const context = useContext(StoreStateContext);
  if (context === undefined) {
    throw new Error('useState must be used within a StoreProvider');
  }
  return context;
};

/**
 * Hook to use the dispatch function.
 * @returns The dispatch function.
 */
export const useDispatch = () => {
  const context = useContext(StoreDispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a StoreProvider');
  }
  return context;
};
