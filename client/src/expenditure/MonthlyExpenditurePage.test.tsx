import React from 'react';

import { apiReloadData } from '../data/purchases';
import { newTestStore, render } from '../testUtil';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';

test('renders correctly without data', () => {
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => undefined} />,
    { store: newTestStore() },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  const store = newTestStore();
  await store.dispatch(apiReloadData);
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
