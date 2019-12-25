import {
  Box,
  Button,
  createStyles,
  makeStyles,
  Paper,
  TextField,
  Theme,
  Typography
} from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Container from '@material-ui/core/Container';
import Toolbar from '@material-ui/core/Toolbar';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { useSession, AuthError } from './data/session';
import MenuButton from './MenuButton';
import NavigationDrawer from './NavigationDrawer';

const useStyles = makeStyles((theme: Theme) => createStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formElement: {
    marginTop: theme.spacing(1),
  },
}));

const LoginPage: React.FC = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const session = useSession();

  const classes = useStyles();

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session.isLoggedIn) {
      try {
        await session.login(email, password);
      } catch (e) {
        if (e instanceof AuthError) {
          setErrorMessage('Wrong email or password');
        } else {
          throw e;
        }
      }
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
        <Paper>
          <Box px={2} py={1}>
            <form onSubmit={login} className={classes.form}>
              <TextField
                className={classes.formElement}
                id='email'
                label='Email'
                onChange={e => setEmail(e.target.value)} />
              <TextField
                className={classes.formElement}
                id='password'
                label='Password'
                type='password'
                onChange={e => setPassword(e.target.value)} />
              {errorMessage === ''
                ? null
                : <Typography color='error'>{errorMessage}</Typography>}
              <Button
                variant='contained'
                color='primary'
                type='submit'
                className={classes.formElement}
              >
                Login
              </Button>
            </form>
          </Box>
        </Paper>
      </Container>
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)} />
    </>
  );
});

export default LoginPage;
