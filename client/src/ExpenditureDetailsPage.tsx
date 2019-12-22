import {
  AppBar,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Toolbar,
  Typography
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { observer } from 'mobx-react';
import React from 'react';
import { Redirect, useHistory, useLocation } from 'react-router-dom';

import { useStore } from './data/store';
import ExpenditureByTags from './ExpenditureByTags';
import { DateRange } from './util';


const ExpenditureDetailsPage: React.FC = observer(() => {
  const location = useLocation();
  const history = useHistory();
  const store = useStore();

  const dateScope = parseDateScope(location.pathname);
  if (!dateScope) {
    return <Redirect to='/' />;
  }

  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <IconButton color='inherit' onClick={() => history.goBack()}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant='h6'>
          Expenditure on {dateScopeToString(dateScope)}
        </Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {store.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          : <ExpenditureByTags
            purchases={store.purchases}
            dateRange={dateScopeToRange(dateScope)} />}
      </Paper>
    </Container>
  </>;
});

type DateScope =
  | { type: 'day', day: number, month: number, year: number }
  | { type: 'month', month: number, year: number };

function dateScopeToString(s: DateScope) {
  switch (s.type) {
    case 'day': return `${s.day}.${s.month}.${s.year}`;
    case 'month': return `${s.month}/${s.year}`;
  }
}

function dateScopeToRange(s: DateScope) {
  switch (s.type) {
    case 'day':
      const date = new Date(s.year, s.month - 1, s.day);
      return new DateRange(date, date);
    case 'month':
      const from = new Date(s.year, s.month - 1, 1);
      const to = new Date(s.year, s.month, 0);
      return new DateRange(from, to);
  }
}

function parseDateScope(url: string): DateScope | null {
  const match = matchMonthAndYear(url);
  if (match) {
    return match;
  }
  return matchDate(url);
}

function matchDate(url: string): DateScope | null {
  const match = /^\/expenditure\/(\d+)\.(\d+)\.(\d+)$/.exec(url);
  if (!match) {
    return null;
  }
  const day = parseInt(match[1], 10);
  if (isNaN(day) || day < 1 || day > 31) {
    return null;
  }
  const month = parseInt(match[2], 10);
  if (isNaN(month) || month < 1 || month > 12) {
    return null;
  }
  const year = parseInt(match[3], 10);
  if (isNaN(year)) {
    return null;
  }
  return { type: 'day', day, month, year };
}

function matchMonthAndYear(url: string): DateScope | null {
  const match = /^\/expenditure\/(\d+)\/(\d+)$/.exec(url);
  if (!match) {
    return null;
  }
  const month = parseInt(match[1], 10);
  if (isNaN(month) || month < 1 || month > 12) {
    return null;
  }
  const year = parseInt(match[2], 10);
  if (isNaN(year)) {
    return null;
  }
  return { type: 'month', month, year };
}

export default ExpenditureDetailsPage;