import MomentUtil from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { fakeClient } from './data/FakeClient';
import { Api, ApiContext, AppStore } from './data/store';

export const newFakeApi = (store: AppStore) => new Api(fakeClient, store);

const TestProviders = (store: AppStore, api: Api, history?: string[]) => (
  props: any,
) => {
  return (
    <Provider store={store}>
      <ApiContext.Provider value={api}>
        <MuiPickersUtilsProvider utils={MomentUtil}>
          <MemoryRouter initialEntries={history}>{props.children}</MemoryRouter>
        </MuiPickersUtilsProvider>
      </ApiContext.Provider>
    </Provider>
  );
};

export interface CustomRenderOptions {
  store: AppStore;
  api?: Api;
  history?: string[];
}

const customRender = (ui: any, options: CustomRenderOptions) => {
  return render(ui, {
    wrapper: TestProviders(
      options.store,
      options?.api ?? newFakeApi(options.store),
      options?.history,
    ),
  });
};

export * from '@testing-library/react';

export { customRender as render };
