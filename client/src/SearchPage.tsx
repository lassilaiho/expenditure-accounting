import {
  AppBar,
  createStyles,
  IconButton,
  InputBase,
  makeStyles,
  Theme,
  Toolbar,
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CloseIcon from '@material-ui/icons/Close';
import { observer } from 'mobx-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Scaffold from './Scaffold';

export interface SearchPageProps {
  onCancel: () => void;
  onSearch: (searchString: string) => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    container: {
      flexGrow: 1,
    },
    appBar: {
      backgroundColor: theme.palette.background.paper,
    },
  }),
);

const SearchPage: React.FC<SearchPageProps> = observer(props => {
  const classes = useStyles();
  const [searchString, setSearchString] = useState('');
  const inputRef = useRef<HTMLInputElement | undefined>();

  const onEsc = useCallback(
    e => {
      if (!e.defaultPrevented && e.key === 'Escape') {
        props.onCancel();
      }
    },
    [props.onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', onEsc, false);
    return () => document.removeEventListener('keydown', onEsc, false);
  }, [onEsc]);

  function onChange(
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) {
    const s = e.target.value ?? '';
    setSearchString(s);
    props.onSearch(s);
  }

  function clearInput() {
    inputRef.current?.focus();
    setSearchString('');
    props.onSearch('');
  }

  return (
    <Scaffold
      appBar={
        <AppBar position='static' className={classes.appBar}>
          <Toolbar>
            <IconButton onClick={props.onCancel}>
              <ArrowBackIcon />
            </IconButton>
            <InputBase
              inputRef={inputRef}
              placeholder='Search'
              autoFocus
              fullWidth
              value={searchString}
              onChange={onChange}
            />
            <IconButton onClick={clearInput}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      }
      content={props.children as any}
    />
  );
});

export default SearchPage;
