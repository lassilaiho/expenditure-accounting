import { action, observable, runInAction } from 'mobx';
import React, { useContext } from 'react';

import { Tag, TagStore } from './tags';

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

export class ProductStore {
  @observable public products = new Map<number, Product>();

  public constructor(private tagStore: TagStore) { }

  @action
  public addById(product: Product) {
    if (!this.products.has(product.id)) {
      this.products.set(product.id, product);
    }
  }

  public getById(id: number): Product | null {
    return this.products.get(id) ?? null;
  }

  public async fetchTags() {
    const tagsByProduct = await this.tagStore.getTagsByProduct();
    runInAction(() => {
      for (const [id, tags] of tagsByProduct) {
        const product = this.products.get(id);
        if (product) {
          product.tags = tags;
        }
      }
    });
  }
}

export const ProductStoreContext =
  React.createContext<ProductStore | null>(null);

export function useProducts() {
  const store = useContext(ProductStoreContext);
  if (store === null) {
    throw new Error('ProductStore must not be null');
  }
  return store;
}
