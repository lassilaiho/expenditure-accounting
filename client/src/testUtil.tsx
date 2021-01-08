import MomentUtil from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { fakeClient } from './data/FakeClient';
import { AppStore, newStore } from './data/store';

export const newTestStore = () => newStore(fakeClient);

const TestProviders = (store: AppStore, history?: string[]) => (props: any) => {
  return (
    <Provider store={store}>
      <MuiPickersUtilsProvider utils={MomentUtil}>
        <MemoryRouter initialEntries={history}>{props.children}</MemoryRouter>
      </MuiPickersUtilsProvider>
    </Provider>
  );
};

export interface CustomRenderOptions {
  store: AppStore;
  history?: string[];
}

const customRender = (ui: any, options: CustomRenderOptions) => {
  return render(ui, {
    wrapper: TestProviders(options.store, options?.history),
  });
};

export * from '@testing-library/react';

export { customRender as render };
