import { newTestStore } from '../testUtil';
import { fakeData } from './FakeClient';
import { apiReloadData } from './purchases';

const store = newTestStore();

test('initial values are correct', () => {
  expect(store.getState().dataState).toBe('not-started');
  expect(store.getState().purchases.all).toHaveLength(0);
  expect(store.getState().tags.all).toHaveLength(0);
  expect(store.getState().tags.all).toHaveLength(0);
  expect(store.getState().products.all).toHaveLength(0);
});

test('reloading data works', async () => {
  await store.dispatch(apiReloadData);

  expect(store.getState().dataState).toBe('finished');
  expect(store.getState().purchases.all).toHaveLength(
    fakeData.purchases.length,
  );
  expect(store.getState().tags.all).toHaveLength(fakeData.tags.length);
  expect(store.getState().tags.all).toHaveLength(fakeData.tags.length);
  expect(store.getState().products.all).toHaveLength(fakeData.products.length);

  await store.dispatch(apiReloadData);

  expect(store.getState().dataState).toBe('finished');
  expect(store.getState().purchases.all).toHaveLength(
    fakeData.purchases.length,
  );
  expect(store.getState().tags.all).toHaveLength(fakeData.tags.length);
  expect(store.getState().tags.all).toHaveLength(fakeData.tags.length);
  expect(store.getState().products.all).toHaveLength(fakeData.products.length);
});
