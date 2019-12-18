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
} from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useState } from 'react';

import MenuButton from './MenuButton';
import NavigationDrawer from "./NavigationDrawer";
import { PurchaseStore, usePurchases } from "./purchases";
import { currency, formatDate, threeDecimals } from "./util";

const PurchasesPage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const purchaseStore = usePurchases();
  if (purchaseStore.dataState === 'not-started') {
    purchaseStore.getPurchases();
  }
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={() => setDrawerOpen(true)} />
        <Typography variant='h6'>Purchases</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        {purchaseStore.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          : renderPurchases(purchaseStore)}
      </Paper>
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
  </>;
});

function renderPurchases(purchaseStore: PurchaseStore): JSX.Element {
  return <List>
    {purchaseStore.purchases.map(p => {
      let quantity = '';
      if (p.quantity !== 1) {
        if (Number.isInteger(p.quantity)) {
          quantity = `${p.quantity.toFixed(0)} × `;
        } else {
          quantity = `${threeDecimals.format(p.quantity)} × `;
        }
      }
      return (
        <ListItem key={p.id}>
          <ListItemText
            primary={quantity + p.product.name}
            secondary={`${formatDate(p.date)} • ${currency.format(p.totalPrice)}`} />
        </ListItem>
      );
    })}
  </List>;
}

export default PurchasesPage;
