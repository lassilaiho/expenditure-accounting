import { action, observable, runInAction } from 'mobx';
import React, { useContext } from 'react';

import Api, { LoadState } from './api';
import { ensureOk } from './util';

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

export class TagStore {
  @observable public dataState: LoadState = 'not-started';
  @observable public tagsById = new Map<number, Tag>();

  public constructor(private api: Api) { }

  @action
  public async getTagsByProduct(): Promise<Map<number, Tag[]>> {
    try {
      this.dataState = 'loading';
      const r = await this.api.get('/products/tags');
      ensureOk(r);
      const respData = (await r.json()).tagsByProduct;
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
      this.dataState = 'finished';
      return tagsByProduct;
    } catch (e) {
      runInAction(() => this.dataState = 'failed');
      throw e;
    }
  }
}

export const TagStoreContext =
  React.createContext<TagStore | null>(null);

export function useTags() {
  const store = useContext(TagStoreContext);
  if (store === null) {
    throw new Error('TagStore must not be null');
  }
  return store;
}
