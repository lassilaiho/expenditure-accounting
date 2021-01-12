import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { id } from './common';
import { RootState, useAppStore } from './store';

type Ui = {
  navigationOpen: boolean;
  routes: string[];
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: id<Ui>({ navigationOpen: false, routes: [] }),
  reducers: {
    openNavigation: state => {
      state.navigationOpen = true;
    },
    closeNavigation: state => {
      state.navigationOpen = false;
    },
    pushRoute: (state, action: PayloadAction<string>) => {
      state.routes.push(action.payload);
    },
    replaceRoute: (state, action: PayloadAction<string>) => {
      const i = state.routes.length - 1;
      if (i >= 0) {
        state.routes[i] = action.payload;
      } else {
        state.routes.push(action.payload);
      }
    },
    popRoute: state => {
      state.routes.pop();
    },
  },
});
const { pushRoute, replaceRoute, popRoute } = uiSlice.actions;
export const { openNavigation, closeNavigation } = uiSlice.actions;

export const getNavigationOpen = (state: RootState) => state.ui.navigationOpen;

export function useRouting(prev = '/') {
  const history = useHistory();
  const store = useAppStore();
  useEffect(() => {
    const { routes } = store.getState().ui;
    if (routes.length === 0) {
      store.dispatch(
        pushRoute(
          history.location.pathname +
            history.location.hash +
            history.location.search,
        ),
      );
    }
  }, []);
  return useMemo(
    () => ({
      push(r: string) {
        store.dispatch(pushRoute(r));
        history.push(r);
      },
      replace(r: string) {
        store.dispatch(replaceRoute(r));
        history.replace(r);
      },
      pop() {
        const { routes } = store.getState().ui;
        if (routes.length > 1) {
          store.dispatch(popRoute());
          history.goBack();
        } else {
          store.dispatch(replaceRoute(prev));
          history.replace(prev);
        }
      },
    }),
    [history, store, prev],
  );
}
