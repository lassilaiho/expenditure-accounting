import {
  AppBar,
  CircularProgress,
  Container,
  Toolbar,
  Typography
} from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useState } from 'react';

import MenuButton from './MenuButton';
import NavigationDrawer from "./NavigationDrawer";
import { useProducts } from "./product";
import PurchaseItem from "./PurchaseItem";
import { Purchase, usePurchases } from "./purchases";
import { useTags } from "./tags";

const PurchasesPage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const purchaseStore = usePurchases();
  const tagStore = useTags();
  const productStore = useProducts();
  const [expandedPurchase, setExpandedPurchase] =
    useState<Purchase | null>(null);
  if (purchaseStore.dataState === 'not-started') {
    purchaseStore.getPurchases();
  }
  if (tagStore.dataState === 'not-started') {
    productStore.fetchTags();
  }
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={() => setDrawerOpen(true)} />
        <Typography variant='h6'>Purchases</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      {purchaseStore.dataState === 'loading'
        ? <CircularProgress color='secondary' />
        : purchaseStore.purchases.map(p => {
          const toggle = () => {
            if (expandedPurchase?.id === p.id) {
              setExpandedPurchase(null);
            } else {
              setExpandedPurchase(p);
            }
          };
          return (
            <PurchaseItem
              key={p.id}
              purchase={p}
              expanded={expandedPurchase?.id === p.id}
              onToggle={toggle} />
          );
        })}
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
  </>;
});

export default PurchasesPage;
