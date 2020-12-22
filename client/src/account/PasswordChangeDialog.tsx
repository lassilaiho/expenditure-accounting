import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import React, { useState } from 'react';

export interface PasswordChangeDialogProps {
  open: boolean;
  onSubmit: (oldPassword: string, newPassword: string) => void;
  onDismiss: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = props => {
  const { open, onSubmit, onDismiss } = props;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');

  const newIsValid = newPassword.length > 0;
  const newAgainIsValid = newPassword === newPasswordAgain;

  function submit() {
    if (newIsValid && newAgainIsValid) {
      onSubmit(oldPassword, newPassword);
    }
  }

  return (
    <Dialog open={open} onClose={onDismiss}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <TextField
          type='password'
          label='Old Password'
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          fullWidth
        />
        <TextField
          type='password'
          label='New Password'
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          error={!newIsValid}
          helperText={newIsValid ? undefined : 'Must not be empty.'}
          fullWidth
        />
        <TextField
          type='password'
          label='New Password Again'
          value={newPasswordAgain}
          onChange={e => setNewPasswordAgain(e.target.value)}
          error={!newAgainIsValid}
          helperText={newAgainIsValid ? undefined : "Passwords don't match."}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button color='primary' onClick={onDismiss}>
          Cancel
        </Button>
        <Button color='primary' onClick={submit}>
          Change
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeDialog;
