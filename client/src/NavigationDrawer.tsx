import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import React from 'react';
import { useHistory } from 'react-router-dom';

import {
  apiLogout,
  getCurrentEmail,
  getIsLoggedIn,
  useAppDispatch,
  useAppSelector,
} from './data/store';

export interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = props => {
  const history = useHistory();
  const { loggedIn, currentEmail } = useAppSelector(state => ({
    loggedIn: getIsLoggedIn(state),
    currentEmail: getCurrentEmail(state),
  }));
  const dispatch = useAppDispatch();

  function linkOpener(url: string) {
    return () => {
      props.onClose();
      history.push(url);
    };
  }

  return (
    <Drawer open={props.open} onClose={props.onClose}>
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
          <ListItem button onClick={() => props.onClose()}>
            <ListItemText>Login</ListItemText>
          </ListItem>
        )}
      </List>
    </Drawer>
  );
};

export default NavigationDrawer;
