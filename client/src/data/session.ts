import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment';
import { useEffect } from 'react';

import { ensureOk } from '../util';
import { AsyncThunk, AuthError } from './store';
import * as jsonConv from './jsonConvert';
import { RootState, AppStore } from './store';
import { id } from './common';

export type Session =
  | { state: 'logged-out' }
  | {
      state: 'logged-in';
      token: string;
      email: string;
      expiryTime: moment.Moment;
    };

function sessionFromJson(json: any): Session {
  jsonConv.toObject(json);
  if (json.state === 'logged-out') {
    return { state: 'logged-out' };
  }
  if (json.state !== 'logged-in') {
    throw new Error('invalid session state: ' + json.state);
  }
  return {
    state: 'logged-in',
    email: jsonConv.toString(json.email),
    token: jsonConv.toString(json.token),
    expiryTime: jsonConv.toMomentUtc(json.expiryTime),
  };
}

export type LoginData = Omit<
  Exclude<Session, { state: 'logged-out' }>,
  'state'
>;

export const sessionSlice = createSlice({
  name: 'session',
  initialState: id<Session>({ state: 'logged-out' }),
  reducers: {
    login: (state, action: PayloadAction<LoginData>) => ({
      ...action.payload,
      state: 'logged-in',
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout: state => ({ state: 'logged-out' }),
  },
});

export const { login, logout } = sessionSlice.actions;

export const getSession = (state: RootState) => state.session;

export const getIsLoggedIn = (state: RootState) =>
  state.session.state === 'logged-in';

export const getCurrentEmail = (state: RootState) =>
  state.session.state === 'logged-in' ? state.session.email : '';

export const getSessionToken = (state: RootState) =>
  state.session.state === 'logged-in' ? state.session.token : null;

export function useLocalStorageSession(store: AppStore) {
  useEffect(() => {
    let prevSession: Session | undefined;
    const unsubscribe = store.subscribe(() => {
      const session = getSession(store.getState());
      if (session !== prevSession) {
        localStorage.setItem('session', JSON.stringify(session));
        prevSession = session;
      }
    });

    try {
      const json = localStorage.getItem('session') ?? '';
      const session = sessionFromJson(JSON.parse(json));
      store.dispatch(
        session.state === 'logged-in' && session.expiryTime > moment.utc()
          ? login(session)
          : logout,
      );
    } catch (e) {
      console.error(e);
    }

    return unsubscribe;
  }, []);
}

export function apiLogin(email: string, password: string): AsyncThunk {
  return async (dispatch, _, { http }) => {
    const r = await http.postJson('/login', { email, password });
    if (r.status === 401) {
      throw new AuthError();
    }
    ensureOk(r);
    const respData = jsonConv.toObject(await r.json());
    dispatch(
      login({
        email,
        token: jsonConv.toString(respData.token),
        expiryTime: jsonConv.toMomentUtc(respData.expiryTime),
      }),
    );
  };
}

export const apiLogout: AsyncThunk = async (dispatch, _, { http }) => {
  const r = await http.postJson('/logout', {});
  ensureOk(r);
  dispatch(logout);
};

export function apiChangePassword(
  oldPassword: string,
  newPassword: string,
): AsyncThunk {
  return async (_, __, { http }) => {
    ensureOk(
      await http.postJson('/account/password', {
        oldPassword,
        newPassword,
      }),
    );
  };
}
