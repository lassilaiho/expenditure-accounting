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
import { currency, formatDate, reverse } from './util';

const DailyExpenditurePage: React.FC = observer(() => {
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
        <Typography variant='h6'>Daily Expenditure</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {purchaseStore.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          : renderDailyExpenditure(purchaseStore, history)}
      </Paper>
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
  </>;
});

function renderDailyExpenditure(store: PurchaseStore, history: History<any>) {
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
    if (current.date.getTime() === prev.date.getTime()) {
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

function makeItem(date: Date, expenditure: number, history: History<any>) {
  const d = formatDate(date);
  return (
    <ListItem
      key={date.getTime()}
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
