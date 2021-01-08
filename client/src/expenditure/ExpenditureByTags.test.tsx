import moment from 'moment';
import React from 'react';

import { getPurchases, apiReloadData } from '../data/store';
import { newTestStore, render } from '../testUtil';
import { DateRange } from '../util';
import ExpenditureByTags from './ExpenditureByTags';

const store = newTestStore();

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
  await store.dispatch(apiReloadData);
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
