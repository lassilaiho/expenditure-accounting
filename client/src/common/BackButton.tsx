import { IconButton } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import React from 'react';
import { useHistory } from 'react-router-dom';

const BackButton: React.FC = () => {
  const history = useHistory();
  return (
    <IconButton color='inherit' onClick={() => history.goBack()}>
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton;
