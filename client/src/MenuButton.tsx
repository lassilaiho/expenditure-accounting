import { IconButton } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import React from 'react';

export interface MenuButtonProps {
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick }) => (
  <IconButton onClick={onClick} color='inherit'>
    <MenuIcon />
  </IconButton>
);

export default MenuButton;
