import {
  Button,
  TextField,
  Typography
} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Container from '@material-ui/core/Container';
import FormGroup from '@material-ui/core/FormGroup';
import Toolbar from '@material-ui/core/Toolbar';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import MenuButton from './MenuButton';
import NavigationDrawer from './NavigationDrawer';
import { useSession } from './data/session';

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
          <MenuButton onClick={() => setDrawerOpen(true)} />
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
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)} />
    </>
  );
});

export default LoginPage;
