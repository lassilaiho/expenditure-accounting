import React from 'react';

import { fakeApi } from 'data/fakeApi';
import { Store } from 'data/store';
import ExpenditureDetailsPage from './ExpenditureDetailsPage';
import { render } from './testUtil';

test('renders correctly with invalid scope', () => {
  const { asFragment } = render(
    <ExpenditureDetailsPage />
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with day scope with data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <ExpenditureDetailsPage />,
    { store, history: ['/expenditure/14.1.2020'] },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with day scope without data', async () => {
  const { asFragment } = render(
    <ExpenditureDetailsPage />,
    { history: ['/expenditure/15.1.2020'] },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with month scope with data', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render(
    <ExpenditureDetailsPage />,
    { store, history: ['/expenditure/3/2020'] },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with month scope without data', async () => {
  const { asFragment } = render(
    <ExpenditureDetailsPage />,
    { history: ['/expenditure/4/2020'] },
  );
  expect(asFragment()).toMatchSnapshot();
});
