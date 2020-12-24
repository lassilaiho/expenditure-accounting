import React from 'react';

import { fakeApi } from '../data/fakeApi';
import { Store } from '../data/store';
import { render } from '../testUtil';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';

test('renders correctly without data', () => {
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => undefined} />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
