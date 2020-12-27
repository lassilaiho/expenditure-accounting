import Big from 'big.js';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import moment from 'moment';
import React, { useContext } from 'react';

import { ensureOk } from '../util';
import Api, { LoadState } from './api';
import * as jsonConv from './jsonConvert';

export class Tag {
  public id: number;
  public name: string;

  public constructor(id: number, name: string) {
    makeObservable(this, {
      id: observable,
      name: observable,
    });
    this.id = id;
    this.name = name;
  }

  public static fromJson(json: any) {
    jsonConv.toObject(json);
    return new Tag(jsonConv.toNumber(json.id), jsonConv.toString(json.name));
  }

  public lowerCaseMatch(s: string) {
    return this.name.toLocaleLowerCase().includes(s);
  }
}

export class Purchase {
  public id: number;
  public product: Product;
  public date: moment.Moment;
  public quantity: Big;
  public price: Big;
  public get totalPrice() {
    return this.quantity.mul(this.price);
  }
  public tags: Tag[];
  public get tagsSortedByName() {
    return this.tags.slice().sort((a, b) => {
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
  }

  public constructor(
    id: number,
    product: Product,
    date: moment.Moment,
    quantity: Big,
    price: Big,
    tags: Tag[],
  ) {
    makeObservable(this, {
      id: observable,
      product: observable,
      date: observable.ref,
      quantity: observable.ref,
      price: observable.ref,
      totalPrice: computed,
      tags: observable,
      tagsSortedByName: computed,
    });
    this.id = id;
    this.product = product;
    this.date = date;
    this.quantity = quantity;
    this.price = price;
    this.tags = tags;
  }

  public static fromJson(json: any) {
    jsonConv.toObject(json);
    return new Purchase(
      jsonConv.toNumber(json.id),
      Product.fromJson(json.product),
      jsonConv.toMomentUtc(json.date),
      jsonConv.toBig(json.quantity),
      jsonConv.toBig(json.price),
      jsonConv.toArray(Tag.fromJson, json.tags),
    );
  }

  public lowerCaseMatch(s: string) {
    return (
      this.product.lowerCaseMatch(s) || this.tags.some(t => t.lowerCaseMatch(s))
    );
  }
}

export class Product {
  public id: number;
  public name: string;

  public constructor(id: number, name: string) {
    makeObservable(this, {
      id: observable,
      name: observable,
    });
    this.id = id;
    this.name = name;
  }

  public static fromJson(json: any) {
    jsonConv.toObject(json);
    return new Product(
      jsonConv.toNumber(json.id),
      jsonConv.toString(json.name),
    );
  }

  public lowerCaseMatch(s: string) {
    return this.name.toLocaleLowerCase().includes(s);
  }
}

export class Store {
  public dataState: LoadState = 'not-started';
  public purchases: Purchase[] = [];
  public get purchasesById() {
    const map = new Map<number, Purchase>();
    for (const p of this.purchases) {
      map.set(p.id, p);
    }
    return map;
  }
  public tagsById = new Map<number, Tag>();
  public get tags() {
    const tags: Tag[] = [];
    for (const tag of this.tagsById.values()) {
      tags.push(tag);
    }
    return tags;
  }
  private get tagsByName() {
    const map = new Map<string, Tag>();
    for (const tag of this.tagsById.values()) {
      map.set(tag.name.toLowerCase(), tag);
    }
    return map;
  }
  public productsById = new Map<number, Product>();
  public get products() {
    const products: Product[] = [];
    for (const product of this.productsById.values()) {
      products.push(product);
    }
    return products;
  }
  private get productsByName() {
    const map = new Map<string, Product>();
    for (const product of this.productsById.values()) {
      map.set(product.name.toLowerCase(), product);
    }
    return map;
  }

  public constructor(private api: Api) {
    makeObservable<
      Store,
      | 'tagsByName'
      | 'productsByName'
      | 'parsePurchaseJson'
      | 'parsePurchasesJson'
    >(this, {
      dataState: observable,
      purchases: observable,
      purchasesById: computed,
      tagsById: observable,
      tags: computed,
      tagsByName: computed,
      productsById: observable,
      products: computed,
      productsByName: computed,
      addTags: action,
      reloadData: action,
      parsePurchasesJson: action,
      parsePurchaseJson: action,
      restorePurchase: action,
    });
  }

  public async updatePurchase(id: number) {
    const purchase = this.purchasesById.get(id);
    if (purchase) {
      ensureOk(
        await this.api.patchJson(`/purchases/${purchase.id}`, {
          product: purchase.product.id,
          date: purchase.date.format(),
          price: purchase.price,
          quantity: purchase.quantity,
          tags: purchase.tags.map(t => t.id),
        }),
      );
    } else {
      throw new Error(`No purchase with id: ${id}`);
    }
  }

  public async addTags(names: string[]) {
    const newTags: string[] = [];
    const result: Tag[] = [];
    for (const name of names) {
      const tag = this.getTagByName(name);
      if (tag === undefined) {
        newTags.push(name);
      } else {
        result.push(tag);
      }
    }
    if (newTags.length > 0) {
      const resp = await this.api.postJson('/tags', { tags: newTags });
      ensureOk(resp);
      const respJson = await resp.json();
      runInAction(() => {
        for (const tagJson of respJson.tags) {
          const tag = Tag.fromJson(tagJson);
          this.tagsById.set(tag.id, tag);
          result.push(tag);
        }
      });
    }
    return result;
  }

  public async addProduct(name: string) {
    const product = this.getProductByName(name);
    if (product === undefined) {
      const resp = await this.api.postJson('/products', { name });
      ensureOk(resp);
      const product = Product.fromJson(await resp.json());
      runInAction(() => this.productsById.set(product.id, product));
      return product;
    }
    return product;
  }

  public async addPurchase(purchase: Purchase) {
    const resp = await this.api.postJson('/purchases', {
      product: purchase.product.id,
      date: purchase.date.format(),
      price: purchase.price,
      quantity: purchase.quantity,
      tags: purchase.tags.map(t => t.id),
    });
    ensureOk(resp);
    const respJson = jsonConv.toObject(await resp.json());
    const id = jsonConv.toNumber(respJson.id);
    runInAction(() => {
      purchase.id = id;
      for (let i = 0; i < this.purchases.length; i++) {
        if (purchase.date > this.purchases[i].date) {
          this.purchases.splice(i, 0, purchase);
          return;
        }
      }
      this.purchases.splice(this.purchases.length, 0, purchase);
    });
  }

  public async deletePurchase(id: number) {
    const i = this.purchases.findIndex(p => p.id === id);
    if (i < 0) {
      throw new Error(`Purchase with id ${id} does not exist`);
    }
    ensureOk(await this.api.delete(`/purchases/${id}`));
    runInAction(() => this.purchases.splice(i, 1));
  }

  public async restorePurchase(id: number) {
    const resp = await this.api.postJson(`/purchases/${id}/restore`, {});
    await ensureOk(resp);
    const purchase = this.parsePurchaseJson((await resp.json()).purchase);
    runInAction(() => {
      for (let i = 0; i < this.purchases.length; i++) {
        if (purchase.date > this.purchases[i].date) {
          this.purchases.splice(i, 0, purchase);
          return;
        }
      }
      this.purchases.splice(this.purchases.length, 0, purchase);
    });
  }

  public async getLatestPurchaseByProduct(productName: string) {
    productName = productName.toLocaleLowerCase();
    return (
      this.purchases.find(p => p.product.lowerCaseMatch(productName)) ?? null
    );
  }

  private getTagByName(name: string) {
    return this.tagsByName.get(name.toLowerCase());
  }

  private getProductByName(name: string) {
    return this.productsByName.get(name.toLowerCase());
  }

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
        this.parsePurchasesJson(json);
        this.dataState = 'finished';
      });
    } catch (e) {
      runInAction(() => (this.dataState = 'failed'));
      throw e;
    }
  }

  private parsePurchasesJson(data: any) {
    const purchases = data.purchases;
    if (!Array.isArray(purchases)) {
      throw new Error('Invalid response json');
    }
    for (const obj of purchases) {
      this.purchases.push(this.parsePurchaseJson(obj));
    }
  }

  private parsePurchaseJson(data: any) {
    const purchase = Purchase.fromJson(data);
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
    return purchase;
  }
}

export const StoreContext = React.createContext<Store | null>(null);

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
