import React from 'react';
import { newStore } from '../data/store';

import { fakeApi, render } from '../testUtil';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';

test('renders correctly without data', () => {
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => undefined} />,
    { store: newStore() },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  const store = newStore();
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render(
    <MonthlyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
