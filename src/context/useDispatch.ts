import { useContext } from 'react';
import { StoreDispatchContext } from './index';

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
