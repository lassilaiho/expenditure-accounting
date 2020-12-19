import React from 'react';

import { fakeApi } from 'data/fakeApi';
import { Store } from 'data/store';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';
import { render } from './testUtil';

test('renders correctly without data', () => {
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => { }} />
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => { }} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
