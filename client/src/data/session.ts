import { observable, runInAction, computed } from 'mobx';
import React, { useContext } from 'react';

import Api from './api';
import { ensureOk } from '../util';

export class Session {
  @observable
  public currentEmail = '';
  @computed
  public get isLoggedIn() { return this.currentEmail !== ''; }

  public constructor(private api: Api) { }

  public static fromLocalStorage(api: Api) {
    const session = new Session(api);
    try {
      const storedString = localStorage.getItem('session');
      if (storedString !== null) {
        const storedValues = JSON.parse(storedString);
        session.currentEmail = storedValues.currentEmail ?? '';
        api.sessionToken = storedValues.sessionToken ?? '';
      }
    } catch (e) {
      console.error(e);
    }
    return session;
  }

  public async login(email: string, password: string) {
    const r = await this.api.postJson('/login', { email, password });
    ensureOk(r);
    const token = (await r.json()).token;
    if (typeof token === 'string') {
      this.api.sessionToken = token;
      runInAction(() => {
        this.currentEmail = email;
        this.persistInLocalStorage();
      });
    } else {
      throw new Error('Invalid response');
    }
  }

  public async logout() {
    const r = await this.api.postJson('/logout', {});
    ensureOk(r);
    this.api.sessionToken = '';
    runInAction(() => {
      this.currentEmail = '';
      this.persistInLocalStorage();
    });
  }

  public persistInLocalStorage() {
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
