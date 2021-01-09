import Big from 'big.js';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector, defaultMemoize } from 'reselect';

import { ensureOk, flip } from '../util';
import { AsyncThunk, setDataState } from './store';
import * as jsonConv from './jsonConvert';
import {
  addProduct,
  apiAddProduct,
  getProductsById,
  Product,
  productFromJson,
} from './products';
import { addTags, apiAddTags, getTagsById, Tag, tagFromJson } from './tags';
import { RootState } from './store';
import { clearRemoteData, RemoteDataSet, setRemoteData } from './common';

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

type Collection = {
  byId: { [id: number]: Purchase };
};

const emptyCollection: Collection = { byId: {} };

export const purchasesSlice = createSlice({
  name: 'purchases',
  initialState: emptyCollection,
  reducers: {
    addPurchase(state, action: PayloadAction<Purchase>) {
      const purchase = action.payload;
      if (!state.byId[purchase.id]) {
        state.byId[purchase.id] = purchase;
      }
    },
    updatePurchase(state, action: PayloadAction<Purchase>) {
      state.byId[action.payload.id] = action.payload;
    },
    deletePurchase(state, action: PayloadAction<number>) {
      delete state.byId[action.payload];
    },
  },
  extraReducers: {
    [clearRemoteData.type]: () => emptyCollection,
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

export const getPurchases = createSelector(
  (state: RootState) => state.purchases.byId,
  byId =>
    Object.values(byId).sort((a, b) => b.date.valueOf() - a.date.valueOf()),
);

export const getFilteredPurchases = flip(
  createSelector(
    [getPurchases, getProductsById, getTagsById],
    (purchases, products, tags) =>
      defaultMemoize((filter: string) => {
        filter = filter.toLocaleLowerCase();
        const result: Purchase[] = [];
        for (const purchase of purchases) {
          const product = products[purchase.product];
          if (product.name.toLocaleLowerCase().includes(filter)) {
            result.push(purchase);
            continue;
          }
          for (const tagId of purchase.tags) {
            const tag = tags[tagId];
            if (tag.name.toLocaleLowerCase().includes(filter)) {
              result.push(purchase);
              break;
            }
          }
        }
        return result;
      }),
  ),
);

export const getLatestPurchaseByProduct = flip(
  createSelector([getPurchases, getProductsById], (purchases, products) =>
    defaultMemoize((productName: string) => {
      productName = productName.toLocaleLowerCase();
      for (const purchase of purchases) {
        const product = products[purchase.product];
        if (product.name.toLocaleLowerCase().includes(productName)) {
          return purchase;
        }
      }
      return null;
    }),
  ),
);

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
