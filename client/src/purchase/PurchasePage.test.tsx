import { Store } from '@reduxjs/toolkit';
import moment from 'moment';
import React from 'react';
import { Route } from 'react-router-dom';
import { apiReloadData, RootState } from '../data/store';

import { newTestStore, render as testUtilRender } from '../testUtil';
import PurchasePage from './PurchasePage';

const render = (id: string, store?: Store<RootState>) => {
  if (!store) {
    store = newTestStore();
  }
  return testUtilRender(
    <Route path='/purchases/:id'>
      <PurchasePage />
    </Route>,
    { store, history: ['/purchases/' + id] },
  );
};

test('renders correctly with invalid path', () => {
  const { asFragment } = render('asd');
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with nonexistent purchase', async () => {
  const store = newTestStore();
  await store.dispatch(apiReloadData);
  const { asFragment } = render('42', store);
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with existing purchase', async () => {
  const store = newTestStore();
  await store.dispatch(apiReloadData);
  const { asFragment } = render('3', store);
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with new purchase', async () => {
  const original = moment.utc;
  moment.utc = () => original('2020-01-01');

  const store = newTestStore();
  await store.dispatch(apiReloadData);
  const { asFragment } = render('new', store);
  expect(asFragment()).toMatchSnapshot();

  moment.utc = original;
});
