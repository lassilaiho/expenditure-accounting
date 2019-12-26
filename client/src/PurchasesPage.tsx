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
import { AutoSizer } from "react-virtualized";
import { Virtuoso } from "react-virtuoso";

import { Purchase, useStore } from "./data/store";
import MenuButton from './MenuButton';
import NavigationDrawer from "./NavigationDrawer";
import PurchaseItem from "./PurchaseItem";

const useStyles = makeStyles((theme: Theme) => createStyles({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  purchaseItem: {
    backgroundColor: theme.palette.background.default,
    transition: theme.transitions.create(
      ['padding-top', 'padding-bottom'],
      { duration: theme.transitions.duration.shortest },
    ),
  },
  expanded: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  root: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    flexGrow: 1,
  },
}));

const PurchasesPage: React.FC = observer(() => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const store = useStore();
  const [expandedPurchase, setExpandedPurchase] =
    useState<Purchase | null>(null);
  const history = useHistory();
  const classes = useStyles();

  function renderPurchaseItem(i: number) {
    const p = store.purchases[i];
    const toggle = () => {
      if (expandedPurchase?.id === p.id) {
        setExpandedPurchase(null);
      } else {
        setExpandedPurchase(p);
      }
    };
    const isExpanded = expandedPurchase?.id === p.id;
    const className =
      `${classes.purchaseItem} ${isExpanded ? classes.expanded : ''}`;
    return (
      <div key={p.id} className={className}>
        <PurchaseItem
          purchase={p}
          expanded={isExpanded}
          onToggle={toggle}
          onEdit={p => history.push(`/purchases/${p.id}`)}
          onDelete={p => store.deletePurchase(p.id)} />
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <AppBar position='static'>
        <Toolbar>
          <MenuButton onClick={() => setDrawerOpen(true)} />
          <Typography variant='h6'>Purchases</Typography>
        </Toolbar>
      </AppBar>
      <Container fixed className={classes.container}>
        {store.dataState === 'loading'
          ? <CircularProgress color='secondary' />
          :
          <AutoSizer>
            {({ width, height }) => (
              <Virtuoso
                style={{ width, height }}
                totalCount={store.purchases.length}
                item={renderPurchaseItem} />
            )}
          </AutoSizer>
        }
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
    </div>
  );
});

export default PurchasesPage;
