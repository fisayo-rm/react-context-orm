import { useContext } from 'react';
import { StoreStateContext } from './index';

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
