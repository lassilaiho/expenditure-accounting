import {
  AppBar,
  Container,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
  Toolbar,
  Typography
} from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { useSession } from './data/session';
import MenuButton from './MenuButton';
import NavigationDrawer from './NavigationDrawer';
import PasswordChangeDialog from './PasswordChangeDialog';

const SettingsPage: React.FC = observer(() => {
  const session = useSession();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function changePassword(oldPassword: string, newPassword: string) {
    await session.changePassword(oldPassword, newPassword);
    setDialogOpen(false);
  }

  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={() => setDrawerOpen(true)} />
        <Typography variant='h6'>Settings</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
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
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
    <PasswordChangeDialog
      open={dialogOpen}
      onSubmit={changePassword}
      onDismiss={() => setDialogOpen(false)} />
  </>;
});

export default SettingsPage;
