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

export interface MonthlyExpenditurePageProps {
  openNavigation: () => void;
}

const MonthlyExpenditurePage: React.FC<MonthlyExpenditurePageProps> = observer(props => {
  const store = useStore();
  const history = useHistory();
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
          : renderMonthlyExpenditure(store, history)}
      </Paper>
    </Container>
  </>;
});

function renderMonthlyExpenditure(store: Store, history: History<any>) {
  if (store.purchases.length === 0) {
    return <List></List>;
  }
  const monthlyPurchases = store.purchases.slice();
  monthlyPurchases.sort(reverse(Purchase.orderByDate));
  const result: JSX.Element[] = [];
  let prev = monthlyPurchases[0];
  let expenditure = prev.totalPrice;
  for (let i = 1; i < store.purchases.length; i++) {
    const current = store.purchases[i];
    if (current.date.isSame(prev.date, 'month')) {
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
  const m = date.format('M/YYYY');
  return (
    <ListItem key={m} button onClick={() => history.push('/expenditure/' + m)}>
      <ListItemText primary={m} secondary={currency.format(expenditure)} />
    </ListItem>
  );
}

export default MonthlyExpenditurePage;
