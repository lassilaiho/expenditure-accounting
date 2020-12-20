import {
  AppBar,
  Container,
  Paper,
  Toolbar,
  Typography
} from '@material-ui/core';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';

import { Purchase, useStore } from './data/store';
import MenuButton from './MenuButton';
import GroupedExpenditureView from './GroupedExpenditureView';
import CenteredLoader from './CenteredLoader';

export interface DailyExpenditurePageProps {
  openNavigation: () => void;
}

const DailyExpenditurePage: React.FC<DailyExpenditurePageProps> = observer(props => {
  const store = useStore();
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={props.openNavigation} />
        <Typography variant='h6'>Daily Expenditure</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {store.dataState === 'loading'
          ? <CenteredLoader />
          : <GroupedExpenditureView
            purchases={store.purchases}
            splitHere={splitFunc}
            format={formatFunc} />}
      </Paper>
    </Container>
  </>;
});

function splitFunc(prev: Purchase, current: Purchase) {
  return current.date.isSame(prev.date, 'day');
}

function formatFunc(x: moment.Moment) {
  return x.clone().local().format('D.M.YYYY');
}

export default DailyExpenditurePage;
