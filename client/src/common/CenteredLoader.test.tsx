import React from 'react';
import { newStore } from '../data/store';
import { render } from '../testUtil';
import CenteredLoader from './CenteredLoader';

test('renders correctly', () => {
  const { asFragment } = render(<CenteredLoader />, { store: newStore() });
  expect(asFragment()).toMatchSnapshot();
});
