import { createAction } from '@reduxjs/toolkit';

import { Product } from './products';
import { Purchase } from './purchases';
import { Tag } from './tags';

export type Collection<T> = {
  byId: { [id: number]: T };
  all: number[];
};

export function emptyCollection<T>(): Collection<T> {
  return { byId: {}, all: [] };
}

export const id = <T>(x: T) => x;

export const clearRemoteData = createAction('clearRemoteData');
export type RemoteDataSet = [Purchase, Product, Tag[]][];
export const setRemoteData = createAction<RemoteDataSet>('setRemoteData');
