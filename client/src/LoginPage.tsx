import {
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Container from '@material-ui/core/Container';
import FormGroup from '@material-ui/core/FormGroup';
import Toolbar from '@material-ui/core/Toolbar';
import MenuIcon from '@material-ui/icons/Menu';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { useSession } from './session';

const LoginPage: React.FC = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);

  const session = useSession();

  function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session.isLoggedIn) {
      session.login(email, password);
    }
  }

  return (
    <>
      <AppBar position='sticky'>
        <Toolbar>
          <IconButton onClick={() => setDrawerOpen(true)} color='inherit'>
            <MenuIcon />
          </IconButton>
          <Typography variant='h6'>Login</Typography>
        </Toolbar>
      </AppBar>
      <Container fixed>
        <form onSubmit={login}>
          <FormGroup>
            <TextField
              id='email'
              label='Email'
              onChange={e => setEmail(e.target.value)} />
            <TextField
              id='password'
              label='Password'
              type='password'
              onChange={e => setPassword(e.target.value)} />
            <Button variant='contained' color='primary' type='submit'>
              Login
            </Button>
          </FormGroup>
        </form>
      </Container>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
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
    </>
  );
});

export default LoginPage;
