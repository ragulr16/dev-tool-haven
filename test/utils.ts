import { act } from '@testing-library/react';
import { StateCreator } from 'zustand';

const storeResetFns = new Set<() => void>();

export const createStore = <S>(createState: StateCreator<S>) => {
  const store = createState((set, get, api) => ({
    ...createState(set, get, api),
  }));

  const initialState = store.getState();
  storeResetFns.add(() => {
    store.setState(initialState, true);
  });

  return store;
};

export const resetAllStores = () => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn();
    });
  });
}; 