import Api from './api';

export type FakeResponse = (
  method: string,
  url: string,
  body?: any,
) => Promise<Response>;

export class FakeApi extends Api {
  public constructor(private fakeResponse: FakeResponse) {
    super('');
  }

  public async get(url: string) {
    return this.fakeResponse('get', url);
  }

  public async postJson(url: string, body: any) {
    return this.fakeResponse('post', url, body);
  }

  public async patchJson(url: string, body: any) {
    return this.fakeResponse('patch', url, body);
  }

  public async delete(url: string) {
    return this.fakeResponse('delete', url);
  }
}

function jsonResponse(body: any) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  });
}

const tags = [
  {
    id: 1,
    name: 'tag 1',
  },
  {
    id: 2,
    name: 'tag 2',
  },
  {
    id: 3,
    name: 'tag 3',
  },
];
const products = [
  {
    id: 1,
    name: 'product 1',
  },
  {
    id: 2,
    name: 'product 2',
  },
];
const purchases = [
  {
    id: 1,
    product: products[0],
    date: '2020-03-14',
    quantity: '1.0',
    price: '2.0',
    tags: [tags[0], tags[2]],
  },
  {
    id: 2,
    product: products[0],
    date: '2020-01-14',
    quantity: '10',
    price: '13.2',
    tags: [tags[2]],
  },
  {
    id: 3,
    product: products[1],
    date: '2020-03-14',
    quantity: '0.8',
    price: '0.2',
    tags: [tags[0], tags[1], tags[2]],
  },
];

export const fakeData = { tags, products, purchases };

export const fakeApi = new FakeApi(async (method, url, body) => {
  switch (method + url) {
    case 'get/purchases':
      return jsonResponse({ purchases });
  }
  return new Response(null, { status: 404 });
});
