import {
  Box,
  Button,
  createStyles,
  makeStyles,
  Paper,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { AuthError, useSession } from './data/session';
import MenuButton from './MenuButton';
import Scaffold from './Scaffold';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    form: {
      display: 'flex',
      flexDirection: 'column',
    },
    formElement: {
      marginTop: theme.spacing(1),
    },
  }),
);

export interface LoginPageProps {
  openNavigation: () => void;
}

const LoginPage: React.FC<LoginPageProps> = observer(props => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    <Scaffold
      nav={<MenuButton onClick={props.openNavigation} />}
      title='Login'
      content={
        <Paper>
          <Box px={2} py={1}>
            <form onSubmit={login} className={classes.form}>
              <TextField
                className={classes.formElement}
                id='email'
                label='Email'
                onChange={e => setEmail(e.target.value)}
              />
              <TextField
                className={classes.formElement}
                id='password'
                label='Password'
                type='password'
                onChange={e => setPassword(e.target.value)}
              />
              {errorMessage === '' ? null : (
                <Typography color='error'>{errorMessage}</Typography>
              )}
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
      }
    />
  );
});

export default LoginPage;
