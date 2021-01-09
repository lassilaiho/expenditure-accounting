import { newTestStore } from '../testUtil';
import { fakeData } from './FakeClient';
import { apiReloadData } from './purchases';

const store = newTestStore();

const keyCount = (obj: any) => Object.keys(obj).length;

test('initial values are correct', () => {
  expect(store.getState().dataState).toBe('not-started');
  expect(keyCount(store.getState().purchases.byId)).toBe(0);
  expect(keyCount(store.getState().tags.byId)).toBe(0);
  expect(keyCount(store.getState().tags.byName)).toBe(0);
  expect(store.getState().products.all).toHaveLength(0);
});

test('reloading data works', async () => {
  await store.dispatch(apiReloadData);

  expect(store.getState().dataState).toBe('finished');
  expect(keyCount(store.getState().purchases.byId)).toBe(
    fakeData.purchases.length,
  );
  expect(keyCount(store.getState().tags.byId)).toBe(fakeData.tags.length);
  expect(keyCount(store.getState().tags.byName)).toBe(fakeData.tags.length);
  expect(store.getState().products.all).toHaveLength(fakeData.products.length);

  await store.dispatch(apiReloadData);

  expect(store.getState().dataState).toBe('finished');
  expect(keyCount(store.getState().purchases.byId)).toBe(
    fakeData.purchases.length,
  );
  expect(keyCount(store.getState().tags.byId)).toBe(fakeData.tags.length);
  expect(keyCount(store.getState().tags.byName)).toBe(fakeData.tags.length);
  expect(store.getState().products.all).toHaveLength(fakeData.products.length);
});
