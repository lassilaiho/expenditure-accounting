import { Divider, Drawer, List, ListItem, ListItemText } from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';

import { useSession } from './data/session';

export interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = observer(props => {
  const session = useSession();
  const [redirect, setRedirect] = useState<JSX.Element | null>(null);

  function linkOpener(url: string) {
    return () => {
      setRedirect(<Redirect to={url} />);
      props.onClose();
    };
  }

  return <>
    {redirect}
    <Drawer open={props.open} onClose={props.onClose}>
      <List>
        <ListItem button onClick={linkOpener('/purchases')}>
          <ListItemText>Purchases</ListItemText>
        </ListItem>
        <ListItem button onClick={linkOpener('/expenditure/daily')}>
          <ListItemText>Daily Expenditure</ListItemText>
        </ListItem>
        <ListItem button onClick={linkOpener('/expenditure/monthly')}>
          <ListItemText>Monthly Expenditure</ListItemText>
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
          </>
          : <ListItem button>
            <ListItemText>Login</ListItemText>
          </ListItem>}
      </List>
    </Drawer>
  </>;
});

export default NavigationDrawer;
