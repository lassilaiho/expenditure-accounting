import {
  AppBar,
  CircularProgress,
  Container,
  createStyles,
  Fab,
  makeStyles,
  Theme,
  Toolbar,
  Typography
} from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import { observer } from "mobx-react";
import React, { useState } from 'react';
import { useHistory } from "react-router-dom";

import { Purchase, useStore } from "./data/store";
import MenuButton from './MenuButton';
import NavigationDrawer from "./NavigationDrawer";
import PurchaseItem from "./PurchaseItem";

const useStyles = makeStyles((theme: Theme) => createStyles({
  fab: {
    position: 'absolute',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const PurchasesPage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const store = useStore();
  const [expandedPurchase, setExpandedPurchase] =
    useState<Purchase | null>(null);
  const history = useHistory();
  const classes = useStyles();

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
              onToggle={toggle}
              onEdit={p => history.push(`/purchases/${p.id}`)}
              onDelete={p => store.deletePurchase(p.id)} />
          );
        })}
    </Container>
    <NavigationDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)} />
    <Fab
      className={classes.fab}
      color='secondary'
      onClick={() => history.push('/purchases/new')}
    >
      <AddIcon />
    </Fab>
  </>;
});

export default PurchasesPage;
