import React from 'react';

import { apiReloadData } from '../data/store';
import { newTestStore, render } from '../testUtil';
import ExpenditureDetailsPage from './ExpenditureDetailsPage';

test('renders correctly with invalid scope', () => {
  const store = newTestStore();
  const { asFragment } = render(<ExpenditureDetailsPage />, { store });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with day scope with data', async () => {
  const store = newTestStore();
  await store.dispatch(apiReloadData);
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/14.1.2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with day scope without data', async () => {
  const store = newTestStore();
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/15.1.2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with month scope with data', async () => {
  const store = newTestStore();
  await store.dispatch(apiReloadData);
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/3/2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with month scope without data', async () => {
  const store = newTestStore();
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/4/2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});
