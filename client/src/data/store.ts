import {
  configureStore,
  createAction,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import Big from 'big.js';
import { useDispatch, useSelector, useStore } from 'react-redux';
import React, { useContext, useEffect } from 'react';
import moment from 'moment';
import { ensureOk } from '../util';

import { HttpClient } from './HttpClient';
import * as jsonConv from './jsonConvert';

type Collection<T> = {
  byId: { [id: number]: T };
  all: number[];
};

function emptyCollection<T>(): Collection<T> {
  return { byId: {}, all: [] };
}

export type Tag = { id: number; name: string };

function tagFromJson(json: any): Tag {
  jsonConv.toObject(json);
  return { id: jsonConv.toNumber(json.id), name: jsonConv.toString(json.name) };
}

export type Product = { id: number; name: string };

function productFromJson(json: any): Product {
  jsonConv.toObject(json);
  return { id: jsonConv.toNumber(json.id), name: jsonConv.toString(json.name) };
}

export type Purchase = {
  id: number;
  product: number;
  date: moment.Moment;
  quantity: Big;
  price: Big;
  tags: number[];
};

function purchaseFromJson(json: any): [Purchase, Product, Tag[]] {
  jsonConv.toObject(json);
  const product = productFromJson(json.product);
  const tags = jsonConv.toArray(tagFromJson, json.tags);
  const purchase = {
    id: jsonConv.toNumber(json.id),
    product: product.id,
    date: jsonConv.toMomentUtc(json.date),
    quantity: jsonConv.toBig(json.quantity),
    price: jsonConv.toBig(json.price),
    tags: tags.map(x => x.id),
  };
  return [purchase, product, tags];
}

export type LoadState = 'not-started' | 'loading' | 'finished' | 'failed';

export type Session =
  | { state: 'logged-out' }
  | {
      state: 'logged-in';
      token: string;
      email: string;
      expiryTime: moment.Moment;
    };

function sessionFromJson(json: any): Session {
  jsonConv.toObject(json);
  if (json.state === 'logged-out') {
    return { state: 'logged-out' };
  }
  if (json.state !== 'logged-in' && json.state !== 'expired') {
    throw new Error('invalid session state: ' + json.state);
  }
  return {
    state: json.state,
    email: jsonConv.toString(json.email),
    token: jsonConv.toString(json.token),
    expiryTime: jsonConv.toMomentUtc(json.expiryTime),
  };
}

const id = <T>(x: T) => x;

const clearRemoteData = createAction('clearRemoteData');
type RemoteDataSet = [Purchase, Product, Tag[]][];
const setRemoteData = createAction<RemoteDataSet>('setRemoteData');

const tagsSlice = createSlice({
  name: 'tags',
  initialState: id<Collection<Tag>>({ byId: {}, all: [] }),
  reducers: {
    addTags(state, action: PayloadAction<Tag[]>) {
      for (const tag of action.payload) {
        if (!state.byId[tag.id]) {
          state.all.push(tag.id);
          state.byId[tag.id] = tag;
        }
      }
    },
  },
  extraReducers: {
    [clearRemoteData.type]: emptyCollection,
    [setRemoteData.type]: (state, action: PayloadAction<RemoteDataSet>) => {
      const {
        actions: { addTags },
        caseReducers: { addTags: reduce },
      } = tagsSlice;
      for (const data of action.payload) {
        reduce(state, addTags(data[2]));
      }
    },
  },
});
const { addTags } = tagsSlice.actions;

const productsSlice = createSlice({
  name: 'products',
  initialState: id<Collection<Product>>({ byId: {}, all: [] }),
  reducers: {
    addProduct(state, action: PayloadAction<Product>) {
      if (!state.byId[action.payload.id]) {
        state.all.push(action.payload.id);
        state.byId[action.payload.id] = action.payload;
      }
    },
  },
  extraReducers: {
    [clearRemoteData.type]: emptyCollection,
    [setRemoteData.type]: (state, action: PayloadAction<RemoteDataSet>) => {
      const {
        actions: { addProduct },
        caseReducers: { addProduct: reduce },
      } = productsSlice;
      for (const data of action.payload) {
        reduce(state, addProduct(data[1]));
      }
    },
  },
});
const { addProduct } = productsSlice.actions;

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState: id<Collection<Purchase>>({ byId: {}, all: [] }),
  reducers: {
    addPurchase(state, action: PayloadAction<Purchase>) {
      const purchase = action.payload;
      if (state.byId[purchase.id]) {
        return;
      }
      state.byId[purchase.id] = purchase;
      for (let i = 0; i < state.all.length; i++) {
        if (purchase.date > state.byId[state.all[i]].date) {
          state.all.splice(i, 0, purchase.id);
          return;
        }
      }
      state.all.splice(state.all.length, 0, purchase.id);
    },
    updatePurchase(state, action: PayloadAction<Purchase>) {
      state.byId[action.payload.id] = action.payload;
    },
    deletePurchase(state, action: PayloadAction<number>) {
      const i = state.all.indexOf(action.payload);
      if (i !== -1) {
        state.all.splice(i, 1);
        delete state.byId[action.payload];
      }
    },
  },
  extraReducers: {
    [clearRemoteData.type]: emptyCollection,
    [setRemoteData.type]: (state, action: PayloadAction<RemoteDataSet>) => {
      const {
        actions: { addPurchase },
        caseReducers: { addPurchase: reduce },
      } = purchasesSlice;
      for (const data of action.payload) {
        reduce(state, addPurchase(data[0]));
      }
    },
  },
});
const { addPurchase, updatePurchase, deletePurchase } = purchasesSlice.actions;

