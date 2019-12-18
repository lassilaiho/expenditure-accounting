import { Drawer, List, ListItem, ListItemText } from '@material-ui/core';
import { observer } from 'mobx-react';
import React from 'react';

import { useSession } from './session';

export interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = observer(props => {
  const session = useSession();
  return (
    <Drawer open={props.open} onClose={props.onClose}>
      <List>
        {session.isLoggedIn
          ? <>
            <ListItem>
              <ListItemText>{session.currentEmail}</ListItemText>
            </ListItem>
            <ListItem>
              <ListItem button onClick={() => session.logout()}>
                <ListItemText>Logout</ListItemText>
              </ListItem>
            </ListItem>
          </>
          : <ListItem button>
            <ListItemText>Login</ListItemText>
          </ListItem>}
      </List>
    </Drawer>
  );
});

export default NavigationDrawer;
