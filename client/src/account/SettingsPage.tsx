import {
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Paper,
} from '@material-ui/core';
import React, { useState } from 'react';

import MenuButton from '../common/MenuButton';
import Scaffold from '../common/Scaffold';
import {
  getCurrentEmail,
  useApi,
  useAppDispatch,
  useAppSelector,
} from '../data/store';
import PasswordChangeDialog from './PasswordChangeDialog';

export interface SettingsProps {
  openNavigation: () => void;
}

const SettingsPage: React.FC<SettingsProps> = props => {
  const currentEmail = useAppSelector(getCurrentEmail);
  const api = useApi(false);
  const dispatch = useAppDispatch();

  const [dialogOpen, setDialogOpen] = useState(false);

  async function changePassword(oldPassword: string, newPassword: string) {
    await dispatch(api.changePassword(oldPassword, newPassword));
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
                <ListItemText>{currentEmail}</ListItemText>
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
};

export default SettingsPage;
