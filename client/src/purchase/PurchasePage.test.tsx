import { Store } from '@reduxjs/toolkit';
import moment from 'moment';
import React from 'react';
import { Route } from 'react-router-dom';
import { newStore, RootState } from '../data/store';

import { fakeApi, render as testUtilRender } from '../testUtil';
import PurchasePage from './PurchasePage';

const render = (id: string, store?: Store<RootState>) => {
  if (!store) {
    store = newStore();
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
  const store = newStore();
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render('42', store);
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with existing purchase', async () => {
  const store = newStore();
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render('3', store);
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with new purchase', async () => {
  const original = moment.utc;
  moment.utc = () => original('2020-01-01');

  const store = newStore();
  await store.dispatch(fakeApi.reloadData);
  const { asFragment } = render('new', store);
  expect(asFragment()).toMatchSnapshot();

  moment.utc = original;
});
