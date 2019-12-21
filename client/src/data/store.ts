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
    const date = new Date(json.date);
    return new Purchase(
      json.id,
      Product.fromJsonNoTags(json.product),
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      json.quantity,
      json.price,
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
  @observable public tags: Tag[];

  public constructor(id: number, name: string, tags: Tag[]) {
    this.id = id;
    this.name = name;
    this.tags = tags;
  }

  public static fromJsonNoTags(json: any) {
    if (typeof json.id !== 'number'
      || typeof json.name !== 'string') {
      throw new Error('Invalid json object');
    }
    return new Product(json.id, json.name, []);
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

      const [purchasesResp, tagResp] = await Promise.all([
        this.api.get('/purchases'),
        this.api.get('/products/tags'),
      ]);
      ensureOk(purchasesResp);
      ensureOk(tagResp);

      const [purchasesJson, tagsJson] = await Promise.all([
        purchasesResp.json(),
        tagResp.json(),
      ]);
      runInAction(() => {
        this.parsePurchaseJson(purchasesJson);
        const tagsByProduct = this.parseTagsJson(tagsJson);
        for (const [id, tags] of tagsByProduct) {
          const product = this.productsById.get(id);
          if (product) {
            product.tags = tags;
          }
        }
        this.dataState = 'finished';
      });
    } catch (e) {
      runInAction(() => this.dataState = 'failed');
      throw e;
    }
  }

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
      this.purchases.push(purchase);
    }
  }

  private parseTagsJson(data: any): Map<number, Tag[]> {
    const respData = data.tagsByProduct;
    if (typeof respData !== 'object') {
      throw new Error('Invalid response json');
    }
    const tagsByProduct = new Map<number, Tag[]>();
    for (const idStr in respData) {
      const productId = parseInt(idStr, 10);
      if (isNaN(productId)) {
        throw new Error('Invalid response json');
      }
      const tags: Tag[] = [];
      for (const tagObj of respData[productId]) {
        let tag = Tag.fromJson(tagObj);
        if (this.tagsById.has(tag.id)) {
          tag = this.tagsById.get(tag.id) as Tag;
        } else {
          this.tagsById.set(tag.id, tag);
        }
        tags.push(tag);
      }
      tagsByProduct.set(productId, tags);
    }
    return tagsByProduct;
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
