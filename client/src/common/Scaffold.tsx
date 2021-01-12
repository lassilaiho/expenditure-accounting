import {
  AppBar,
  Container,
  createStyles,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
} from '@material-ui/core';
import React, { useCallback } from 'react';

import { useAppDispatch } from '../data/store';
import { openNavigation } from '../data/ui';
import MenuButton from './MenuButton';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: 'fixed',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    root: {
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
    },
    contentRoot: {
      flexGrow: 1,
      overflowX: 'auto',
    },
    title: {
      flexGrow: 1,
    },
  }),
);

export interface ScaffoldProps
  extends Omit<React.HTMLProps<HTMLDivElement>, 'content'> {
  appBar?: JSX.Element;
  nav?: JSX.Element | null;
  title?: string;
  actions?: JSX.Element;
  content?: JSX.Element;
  fab?: JSX.Element;
}

const ScaffoldNavButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const onClick = useCallback(() => dispatch(openNavigation()), []);
  return <MenuButton onClick={onClick} />;
};

const Scaffold: React.FC<ScaffoldProps> = props => {
  const classes = useStyles();
  const { appBar, nav, title, actions, content, fab, ...restProps } = props;
  return (
    <div {...restProps} className={classes.root}>
      {appBar ? (
        appBar
      ) : (
        <AppBar position='static'>
          <Toolbar>
            {nav === undefined ? (
              <ScaffoldNavButton />
            ) : nav === null ? null : (
              nav
            )}
            <Typography variant='h6' className={classes.title}>
              {title}
            </Typography>
            {actions}
          </Toolbar>
        </AppBar>
      )}
      <div className={classes.contentRoot}>
        <Container
          fixed
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {content ?? ''}
        </Container>
      </div>
      {fab ? <div className={classes.fab}>{fab}</div> : null}
    </div>
  );
};

export default Scaffold;
