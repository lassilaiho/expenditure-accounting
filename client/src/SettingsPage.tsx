import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
} from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { useSession } from './data/session';
import MenuButton from './MenuButton';
import Scaffold from './Scaffold';
import PasswordChangeDialog from './PasswordChangeDialog';

export interface SettingsProps {
  openNavigation: () => void;
}

const SettingsPage: React.FC<SettingsProps> = observer(props => {
  const session = useSession();

  const [dialogOpen, setDialogOpen] = useState(false);

  async function changePassword(oldPassword: string, newPassword: string) {
    await session.changePassword(oldPassword, newPassword);
    setDialogOpen(false);
  }

  return (
    <>
      <Scaffold
        nav={<MenuButton onClick={props.openNavigation} />}
        title='Settings'
        content={
          <Paper>
            <List subheader={<ListSubheader>My Account</ListSubheader>}>
              <ListItem>
                <ListItemText>{session.currentEmail}</ListItemText>
              </ListItem>
              <ListItem button onClick={() => setDialogOpen(true)}>
                <ListItemText>Change Password</ListItemText>
              </ListItem>
            </List>
          </Paper>
        }
      />
      <PasswordChangeDialog
        open={dialogOpen}
        onSubmit={changePassword}
        onDismiss={() => setDialogOpen(false)}
      />
    </>
  );
});

export default SettingsPage;
