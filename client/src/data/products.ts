import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ensureOk } from '../util';
import { AsyncThunk } from './store';
import * as jsonConv from './jsonConvert';
import { RootState } from './store';
import {
  emptyCollection,
  clearRemoteData,
  RemoteDataSet,
  setRemoteData,
} from './common';

export type Product = { id: number; name: string };

export function productFromJson(json: any): Product {
  jsonConv.toObject(json);
  return { id: jsonConv.toNumber(json.id), name: jsonConv.toString(json.name) };
}

export const productsSlice = createSlice({
  name: 'products',
  initialState: emptyCollection<Product>(),
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
export const { addProduct } = productsSlice.actions;

export const getProductsById = (state: RootState) => state.products.byId;

export const getProductById = (id: number) => (state: RootState) =>
  state.products.byId[id];

export const getProducts = createSelector(getProductsById, byId =>
  Object.values(byId),
);

export function apiAddProduct(name: string): AsyncThunk<Product> {
  return async (dispatch, getState, { http }) => {
    for (const product of Object.values(getState().products.byId)) {
      if (product.name === name) {
        return product;
      }
    }
    const resp = await http.postJson('/products', { name });
    ensureOk(resp);
    const product = productFromJson(await resp.json());
    dispatch(addProduct(product));
    return product;
  };
}
