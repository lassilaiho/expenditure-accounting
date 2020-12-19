import {
  AppBar,
  Container,
  createStyles,
  IconButton,
  InputBase,
  makeStyles,
  Theme,
  Toolbar
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import CloseIcon from '@material-ui/icons/Close';
import { observer } from 'mobx-react';
import React, { useRef, useState } from 'react';

export interface SearchPageProps {
  onCancel: () => void;
  onSearch: (searchString: string) => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
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
}));

const SearchPage: React.FC<SearchPageProps> = observer(props => {
  const classes = useStyles();
  const [searchString, setSearchString] = useState('');
  const inputRef = useRef<HTMLInputElement | undefined>();

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
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
    <div className={classes.root}>
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
            onChange={onChange} />
          <IconButton onClick={clearInput}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container fixed className={classes.container}>
        {props.children as any}
      </Container>
    </div>
  );
});

export default SearchPage;
