export type LoadState =
  | 'not-started'
  | 'loading'
  | 'finished'
  | 'failed';

export class SessionToken {
  public constructor(
    public readonly token: string,
    public readonly expiryTime: Date,
  ) { }

  public static fromJson(json: any): SessionToken | null {
    if (typeof json.token !== 'string'
      || typeof json.expiryTime !== 'string') {
      throw new Error('Invalid json object');
    }
    return new SessionToken(json.token, new Date(json.expiryTime));
  }

  public get isValid() {
    return this.expiryTime.getTime() > Date.now();
  }

  public toJSON(): unknown {
    return {
      token: this.token,
      expiryTime: this.expiryTime.toUTCString(),
    };
  }
}

export default class Api {
  public baseUrl: string = '';

  public defaultHeaders: Record<string, string> = {
    'Authorization': ''
  };

  private _sessionToken: SessionToken | null = null;
  public get sessionToken() { return this._sessionToken; }
  public set sessionToken(token: SessionToken | null) {
    this._sessionToken = token;
    this.defaultHeaders['Authorization'] =
      token === null ? '' : 'Basic ' + btoa(token.token);
  }

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async get(url: string) {
    return fetch(this.baseUrl + url, {
      mode: 'cors',
      headers: { ...this.defaultHeaders },
    });
  }

  public async postJson(url: string, body: any) {
    return fetch(this.baseUrl + url, {
      mode: 'cors',
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  public async patchJson(url: string, body: any) {
    return fetch(this.baseUrl + url, {
      mode: 'cors',
      method: 'PATCH',
      headers: {
        ...this.defaultHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  public async delete(url: string) {
    return fetch(this.baseUrl + url, {
      mode: 'cors',
      method: 'DELETE',
      headers: { ...this.defaultHeaders },
    });
  }
}
