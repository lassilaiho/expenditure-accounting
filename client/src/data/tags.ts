import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector, defaultMemoize } from 'reselect';

import { ensureOk, flip } from '../util';
import { AsyncThunk } from './store';
import * as jsonConv from './jsonConvert';
import { RootState } from './store';
import { clearRemoteData, RemoteDataSet, setRemoteData } from './common';

export type Tag = { id: number; name: string };

type Collection = {
  byId: { [id: number]: Tag };
  byName: { [name: string]: number };
};

const emptyCollection: Collection = { byId: {}, byName: {} };

export function tagFromJson(json: any): Tag {
  jsonConv.toObject(json);
  return { id: jsonConv.toNumber(json.id), name: jsonConv.toString(json.name) };
}

export const tagsSlice = createSlice({
  name: 'tags',
  initialState: emptyCollection,
  reducers: {
    addTags(state, action: PayloadAction<Tag[]>) {
      for (const tag of action.payload) {
        if (!state.byName[tag.name]) {
          state.byId[tag.id] = tag;
          state.byName[tag.name] = tag.id;
        }
      }
    },
  },
  extraReducers: {
    [clearRemoteData.type]: () => emptyCollection,
    [setRemoteData.type]: (state, action: PayloadAction<RemoteDataSet>) => {
      const {
        actions: { addTags },
        caseReducers: { addTags: reduce },
      } = tagsSlice;
      for (const data of action.payload) {
        reduce(state, addTags(data[2]));
      }
    },
  },
});
export const { addTags } = tagsSlice.actions;

export const getTags = createSelector(
  (state: RootState) => state.tags.byId,
  byId => Object.values(byId),
);

export const getTagsById = (state: RootState) => state.tags.byId;

const getTagByName = (name: string, state: RootState) =>
  state.tags.byId[state.tags.byName[name]] ?? null;

export const getTagsSortedByName = flip(
  createSelector(
    (state: RootState) => state.tags.byId,
    byId =>
      defaultMemoize((ids: number[]) =>
        ids
          .map(id => byId[id])
          .sort((a, b) => {
            const aName = a.name.toLocaleLowerCase();
            const bName = b.name.toLocaleLowerCase();
            return aName < bName ? -1 : aName > bName ? 1 : 0;
          }),
      ),
  ),
);

export function apiAddTags(names: string[]): AsyncThunk<Tag[]> {
  return async (dispatch, getState, { http }) => {
    const existing: Tag[] = [];
    const newTags: string[] = [];
    for (const name of names) {
      const tag = getTagByName(name, getState());
      if (tag) {
        existing.push(tag);
      } else {
        newTags.push(name);
      }
    }
    if (newTags.length > 0) {
      const resp = await http.postJson('/tags', { tags: newTags });
      ensureOk(resp);
      const json = await resp.json();
      const tags = jsonConv.toArray(tagFromJson, json.tags);
      existing.push(...tags);
      dispatch(addTags(tags));
    }
    return existing;
  };
}
