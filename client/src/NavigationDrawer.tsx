import { Divider, Drawer, List, ListItem, ListItemText } from '@material-ui/core';
import { observer } from 'mobx-react';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { useSession } from './data/session';

export interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = observer(props => {
  const session = useSession();
  const history = useHistory();

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
        {session.isLoggedIn
          ? <>
            <ListItem>
              <ListItemText>{session.currentEmail}</ListItemText>
            </ListItem>
            <ListItem button onClick={() => session.logout()}>
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
          : <ListItem button onClick={() => props.onClose()}>
            <ListItemText>Login</ListItemText>
          </ListItem>}
      </List>
    </Drawer>
  );
});

export default NavigationDrawer;
