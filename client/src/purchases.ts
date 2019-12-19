import { action, computed, observable, runInAction } from 'mobx';
import React, { useContext } from 'react';

import Api, { LoadState } from './api';
import { Product, ProductStore } from './product';
import { ensureOk } from './util';

export class Purchase {
  @observable public id: number;
  @observable public product: Product;
  @observable public date: Date;
  @observable public quantity: number;
  @observable public price: number;
  @computed public get totalPrice() { return this.quantity * this.price; }

  public constructor(
    id: number,
    product: Product,
    date: Date,
    quantity: number,
    price: number,
  ) {
    this.id = id;
    this.product = product;
    this.date = date;
    this.quantity = quantity;
    this.price = price;
  }

  public static fromJson(json: any) {
    if (typeof json.id !== 'number'
      || typeof json.product !== 'object'
      || typeof json.date !== 'string'
      || typeof json.quantity !== 'number'
      || typeof json.price !== 'number') {
      throw new Error('Invalid json object');
    }
    return new Purchase(
      json.id,
      Product.fromJsonNoTags(json.product),
      new Date(json.date),
      json.quantity,
      json.price,
    );
  }
}

export class PurchaseStore {
  @observable public dataState: LoadState = 'not-started';
  @observable public purchases: Purchase[] = [];

  public constructor(
    private api: Api,
    private productStore: ProductStore,
  ) { }

  @action
  public async getPurchases() {
    try {
      this.dataState = 'loading';
      const r = await this.api.get('/purchases');
      ensureOk(r);
      const purchases = (await r.json()).purchases;
      if (!Array.isArray(purchases)) {
        throw new Error('Invalid response json');
      }
      runInAction(() => {
        for (const obj of purchases) {
          const purchase = Purchase.fromJson(obj);
          const product = this.productStore.getById(purchase.product.id);
          if (product) {
            purchase.product = product;
          } else {
            this.productStore.addById(purchase.product);
          }
          this.purchases.push(purchase);
        }
        this.dataState = 'finished';
      });
    } catch (e) {
      runInAction(() => this.dataState = 'failed');
      throw e;
    }
  }
}

export const PurchaseStoreContext =
  React.createContext<PurchaseStore | null>(null);

export function usePurchases() {
  const store = useContext(PurchaseStoreContext);
  if (store === null) {
    throw new Error('PurchaseStore must not be null');
  }
  return store;
}
