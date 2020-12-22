import { fakeApi, fakeData } from './fakeApi';
import { Store } from './store';

let store: Store;
beforeEach(() => (store = new Store(fakeApi)));

test('initial values are correct', () => {
  expect(store.dataState).toBe('not-started');
  expect(store.purchases).toHaveLength(0);
  expect(store.purchasesById.size).toBe(0);
  expect(store.tagsById.size).toBe(0);
  expect(store.tags).toHaveLength(0);
  expect(store.productsById.size).toBe(0);
  expect(store.products).toHaveLength(0);
});

test('reloading data works', async () => {
  await store.reloadData();

  expect(store.dataState).toBe('finished');
  expect(store.purchases).toHaveLength(fakeData.purchases.length);
  expect(store.purchasesById.size).toBe(fakeData.purchases.length);
  expect(store.tagsById.size).toBe(fakeData.tags.length);
  expect(store.tags).toHaveLength(fakeData.tags.length);
  expect(store.productsById.size).toBe(fakeData.products.length);
  expect(store.products).toHaveLength(fakeData.products.length);

  await store.reloadData();

  expect(store.dataState).toBe('finished');
  expect(store.purchases).toHaveLength(fakeData.purchases.length);
  expect(store.purchasesById.size).toBe(fakeData.purchases.length);
  expect(store.tagsById.size).toBe(fakeData.tags.length);
  expect(store.tags).toHaveLength(fakeData.tags.length);
  expect(store.productsById.size).toBe(fakeData.products.length);
  expect(store.products).toHaveLength(fakeData.products.length);
});
