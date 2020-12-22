import MomentUtil from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { render } from '@testing-library/react';
import React, { useRef } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { fakeApi } from './data/fakeApi';
import { Store, StoreContext } from './data/store';

const TestProviders = (defaultStore?: Store, history?: string[]) => (
  props: any,
) => {
  const store = useRef<Store | null>(null);
  if (store.current === null) {
    if (defaultStore === undefined) {
      store.current = new Store(fakeApi);
    } else {
      store.current = defaultStore;
    }
  }
  return (
    <StoreContext.Provider value={store.current}>
      <MuiPickersUtilsProvider utils={MomentUtil}>
        <MemoryRouter initialEntries={history}>{props.children}</MemoryRouter>
      </MuiPickersUtilsProvider>
    </StoreContext.Provider>
  );
};

export interface CustomRenderOptions {
  store?: Store;
  history?: string[];
}

const customRender = (ui: any, options?: CustomRenderOptions) => {
  let store, history;
  if (options) {
    store = options.store;
    history = options.history;
  }
  return render(ui, { wrapper: TestProviders(store, history) });
};

export * from '@testing-library/react';

export { customRender as render };
