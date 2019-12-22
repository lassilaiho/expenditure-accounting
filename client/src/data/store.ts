import { action, computed, observable, runInAction } from 'mobx';
import React, { useContext } from 'react';

import { ensureOk } from '../util';
import Api, { LoadState } from './api';

export class Tag {
  @observable public id: number;
  @observable public name: string;

  public constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  public static fromJson(json: any) {
    if (typeof json.id !== 'number'
      || typeof json.name !== 'string') {
      throw new Error('Invalid json object');
    }
    return new Tag(json.id, json.name);
  }
}

export class Purchase {
  @observable public id: number;
  @observable public product: Product;
  @observable public date: Date;
  @observable public quantity: number;
  @observable public price: number;
  @computed public get totalPrice() { return this.quantity * this.price; }
  @observable public tags: Tag[];
  @computed public get tagsSortedByName() {
    return this.tags.slice().sort((a, b) => {
      const aName = a.name.toLocaleLowerCase();
      const bName = b.name.toLocaleLowerCase();
      if (aName < bName) { return -1; }
      if (aName > bName) { return 1; }
      return 0;
    });
  }

  public constructor(
    id: number,
    product: Product,
    date: Date,
    quantity: number,
    price: number,
    tags: Tag[],
  ) {
    this.id = id;
    this.product = product;
    this.date = date;
    this.quantity = quantity;
    this.price = price;
    this.tags = tags;
  }

  public static fromJson(json: any) {
    if (typeof json.id !== 'number'
      || typeof json.product !== 'object'
      || typeof json.date !== 'string'
      || typeof json.quantity !== 'number'
      || typeof json.price !== 'number'
      || !Array.isArray(json.tags)) {
      throw new Error('Invalid json object');
    }
    const date = new Date(json.date);
    return new Purchase(
      json.id,
      Product.fromJson(json.product),
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      json.quantity,
      json.price,
      json.tags.map(Tag.fromJson),
    );
  }

  public static orderByDate(a: Purchase, b: Purchase) {
    if (a.date < b.date) { return -1; }
    if (a.date > b.date) { return 1; }
    return 0;
  }
}

export class Product {
  @observable public id: number;
  @observable public name: string;

  public constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  public static fromJson(json: any) {
    if (typeof json.id !== 'number'
      || typeof json.name !== 'string') {
      throw new Error('Invalid json object');
    }
    return new Product(json.id, json.name);
  }
}

export class Store {
  @observable public dataState: LoadState = 'not-started';
  @observable public purchases: Purchase[] = [];
  @observable public tagsById = new Map<number, Tag>();
  @observable public productsById = new Map<number, Product>();

  public constructor(private api: Api) { }

  @action
  public async reloadData() {
    try {
      this.dataState = 'loading';
      this.purchases.length = 0;
      this.tagsById.clear();
      this.productsById.clear();

      const resp = await this.api.get('/purchases');
      ensureOk(resp);

      const json = await resp.json();
      runInAction(() => {
        this.parsePurchaseJson(json);
        this.dataState = 'finished';
      });
    } catch (e) {
      runInAction(() => this.dataState = 'failed');
      throw e;
    }
  }

  @action
  private parsePurchaseJson(data: any) {
    const purchases = data.purchases;
    if (!Array.isArray(purchases)) {
      throw new Error('Invalid response json');
    }
    for (const obj of purchases) {
      const purchase = Purchase.fromJson(obj);
      const product = this.productsById.get(purchase.product.id);
      if (product) {
        purchase.product = product;
      } else {
        this.productsById.set(purchase.product.id, purchase.product);
      }
      for (let i = 0; i < purchase.tags.length; i++) {
        const currentTag = purchase.tags[i];
        const existingTag = this.tagsById.get(currentTag.id);
        if (existingTag) {
          purchase.tags[i] = existingTag;
        } else {
          this.tagsById.set(currentTag.id, currentTag);
        }
      }
      this.purchases.push(purchase);
    }
  }
}

export const StoreContext =
  React.createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (store === null) {
    throw new Error('Store must not be null');
  }
  if (store.dataState === 'not-started') {
    store.reloadData();
  }
  return store;
}
