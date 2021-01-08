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

export interface HttpClient {
  get(url: string): Promise<Response>;
  postJson(url: string, body: any): Promise<Response>;
  patchJson(url: string, body: any): Promise<Response>;
  delete(url: string): Promise<Response>;
}

export class FetchHttpClient implements HttpClient {
  public constructor(
    private baseUrl: string,
    private getToken: () => string | null,
  ) {}

  private get defaultHeaders() {
    const token = this.getToken();
    return { Authorization: token === null ? '' : 'Basic ' + btoa(token) };
  }

  public async get(url: string) {
    return apiFetch(this.baseUrl + url, {
      mode: 'cors',
      headers: this.defaultHeaders,
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
      headers: this.defaultHeaders,
    });
  }
}
