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
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import MenuButton from './MenuButton';
import NavigationDrawer from './NavigationDrawer';
import { PurchaseStore, usePurchases } from './purchases';
import { currency, formatMonth } from './util';

const MonthlyExpenditurePage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const purchaseStore = usePurchases();
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
          : renderMonthlyExpenditure(purchaseStore)}
      </Paper>
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
  </>;
});

function renderMonthlyExpenditure(store: PurchaseStore) {
  if (store.purchases.length === 0) {
    return <List></List>;
  }
  const monthlyPurchases = store.purchases.slice();
  monthlyPurchases.sort((a, b) => {
    if (a.date < b.date) { return 1; }
    if (a.date > b.date) { return -1; }
    return 0;
  });
  const result: JSX.Element[] = [];
  let prev = monthlyPurchases[0];
  let expenditure = prev.totalPrice;
  for (let i = 1; i < store.purchases.length; i++) {
    const current = store.purchases[i];
    if (equalMonths(current.date, prev.date)) {
      expenditure += current.totalPrice;
    } else {
      result.push(makeItem(prev.date, expenditure));
      expenditure = current.totalPrice;
    }
    prev = current;
  }
  result.push(makeItem(prev.date, expenditure));
  return <List>{result}</List>;
}

function equalMonths(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function makeItem(monthAndYear: Date, expenditure: number) {
  const m = formatMonth(monthAndYear);
  return (
    <ListItem key={m}>
      <ListItemText primary={m} secondary={currency.format(expenditure)} />
    </ListItem>
  );
}

export default MonthlyExpenditurePage;
