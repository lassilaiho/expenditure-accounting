export default class Api {
  public baseUrl: string = '';

  public defaultHeaders: Record<string, string> = {
    'Authorization': ''
  };

  private _sessionToken: string = '';
  public get sessionToken() { return this._sessionToken; }
  public set sessionToken(value: string) {
    this._sessionToken = value;
    this.defaultHeaders['Authorization'] =
      value === '' ? '' : 'Basic ' + btoa(value);
  }

  public constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
}
