import { action, observable } from 'mobx';
import React, { useContext } from 'react';

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

export class ProductStore {
  @observable public products = new Map<number, Product>();

  @action
  public addById(product: Product) {
    if (!this.products.has(product.id)) {
      this.products.set(product.id, product);
    }
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
