import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import React from 'react';

import { getIsLoggedIn, getCurrentEmail, apiLogout } from './data/session';
import { useAppDispatch, useAppSelector } from './data/store';
import { closeNavigation, getNavigationOpen, useRouting } from './data/ui';

const NavigationDrawer: React.FC = () => {
  const routing = useRouting();
  const loggedIn = useAppSelector(getIsLoggedIn);
  const currentEmail = useAppSelector(getCurrentEmail);
  const navigationOpen = useAppSelector(getNavigationOpen);
  const dispatch = useAppDispatch();

  function linkOpener(url: string) {
    return () => {
      dispatch(closeNavigation());
      routing.replace(url);
    };
  }

  return (
    <Drawer open={navigationOpen} onClose={() => dispatch(closeNavigation())}>
      <List>
        <ListItem>
          <ListItemText>Expenditure Accounting</ListItemText>
        </ListItem>
        <Divider />
        {loggedIn ? (
          <>
            <ListItem button onClick={linkOpener('/settings')}>
              <ListItemText>{currentEmail}</ListItemText>
            </ListItem>
            <ListItem button onClick={() => dispatch(apiLogout)}>
              <ListItemText>Logout</ListItemText>
            </ListItem>
            <Divider />
            <ListItem button onClick={linkOpener('/purchases')}>
              <ListItemText>Purchases</ListItemText>
            </ListItem>
            <ListItem button onClick={linkOpener('/expenditure/daily')}>
              <ListItemText>Daily Expenditure</ListItemText>
            </ListItem>
            <ListItem button onClick={linkOpener('/expenditure/monthly')}>
              <ListItemText>Monthly Expenditure</ListItemText>
            </ListItem>
          </>
        ) : (
          <ListItem button onClick={() => dispatch(closeNavigation())}>
            <ListItemText>Login</ListItemText>
          </ListItem>
        )}
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;
