import Big from 'big.js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ensureOk } from '../util';
import { AsyncThunk, setDataState } from './store';
import * as jsonConv from './jsonConvert';
import {
  addProduct,
  apiAddProduct,
  getProductById,
  Product,
  productFromJson,
} from './products';
import { addTags, apiAddTags, Tag, tagFromJson } from './tags';
import { RootState } from './store';
import {
  id,
  Collection,
  emptyCollection,
  clearRemoteData,
  RemoteDataSet,
  setRemoteData,
} from './common';

export type Purchase = {
  id: number;
  product: number;
  date: moment.Moment;
  quantity: Big;
  price: Big;
  tags: number[];
};

export function purchaseFromJson(json: any): [Purchase, Product, Tag[]] {
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

export const purchasesSlice = createSlice({
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
export const {
  addPurchase,
  updatePurchase,
  deletePurchase,
} = purchasesSlice.actions;

export const totalPrice = (p: Purchase) => p.quantity.mul(p.price);

export const getPurchaseById = (id: number) => (state: RootState) =>
  state.purchases.byId[id];

export const getPurchases = (state: RootState) =>
  state.purchases.all.map(id => state.purchases.byId[id]);

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

export function apiAddPurchase(update: PurchaseUpdate): AsyncThunk {
  return async (dispatch, getState, inj) => {
    const tags = await apiAddTags(update.tags)(dispatch, getState, inj);
    const product = await apiAddProduct(update.product)(
      dispatch,
      getState,
      inj,
    );
    const resp = await inj.http.postJson('/purchases', {
      product: product.id,
      date: update.date.format(),
      price: update.price,
      quantity: update.quantity,
      tags: tags.map(t => t.id),
    });
    ensureOk(resp);
    const respJson = jsonConv.toObject(await resp.json());
    const id = jsonConv.toNumber(respJson.id);
    const purchase = purchaseFromUpdate({ ...update, id }, product, tags);
    dispatch(addPurchase(purchase));
  };
}

export function apiUpdatePurchase(update: PurchaseUpdate): AsyncThunk {
  return async (dispatch, getState, inj) => {
    const tags = await apiAddTags(update.tags)(dispatch, getState, inj);
    const product = await apiAddProduct(update.product)(
      dispatch,
      getState,
      inj,
    );
    ensureOk(
      await inj.http.patchJson(`/purchases/${update.id}`, {
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
}

export function apiDeletePurchase(id: number): AsyncThunk {
  return async (dispatch, getState, { http }) => {
    const p = getState().purchases.byId[id];
    if (!p) {
      throw new Error(`Purchase with id ${id} does not exist`);
    }
    ensureOk(await http.delete(`/purchases/${id}`));
    dispatch(deletePurchase(id));
  };
}

export function apiRestorePurchase(id: number): AsyncThunk {
  return async (dispatch, _, { http }) => {
    const resp = await http.postJson(`/purchases/${id}/restore`, {});
    await ensureOk(resp);
    const [purchase, product, tags] = purchaseFromJson(
      (await resp.json()).purchase,
    );
    dispatch(addTags(tags));
    dispatch(addProduct(product));
    dispatch(addPurchase(purchase));
  };
}

export const apiReloadData: AsyncThunk = async (dispatch, _, { http }) => {
  dispatch(setDataState('loading'));
  dispatch(clearRemoteData);
  try {
    const resp = await http.get('/purchases');
    ensureOk(resp);
    const json = await resp.json();
    dispatch(setRemoteData(jsonConv.toArray(purchaseFromJson, json.purchases)));
    dispatch(setDataState('finished'));
  } catch (e) {
    dispatch(setDataState('failed'));
    throw e;
  }
};
