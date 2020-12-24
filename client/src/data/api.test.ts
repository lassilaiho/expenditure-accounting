import moment from 'moment';

import * as api from './api';

describe('SessionToken', () => {
  let token: api.SessionToken;
  const json = {
    token: 'alsdjföaliejcamo',
    expiryTime: '2020-10-13',
  };
  test('fromJson works', () => {
    token = api.SessionToken.fromJson(json);
    expect(token).toEqual(
      new api.SessionToken('alsdjföaliejcamo', moment.utc('2020-10-13')),
    );
  });
  test('toJSON works', () => {
    json.expiryTime = '2020-10-13T00:00:00Z';
    expect(token.toJSON()).toEqual(json);
  });
});
