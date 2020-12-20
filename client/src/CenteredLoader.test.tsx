import React from 'react';
import { render } from './testUtil';
import CenteredLoader from './CenteredLoader';

test('renders correctly', () => {
  const { asFragment } = render(<CenteredLoader />);
  expect(asFragment()).toMatchSnapshot();
});
