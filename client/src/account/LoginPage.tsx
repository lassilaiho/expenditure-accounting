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
import React, { useState } from 'react';

import Scaffold from '../common/Scaffold';
import { getIsLoggedIn, apiLogin } from '../data/session';
import { AuthError, useAppDispatch, useAppSelector } from '../data/store';

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

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(getIsLoggedIn);

  const classes = useStyles();

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLoggedIn) {
      try {
        await dispatch(apiLogin(email, password));
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
};

export default LoginPage;
