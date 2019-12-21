import {
  AppBar,
  CircularProgress,
  Container,
  Toolbar,
  Typography
} from "@material-ui/core";
import { observer } from "mobx-react";
import React, { useState } from 'react';

import { Purchase, useStore } from "./data/store";
import MenuButton from './MenuButton';
import NavigationDrawer from "./NavigationDrawer";
import PurchaseItem from "./PurchaseItem";

const PurchasesPage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const store = useStore();
  const [expandedPurchase, setExpandedPurchase] =
    useState<Purchase | null>(null);
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <MenuButton onClick={() => setDrawerOpen(true)} />
        <Typography variant='h6'>Purchases</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      {store.dataState === 'loading'
        ? <CircularProgress color='secondary' />
        : store.purchases.map(p => {
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
