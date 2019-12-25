import { action, computed, observable, runInAction } from 'mobx';
import React, { useContext } from 'react';

import { ensureOk } from '../util';
import Api, { SessionToken } from './api';

export class AuthError extends Error { }

export type SessionState =
  | 'logged-out'
  | 'logged-in'
  | 'expired';

export class Session {
  @observable
  public currentEmail = '';
  @computed
  public get isLoggedIn() { return this.state === 'logged-in'; }
  @observable
  private _state: SessionState = 'logged-out';
  @computed
  public get state() { return this._state; }

  @action
  private updateState() {
    if (this.api.sessionToken === null) {
      this._state = 'logged-out';
    } else if (this.api.sessionToken.isValid) {
      this._state = 'logged-in';
    } else {
      this._state = 'expired';
    }
  }

  public constructor(private api: Api) { }

  public static fromLocalStorage(api: Api) {
    const session = new Session(api);
    try {
      const storedString = localStorage.getItem('session');
      if (storedString !== null) {
        const json = JSON.parse(storedString);
        session.currentEmail = json.currentEmail ?? '';
        api.sessionToken = json.sessionToken
          ? SessionToken.fromJson(json.sessionToken)
          : null;
        session.updateState();
      }
    } catch (e) {
      console.error(e);
    }
    return session;
  }

  public async login(email: string, password: string) {
    const r = await this.api.postJson('/login', { email, password });
    if (r.status === 401) {
      throw new AuthError();
    }
    ensureOk(r);
    this.api.sessionToken = SessionToken.fromJson(await r.json());
    runInAction(() => {
      this.updateState();
      this.currentEmail = email;
      this.persistInLocalStorage();
    });
  }

  public async logout() {
    const r = await this.api.postJson('/logout', {});
    ensureOk(r);
    this.api.sessionToken = null;
    runInAction(() => {
      this.updateState();
      this.currentEmail = '';
      this.persistInLocalStorage();
    });
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    ensureOk(await this.api.postJson('/account/password', {
      oldPassword, newPassword,
    }));
  }

  private persistInLocalStorage() {
    localStorage.setItem('session', JSON.stringify({
      currentEmail: this.currentEmail,
      sessionToken: this.api.sessionToken,
    }));
  }
}

export const SessionContext = React.createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error('Session must not be null');
  }
  return session;
}
