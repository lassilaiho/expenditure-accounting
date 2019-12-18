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
import { currency, formatDate } from './util';

const DailyExpenditurePage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const purchaseStore = usePurchases();
  if (purchaseStore.dataState === 'not-started') {
    purchaseStore.getPurchases();
  }
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={() => setDrawerOpen(true)} />
        <Typography variant='h6'>Daily Expenditure</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {purchaseStore.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          : renderDailyExpenditure(purchaseStore)}
      </Paper>
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
  </>;
});

function renderDailyExpenditure(store: PurchaseStore) {
  if (store.purchases.length === 0) {
    return <List></List>;
  }
  const dailyPurchases = store.purchases.slice();
  dailyPurchases.sort((a, b) => {
    if (a.date < b.date) { return 1; }
    if (a.date > b.date) { return -1; }
    return 0;
  });
  const result: JSX.Element[] = [];
  let prev = dailyPurchases[0];
  let expenditure = prev.totalPrice;
  for (let i = 1; i < store.purchases.length; i++) {
    const current = store.purchases[i];
    if (current.date.getTime() === prev.date.getTime()) {
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

function makeItem(date: Date, expenditure: number) {
  return (
    <ListItem key={date.getTime()}>
      <ListItemText
        primary={formatDate(date)}
        secondary={currency.format(expenditure)} />
    </ListItem>
  );
}

export default DailyExpenditurePage;
