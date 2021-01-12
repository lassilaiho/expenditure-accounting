import { IconButton } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import React from 'react';

export interface BackButtonProps {
  onClick: () => void;
}

const BackButton: React.FC<BackButtonProps> = props => {
  return (
    <IconButton color='inherit' onClick={props.onClick}>
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton;
