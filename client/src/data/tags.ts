import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ensureOk } from '../util';
import { AsyncThunk } from './store';
import * as jsonConv from './jsonConvert';
import { RootState } from './store';
import {
  id,
  Collection,
  emptyCollection,
  clearRemoteData,
  RemoteDataSet,
  setRemoteData,
} from './common';

export type Tag = { id: number; name: string };

export function tagFromJson(json: any): Tag {
  jsonConv.toObject(json);
  return { id: jsonConv.toNumber(json.id), name: jsonConv.toString(json.name) };
}

export const tagsSlice = createSlice({
  name: 'tags',
  initialState: id<Collection<Tag>>({ byId: {}, all: [] }),
  reducers: {
    addTags(state, action: PayloadAction<Tag[]>) {
      for (const tag of action.payload) {
        if (!state.byId[tag.id]) {
          state.all.push(tag.id);
          state.byId[tag.id] = tag;
        }
      }
    },
  },
  extraReducers: {
    [clearRemoteData.type]: emptyCollection,
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

export const getTags = (state: RootState) =>
  state.tags.all.map(id => state.tags.byId[id]);

export const getTagsById = (state: RootState) => state.tags.byId;

export const getTagsSortedByName = (ids: number[]) => (state: RootState) => {
  const tags = ids.map(id => state.tags.byId[id]);
  return tags.sort((a, b) => {
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
};

export function apiAddTags(names: string[]): AsyncThunk<Tag[]> {
  return async (dispatch, getState, { http }) => {
    const existing: Tag[] = [];
    const newTags: string[] = [];
    const tagsByName = new Map<string, Tag>();
    for (const tag of Object.values(getState().tags.byId)) {
      tagsByName.set(tag.name, tag);
    }
    for (const name of names) {
      const tag = tagsByName.get(name);
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
