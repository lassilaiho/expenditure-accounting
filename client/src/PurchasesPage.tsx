import {
  createStyles,
  Fab,
  IconButton,
  makeStyles,
  Theme
} from "@material-ui/core";
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import { observer } from "mobx-react";
import React, { useState } from 'react';
import { useHistory } from "react-router-dom";
import { AutoSizer } from "react-virtualized";
import { Virtuoso } from "react-virtuoso";

import { Purchase, useStore } from "./data/store";
import MenuButton from './MenuButton';
import PurchaseItem from "./PurchaseItem";
import SearchPage from "./SearchPage";
import Scaffold from "./Scaffold";
import CenteredLoader from './CenteredLoader';

const useStyles = makeStyles((theme: Theme) => createStyles({
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
}));

export interface PurchasesPageProps {
  openNavigation: () => void;
}

const PurchasesPage: React.FC<PurchasesPageProps> = observer(props => {
  const store = useStore();
  const [expandedPurchase, setExpandedPurchase] =
    useState<Purchase | null>(null);
  const history = useHistory();
  const classes = useStyles();

  const [isSearching, setIsSearching] = useState(false);
  const [shownPurchases, setShownPurchases] = useState(store.purchases);

  function stopSearching() {
    setShownPurchases(store.purchases);
    setIsSearching(false);
  }

  function searchPurchases(searchString: string) {
    setShownPurchases(
      searchString === ''
        ? store.purchases
        : store.purchases.filter(p =>
          p.lowerCaseMatch(searchString.toLowerCase())),
    );
  }

  function renderPurchaseItem(i: number) {
    const p = shownPurchases[i];
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

  if (isSearching) {
    return (
      <SearchPage onCancel={stopSearching} onSearch={searchPurchases}>
        <AutoSizer>
          {({ width, height }) => (
            <Virtuoso
              style={{ width, height }}
              totalCount={shownPurchases.length}
              itemContent={renderPurchaseItem} />
          )}
        </AutoSizer>
      </SearchPage>
    );
  }
  return <Scaffold
    nav={<MenuButton onClick={props.openNavigation} />}
    title='Purchases'
    actions={
      <IconButton color='inherit' onClick={() => setIsSearching(true)}>
        <SearchIcon />
      </IconButton>
    }
    content={store.dataState === 'loading'
      ? <CenteredLoader />
      : <AutoSizer>
        {({ width, height }) => (
          <Virtuoso
            style={{ width, height }}
            totalCount={shownPurchases.length}
            itemContent={renderPurchaseItem} />
        )}
      </AutoSizer>
    }
    fab={
      <Fab
        color='secondary'
        onClick={() => history.push('/purchases/new')}
      >
        <AddIcon />
      </Fab>
    }
  />;
});

export default PurchasesPage;
