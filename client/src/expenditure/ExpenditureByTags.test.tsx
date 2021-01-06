import moment from 'moment';
import React from 'react';

import { getPurchases, newStore } from '../data/store';
import { fakeApi, render } from '../testUtil';
import { DateRange } from '../util';
import ExpenditureByTags from './ExpenditureByTags';

const store = newStore();

test('renders correctly without data', () => {
  const { asFragment } = render(
    <ExpenditureByTags
      purchases={[]}
      dateRange={
        new DateRange(moment.utc('2020-01-01'), moment.utc('2020-03-31'))
      }
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with all data', async () => {
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render(
    <ExpenditureByTags
      purchases={getPurchases(store.getState())}
      dateRange={
        new DateRange(moment.utc('2020-01-01'), moment.utc('2020-03-31'))
      }
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with filtered data', async () => {
  const { asFragment } = render(
    <ExpenditureByTags
      purchases={getPurchases(store.getState())}
      dateRange={
        new DateRange(moment.utc('2020-01-01'), moment.utc('2020-01-31'))
      }
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
