import {
  AppBar,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Toolbar,
  Typography
} from '@material-ui/core';
import { History } from 'history';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { Purchase, Store, useStore } from './data/store';
import MenuButton from './MenuButton';
import { currency, reverse } from './util';

export interface DailyExpenditurePageProps {
  openNavigation: () => void;
}

const DailyExpenditurePage: React.FC<DailyExpenditurePageProps> = observer(props => {
  const store = useStore();
  const history = useHistory();
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
          ? <CircularProgress color='secondary' />
          : renderDailyExpenditure(store, history)}
      </Paper>
    </Container>
  </>;
});

function renderDailyExpenditure(store: Store, history: History<any>) {
  if (store.purchases.length === 0) {
    return <List></List>;
  }
  const dailyPurchases = store.purchases.slice();
  dailyPurchases.sort(reverse(Purchase.orderByDate));
  const result: JSX.Element[] = [];
  let prev = dailyPurchases[0];
  let expenditure = prev.totalPrice;
  for (let i = 1; i < store.purchases.length; i++) {
    const current = store.purchases[i];
    if (current.date.isSame(prev.date, 'day')) {
      expenditure += current.totalPrice;
    } else {
      result.push(makeItem(prev.date, expenditure, history));
      expenditure = current.totalPrice;
    }
    prev = current;
  }
  result.push(makeItem(prev.date, expenditure, history));
  return <List>{result}</List>;
}

function makeItem(date: moment.Moment, expenditure: number, history: History<any>) {
  const d = date.clone().local().format('D.M.YYYY');
  return (
    <ListItem
      key={date.valueOf()}
      button
      onClick={() => history.push('/expenditure/' + d)}
    >
      <ListItemText
        primary={d}
        secondary={currency.format(expenditure)} />
    </ListItem>
  );
}

export default DailyExpenditurePage;
