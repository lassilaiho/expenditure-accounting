import React from 'react';

import { fakeApi } from '../data/fakeApi';
import { Purchase, Store } from '../data/store';
import { render } from '../testUtil';
import PurchaseItem from './PurchaseItem';

let store: Store;
let quantity1: Purchase, quantityIntNot1: Purchase, quantityDecNot1: Purchase;

beforeAll(async () => {
  store = new Store(fakeApi);
  await store.reloadData();
  quantity1 = store.purchases[0];
  quantityIntNot1 = store.purchases[1];
  quantityDecNot1 = store.purchases[2];
});

test('renders correctly with purchase with quantity 1', () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantity1}
      expanded={false}
      onToggle={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with purchase with integer quantity not 1', async () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantityIntNot1}
      expanded={false}
      onToggle={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly with purchase with decimal quantity not 1', async () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantityDecNot1}
      expanded={false}
      onToggle={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});

test('renders correctly when expanded', async () => {
  const { asFragment } = render(
    <PurchaseItem
      purchase={quantityDecNot1}
      expanded={true}
      onToggle={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />,
  );
  expect(asFragment()).toMatchSnapshot();
});
