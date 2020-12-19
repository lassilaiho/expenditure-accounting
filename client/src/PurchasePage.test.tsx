import moment from 'moment';
import React from 'react';
import { Route } from 'react-router-dom';

import { fakeApi } from 'data/fakeApi';
import { Store } from 'data/store';
import PurchasePage from './PurchasePage';
import { render as testUtilRender } from './testUtil';

const render = (id: string, store?: Store) =>
  testUtilRender(
    <Route path='/purchases/:id'>
      <PurchasePage />
    </Route>,
    { store, history: ['/purchases/' + id] },
  );

test('renders correctly with invalid path', () => {
  const { asFragment } = render('asd');
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with nonexistent purchase', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render('42', store);
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with existing purchase', async () => {
  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render('3', store);
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with new purchase', async () => {
  const original = moment.utc;
  moment.utc = () => original('2020-01-01');

  const store = new Store(fakeApi);
  await store.reloadData();
  const { asFragment } = render('new', store);
  expect(asFragment()).toMatchSnapshot();

  moment.utc = original;
});
