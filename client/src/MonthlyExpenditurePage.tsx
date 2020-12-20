import {
  AppBar,
  CircularProgress,
  Container,
  Paper,
  Toolbar,
  Typography
} from '@material-ui/core';
import GroupedExpneditureView from 'GroupedExpenditureView';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';

import { Purchase, useStore } from './data/store';
import MenuButton from './MenuButton';

export interface MonthlyExpenditurePageProps {
  openNavigation: () => void;
}

const MonthlyExpenditurePage: React.FC<MonthlyExpenditurePageProps> = observer(props => {
  const store = useStore();
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={props.openNavigation} />
        <Typography variant='h6'>Monthly Expenditure</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {store.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          : <GroupedExpneditureView
            purchases={store.purchases}
            splitHere={splitFunc}
            format={formatFunc} />}
      </Paper>
    </Container>
  </>;
});

function splitFunc(prev: Purchase, current: Purchase) {
  return current.date.isSame(prev.date, 'month');
}

function formatFunc(x: moment.Moment) {
  return x.format('M/YYYY');
}

export default MonthlyExpenditurePage;
