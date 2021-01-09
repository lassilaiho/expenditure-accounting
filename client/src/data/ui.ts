import { createSlice } from '@reduxjs/toolkit';

import { id } from './common';
import { RootState } from './store';

type Ui = {
  navigationOpen: boolean;
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: id<Ui>({ navigationOpen: false }),
  reducers: {
    openNavigation: state => {
      state.navigationOpen = true;
    },
    closeNavigation: state => {
      state.navigationOpen = false;
    },
  },
});
export const { openNavigation, closeNavigation } = uiSlice.actions;

export const getNavigationOpen = (state: RootState) => state.ui.navigationOpen;
