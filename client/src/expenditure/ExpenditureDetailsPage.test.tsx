import React from 'react';

import { newStore } from '../data/store';
import { fakeApi, render } from '../testUtil';
import ExpenditureDetailsPage from './ExpenditureDetailsPage';

test('renders correctly with invalid scope', () => {
  const store = newStore();
  const { asFragment } = render(<ExpenditureDetailsPage />, { store });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with day scope with data', async () => {
  const store = newStore();
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/14.1.2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with day scope without data', async () => {
  const store = newStore();
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/15.1.2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with month scope with data', async () => {
  const store = newStore();
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/3/2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with month scope without data', async () => {
  const store = newStore();
  const { asFragment } = render(<ExpenditureDetailsPage />, {
    store,
    history: ['/expenditure/4/2020'],
  });
  expect(asFragment()).toMatchSnapshot();
});