const dataStateSlice = createSlice({
  name: 'dataState',
  initialState: id<LoadState>('not-started'),
  reducers: {
    setDataState: (state, action: PayloadAction<LoadState>) => action.payload,
  },
});
const { setDataState } = dataStateSlice.actions;

type LoginData = Omit<Exclude<Session, { state: 'logged-out' }>, 'state'>;

const sessionSlice = createSlice({
  name: 'session',
  initialState: id<Session>({ state: 'logged-out' }),
  reducers: {
    login: (state, action: PayloadAction<LoginData>) => ({
      ...action.payload,
      state: 'logged-in',
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout: state => ({ state: 'logged-out' }),
  },
});
const { login, logout } = sessionSlice.actions;

export const newStore = () =>
  configureStore({
    reducer: {
      tags: tagsSlice.reducer,
      products: productsSlice.reducer,
      purchases: purchasesSlice.reducer,
      dataState: dataStateSlice.reducer,
      session: sessionSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

export const store = newStore();

export type AppStore = ReturnType<typeof newStore>;
type GetState = typeof store.getState;
export type RootState = ReturnType<GetState>;
export function useAppStore() {
  return useStore<RootState>();
}
export function useAppSelector<T>(selector: (state: RootState) => T) {
  return useSelector<RootState, T>(selector);
}
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export const getDataState = (state: RootState) => state.dataState;

export const totalPrice = (p: Purchase) => p.quantity.mul(p.price);

export const getPurchaseById = (id: number) => (state: RootState) =>
  state.purchases.byId[id];

export const getProductById = (id: number) => (state: RootState) =>
  state.products.byId[id];

export const getPurchases = (state: RootState) =>
  state.purchases.all.map(id => state.purchases.byId[id]);

export const getProducts = (state: RootState) =>
  state.products.all.map(id => state.products.byId[id]);

export const getSession = (state: RootState) => state.session;

export const getIsLoggedIn = (state: RootState) =>
  state.session.state === 'logged-in';

export const getCurrentEmail = (state: RootState) =>
  state.session.state === 'logged-in' ? state.session.email : '';

export const getSessionToken = (state: RootState) =>
  state.session.state === 'logged-in' ? state.session.token : null;

export const getTags = (state: RootState) =>
  state.tags.all.map(id => state.tags.byId[id]);

export const getFilteredPurchases = (filter: string) => (state: RootState) => {
  filter = filter.toLocaleLowerCase();
  const result: Purchase[] = [];
  for (const purchaseId of state.purchases.all) {
    const purchase = getPurchaseById(purchaseId)(state);
    const product = getProductById(purchase.product)(state);
    if (product.name.toLocaleLowerCase().includes(filter)) {
      result.push(purchase);
      continue;
    }
    for (const tagId of purchase.tags) {
      const tag = state.tags.byId[tagId];
      if (tag.name.toLocaleLowerCase().includes(filter)) {
        result.push(purchase);
        break;
      }
    }
  }
  return result;
};

export const getTagsById = (state: RootState) => state.tags.byId;

export const getTagsSortedByName = (ids: number[]) => (state: RootState) => {
  const tags = ids.map(id => state.tags.byId[id]);
  return tags.sort((a, b) => {
    const aName = a.name.toLocaleLowerCase();
    const bName = b.name.toLocaleLowerCase();
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });
};

export const getLatestPurchaseByProduct = (productName: string) => (
  state: RootState,
) => {
  productName = productName.toLocaleLowerCase();
  for (const purchaseId of state.purchases.all) {
    const purchase = state.purchases.byId[purchaseId];
    const product = state.products.byId[purchase.product];
    if (product.name.toLocaleLowerCase().includes(productName)) {
      return purchase;
    }
  }
  return null;
};

export interface PurchaseUpdate {
  id: number;
  product: string;
  date: moment.Moment;
  quantity: Big;
  price: Big;
  tags: string[];
}

function purchaseFromUpdate(
  update: PurchaseUpdate,
  product: Product,
  tags: Tag[],
): Purchase {
  return {
    id: update.id,
    product: product.id,
    date: update.date,
    quantity: update.quantity,
    price: update.price,
    tags: tags.map(x => x.id),
  };
}

export class AuthError extends Error {}

export class Api {
  public constructor(private client: HttpClient) {}

  public static fromLocalStorage(client: HttpClient, store: AppStore) {
    try {
      const json = localStorage.getItem('session') ?? '';
      const session = sessionFromJson(JSON.parse(json));
      store.dispatch(
        session.state === 'logged-in' && session.expiryTime > moment.utc()
          ? login(session)
          : logout,
      );
    } catch (e) {
      console.error(e);
    }
    return new Api(client);
  }

  public login = (email: string, password: string) => async (
    dispatch: AppDispatch,
  ) => {
    const r = await this.client.postJson('/login', { email, password });
    if (r.status === 401) {
      throw new AuthError();
    }
    ensureOk(r);
    const respData = jsonConv.toObject(await r.json());
    dispatch(
      login({
        email,
        token: jsonConv.toString(respData.token),
        expiryTime: jsonConv.toMomentUtc(respData.expiryTime),
      }),
    );
  };

  public logout = async (dispatch: AppDispatch) => {
    const r = await this.client.postJson('/logout', {});
    ensureOk(r);
    dispatch(logout);
  };

  public changePassword = (oldPassword: string, newPassword: string) => async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispatch: AppDispatch,
  ) => {
    ensureOk(
      await this.client.postJson('/account/password', {
        oldPassword,
        newPassword,
      }),
    );
  };

  public reloadData = async (dispatch: AppDispatch) => {
    dispatch(setDataState('loading'));
    dispatch(clearRemoteData);
    try {
      const resp = await this.client.get('/purchases');
      ensureOk(resp);
      const json = await resp.json();
      dispatch(
        setRemoteData(jsonConv.toArray(purchaseFromJson, json.purchases)),
      );
      dispatch(setDataState('finished'));
    } catch (e) {
      dispatch(setDataState('failed'));
      throw e;
    }
  };

  private addTags = (names: string[]) => async (
    dispatch: AppDispatch,
    getState: GetState,
  ) => {
    const existing: Tag[] = [];
    const newTags: string[] = [];
    const tagsByName = new Map<string, Tag>();
    for (const tag of Object.values(getState().tags.byId)) {
      tagsByName.set(tag.name, tag);
    }
    for (const name of names) {
      const tag = tagsByName.get(name);
      if (tag) {
        existing.push(tag);
      } else {
        newTags.push(name);
      }
    }
    if (newTags.length > 0) {
      const resp = await this.client.postJson('/tags', { tags: newTags });
      ensureOk(resp);
      const json = await resp.json();
      const tags = jsonConv.toArray(tagFromJson, json.tags);
      existing.push(...tags);
      dispatch(addTags(tags));
    }
    return existing;
  };

  private addProduct = (name: string) => async (
    dispatch: AppDispatch,
    getState: GetState,
  ) => {
    for (const product of Object.values(getState().products.byId)) {
      if (product.name === name) {
        return product;
      }
    }
    const resp = await this.client.postJson('/products', { name });
    ensureOk(resp);
    const product = productFromJson(await resp.json());
    dispatch(addProduct(product));
    return product;
  };

  public addPurchase = (update: PurchaseUpdate) => async (
    dispatch: AppDispatch,
    getState: GetState,
  ) => {
    const tags = await this.addTags(update.tags)(dispatch, getState);
    const product = await this.addProduct(update.product)(dispatch, getState);
    const resp = await this.client.postJson('/purchases', {
      product: product.id,
      date: update.date.format(),
      price: update.price,
      quantity: update.quantity,
      tags: tags.map(t=>t.id),
    });
    ensureOk(resp);
    const respJson = jsonConv.toObject(await resp.json());
    const id = jsonConv.toNumber(respJson.id);
    const purchase = purchaseFromUpdate({ ...update, id }, product, tags);
    dispatch(addPurchase(purchase));
  };

  public updatePurchase = (update: PurchaseUpdate) => async (
    dispatch: AppDispatch,
    getState: GetState,
  ) => {
    const tags = await this.addTags(update.tags)(dispatch, getState);
    const product = await this.addProduct(update.product)(dispatch, getState);
    ensureOk(
      await this.client.patchJson(`/purchases/${update.id}`, {
        product: product.id,
        date: update.date.format(),
        price: update.price,
        quantity: update.quantity,
        tags: tags.map(t => t.id),
      }),
    );
    const purchase = purchaseFromUpdate(update, product, tags);
    dispatch(updatePurchase(purchase));
  };

  public deletePurchase = (id: number) => async (
    dispatch: AppDispatch,
    getState: GetState,
  ) => {
    const p = getState().purchases.byId[id];
    if (!p) {
      throw new Error(`Purchase with id ${id} does not exist`);
    }
    ensureOk(await this.client.delete(`/purchases/${id}`));
    dispatch(deletePurchase(id));
  };

  public restorePurchase = (id: number) => async (dispatch: AppDispatch) => {
    const resp = await this.client.postJson(`/purchases/${id}/restore`, {});
    await ensureOk(resp);
    const [purchase, product, tags] = purchaseFromJson(
      (await resp.json()).purchase,
    );
    dispatch(addTags(tags));
    dispatch(addProduct(product));
    dispatch(addPurchase(purchase));
  };
}

export const ApiContext = React.createContext<Api | null>(null);

export function useApi(loadData = true) {
  const dataState = useAppSelector(getDataState);
  const dispatch = useAppDispatch();
  const api = useContext(ApiContext);
  useEffect(() => {
    if (api && dataState === 'not-started' && loadData) {
      dispatch(api.reloadData);
    }
  });
  if (api === null) {
    throw new Error('Api must not be null');
  }
  return api;
}
