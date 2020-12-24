import { Paper, Typography, Button, Box } from '@material-ui/core';
import React, { useState } from 'react';

import { ConnectionError } from './data/api';

export interface ErrorDisplayProps {
  error: Error;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = props => {
  const { error } = props;
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <Paper>
      <Box p={1}>
        <Typography variant='h4'>
          {error instanceof ConnectionError
            ? 'Network connection is unavailable.'
            : 'Something went wrong.'}
        </Typography>
        <Typography paragraph>
          {error instanceof ConnectionError
            ? 'You can try reloading the page when you are back online.'
            : 'You can try reloading the page.'}
        </Typography>
        <Button
          color='primary'
          variant='contained'
          onClick={() => location.reload()}
        >
          Reload page
        </Button>
        <br />
        <br />
        <Button onClick={() => setDetailsOpen(!detailsOpen)}>
          {detailsOpen ? 'Hide details' : 'Show details'}
        </Button>
        {detailsOpen ? (
          <>
            <Typography variant='h5'>{error.name}</Typography>
            <Typography paragraph>{error.message}</Typography>
            <Typography paragraph>{error.stack}</Typography>
          </>
        ) : null}
      </Box>
    </Paper>
  );
};

export default ErrorDisplay;
