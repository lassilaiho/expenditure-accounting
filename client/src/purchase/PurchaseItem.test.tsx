import React from 'react';
import {
  apiReloadData,
  AppStore,
  getPurchaseById,
  Purchase,
} from '../data/store';

import { newTestStore, render } from '../testUtil';
import PurchaseItem from './PurchaseItem';

let store: AppStore;
let quantity1: Purchase, quantityIntNot1: Purchase, quantityDecNot1: Purchase;

beforeAll(async () => {
  store = newTestStore();
  await store.dispatch(apiReloadData);
  quantity1 = getPurchaseById(1)(store.getState());
  quantityIntNot1 = getPurchaseById(2)(store.getState());
  quantityDecNot1 = getPurchaseById(3)(store.getState());
});

test('renders correctly with purchase with quantity 1', () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantity1}
      expanded={false}
      onToggle={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with purchase with integer quantity not 1', async () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantityIntNot1}
      expanded={false}
      onToggle={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with purchase with decimal quantity not 1', async () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantityDecNot1}
      expanded={false}
      onToggle={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly when expanded', async () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantityDecNot1}
      expanded={true}
      onToggle={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
    { store },
  );
  expect(asFragment()).toMatchSnapshot();
});
