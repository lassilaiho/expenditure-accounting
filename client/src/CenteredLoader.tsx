import { CircularProgress, createStyles, makeStyles } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles(() => createStyles({
  centeredContainer: {
    padding: 0,
    margin: 0,
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

const CenteredLoader: React.FC = () => {
  const classes = useStyles();
  return <div className={classes.centeredContainer}>
    <CircularProgress color='secondary' />
  </div>;
};

export default CenteredLoader;
