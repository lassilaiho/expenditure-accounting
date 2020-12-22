import React from 'react';

import { fakeApi } from '../data/fakeApi';
import { Store } from '../data/store';
import { render } from '../testUtil';
import DailyExpenditurePage from './DailyExpenditurePage';

test('renders correctly without data', () => {
  const { asFragment } = render(
    <DailyExpenditurePage openNavigation={() => {}} />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <DailyExpenditurePage openNavigation={() => {}} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
