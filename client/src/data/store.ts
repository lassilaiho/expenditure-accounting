import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useEffect } from 'react';

import { HttpClient } from './HttpClient';
import { productsSlice } from './products';
import { purchasesSlice, apiReloadData } from './purchases';
import { sessionSlice } from './session';
import { tagsSlice } from './tags';
import { id } from './common';
import { uiSlice } from './ui';

export type Inject = {
  http: HttpClient;
};

export const newStore = (http: HttpClient) =>
  configureStore({
    reducer: {
      tags: tagsSlice.reducer,
      products: productsSlice.reducer,
      purchases: purchasesSlice.reducer,
      dataState: dataStateSlice.reducer,
      session: sessionSlice.reducer,
      ui: uiSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
        thunk: { extraArgument: { http } },
      }),
  });

export type AppStore = ReturnType<typeof newStore>;
export type GetState = AppStore['getState'];
export type RootState = ReturnType<GetState>;
export function useAppStore() {
  return useStore<RootState>();
}
export function useAppSelector<T>(selector: (state: RootState) => T) {
  return useSelector<RootState, T>(selector);
}
export type AppDispatch = AppStore['dispatch'];
export const useAppDispatch = () => useDispatch<AppDispatch>();

export type LoadState = 'not-started' | 'loading' | 'finished' | 'failed';

export const dataStateSlice = createSlice({
  name: 'dataState',
  initialState: id<LoadState>('not-started'),
  reducers: {
    setDataState: (state, action: PayloadAction<LoadState>) => action.payload,
  },
});
export const { setDataState } = dataStateSlice.actions;

export class AuthError extends Error {}

export type Thunk<T = void> = (
  dispatch: AppDispatch,
  getState: GetState,
  inj: Inject,
) => T;

export type AsyncThunk<T = void> = Thunk<Promise<T>>;

export const getDataState = (state: RootState) => state.dataState;

export function useData() {
  const dataState = useAppSelector(getDataState);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (dataState === 'not-started') {
      dispatch(apiReloadData);
    }
  });
}
