import { Paper } from '@material-ui/core';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import CenteredLoader from '../common/CenteredLoader';
import BackButton from '../common/BackButton';
import { useStore } from '../data/store';
import Scaffold from '../common/Scaffold';
import { DateRange } from '../util';
import ExpenditureByTags from './ExpenditureByTags';

const ExpenditureDetailsPage: React.FC = observer(() => {
  const location = useLocation();
  const store = useStore();

  const dateScope = parseDateScope(location.pathname);
  if (!dateScope) {
    return <Redirect to='/' />;
  }

  return (
    <Scaffold
      nav={<BackButton />}
      title={'Expenditure on ' + dateScopeToString(dateScope)}
      content={
        <Paper>
          {store.dataState === 'loading' ? (
            <CenteredLoader />
          ) : (
            <ExpenditureByTags
              purchases={store.purchases}
              dateRange={dateScopeToRange(dateScope)}
            />
          )}
        </Paper>
      }
    />
  );
});

type DateScope =
  | { type: 'day'; day: number; month: number; year: number }
  | { type: 'month'; month: number; year: number };

function dateScopeToString(s: DateScope) {
  switch (s.type) {
    case 'day':
      return `${s.day}.${s.month}.${s.year}`;
    case 'month':
      return `${s.month}/${s.year}`;
  }
}

function dateScopeToRange(s: DateScope) {
  switch (s.type) {
    case 'day': {
      const date = moment.utc([s.year, s.month - 1, s.day]);
      return new DateRange(date, date.clone().endOf('day'));
    }
    case 'month': {
      const date = moment.utc([s.year, s.month - 1]);
      return new DateRange(date, date.clone().endOf('month'));
    }
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
