import moment from 'moment';
import React from 'react';

import { fakeApi } from './data/fakeApi';
import { Store } from './data/store';
import ExpenditureByTags from './ExpenditureByTags';
import { render } from './testUtil';
import { DateRange } from './util';

test('renders correctly without data', () => {
  const { asFragment } = render(
    <ExpenditureByTags
      purchases={[]}
      dateRange={new DateRange(moment('2020-01-01'), moment('2020-03-31'))}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with all data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <ExpenditureByTags
      purchases={store.purchases}
      dateRange={new DateRange(moment('2020-01-01'), moment('2020-03-31'))}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with filtered data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <ExpenditureByTags
      purchases={store.purchases}
      dateRange={new DateRange(moment('2020-01-01'), moment('2020-01-31'))}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});
