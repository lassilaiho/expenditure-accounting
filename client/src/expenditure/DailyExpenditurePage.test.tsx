import React from 'react';

import { newStore } from '../data/store';
import { fakeApi, render } from '../testUtil';
import DailyExpenditurePage from './DailyExpenditurePage';

const store = newStore();

test('renders correctly without data', () => {
  const { asFragment } = render(
    <DailyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with data', async () => {
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render(
    <DailyExpenditurePage openNavigation={() => undefined} />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
