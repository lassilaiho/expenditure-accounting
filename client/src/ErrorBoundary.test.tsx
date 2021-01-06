import React from 'react';

import { ConnectionError } from './data/HttpClient';
import { newStore } from './data/store';
import ErrorBoundary from './ErrorBoundary';
import { render } from './testUtil';

const RenderErrorComponent: React.FC = () => {
  throw new Error('render error');
};

const ConnectionErrorComponent: React.FC = () => {
  throw new ConnectionError(new Error('no connection'));
};

test('renders correctly when no error occurs', () => {
  const { asFragment } = render(
    <ErrorBoundary>
      <div>test</div>
    </ErrorBoundary>,
    { store: newStore() },
  );
  expect(asFragment()).toMatchSnapshot();
});

test('handles an error during rendering correctly', () => {
  const spy = jest.spyOn(console, 'error');
  spy.mockImplementation(() => undefined);

  const { asFragment } = render(
    <ErrorBoundary>
      <RenderErrorComponent />
    </ErrorBoundary>,
    { store: newStore() },
  );
  expect(asFragment()).toMatchSnapshot();

  spy.mockRestore();
});

test('handles a connection error correctly', () => {
  const spy = jest.spyOn(console, 'error');
  spy.mockImplementation(() => undefined);

  const { asFragment } = render(
    <ErrorBoundary>
      <ConnectionErrorComponent />
    </ErrorBoundary>,
    { store: newStore() },
  );
  expect(asFragment()).toMatchSnapshot();

  spy.mockRestore();
});
