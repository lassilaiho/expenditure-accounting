import React from 'react';

import { newTestStore, render } from '../testUtil';
import CenteredLoader from './CenteredLoader';

test('renders correctly', () => {
  const { asFragment } = render(<CenteredLoader />, { store: newTestStore() });
  expect(asFragment()).toMatchSnapshot();
});
