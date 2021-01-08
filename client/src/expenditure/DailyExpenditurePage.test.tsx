import React from 'react';

import { apiReloadData } from '../data/store';
import { newTestStore, render } from '../testUtil';
import DailyExpenditurePage from './DailyExpenditurePage';

const store = newTestStore();

test('renders correctly without data', () => {
  const { asFragment } = render(
    <DailyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  await store.dispatch(apiReloadData);
  const { asFragment } = render(
    <DailyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
