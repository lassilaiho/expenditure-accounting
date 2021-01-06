export class ConnectionError extends Error {
  public readonly name = 'ConnectionError';

  public get message() {
    return this.cause.message;
  }

  public constructor(public readonly cause: Error, ...params: any[]) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError);
    }
  }
}

async function apiFetch(input: RequestInfo, init?: RequestInit | undefined) {
  try {
    return await fetch(input, init);
  } catch (e) {
    if (e instanceof Error) {
      throw new ConnectionError(e);
    }
    throw e;
  }
}

export default class HttpClient {
  public baseUrl = '';

  public defaultHeaders: Record<string, string> = {
    Authorization: '',
  };

  private _sessionToken: string | null = null;
  public get sessionToken() {
    return this._sessionToken;
  }
  public set sessionToken(token: string | null) {
    this._sessionToken = token;
    this.defaultHeaders['Authorization'] =
      token === null ? '' : 'Basic ' + btoa(token);
  }

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async get(url: string) {
    return apiFetch(this.baseUrl + url, {
      mode: 'cors',
      headers: { ...this.defaultHeaders },
    });
  }

  public async postJson(url: string, body: any) {
    return apiFetch(this.baseUrl + url, {
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
    return apiFetch(this.baseUrl + url, {
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
    return apiFetch(this.baseUrl + url, {
      mode: 'cors',
      method: 'DELETE',
      headers: { ...this.defaultHeaders },
    });
  }
}
