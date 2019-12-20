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
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import MenuButton from './MenuButton';
import NavigationDrawer from './NavigationDrawer';
import { Purchase, PurchaseStore, usePurchases } from './purchases';
import { currency, formatMonth, reverse } from './util';

const MonthlyExpenditurePage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const purchaseStore = usePurchases();
  const history = useHistory();
  if (purchaseStore.dataState === 'not-started') {
    purchaseStore.getPurchases();
  }
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={() => setDrawerOpen(true)} />
        <Typography variant='h6'>Monthly Expenditure</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {purchaseStore.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          : renderMonthlyExpenditure(purchaseStore, history)}
      </Paper>
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
  </>;
});

function renderMonthlyExpenditure(store: PurchaseStore, history: History<any>) {
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
    if (equalMonths(current.date, prev.date)) {
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

function equalMonths(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function makeItem(monthAndYear: Date, expenditure: number, history: History<any>) {
  const m = formatMonth(monthAndYear);
  return (
    <ListItem key={m} button onClick={() => history.push('/expenditure/' + m)}>
      <ListItemText primary={m} secondary={currency.format(expenditure)} />
    </ListItem>
  );
}

export default MonthlyExpenditurePage;
