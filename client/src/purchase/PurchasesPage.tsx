import { Fab, IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import { observer } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useStore } from '../data/store';
import MenuButton from '../common/MenuButton';
import SearchPage from '../common/SearchPage';
import Scaffold from '../common/Scaffold';
import CenteredLoader from '../common/CenteredLoader';
import PurchaseList from './PurchaseList';

export interface PurchasesPageProps {
  openNavigation: () => void;
}

const PurchasesPage: React.FC<PurchasesPageProps> = observer(props => {
  const store = useStore();
  const history = useHistory();

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
            p.lowerCaseMatch(searchString.toLowerCase()),
          ),
    );
  }

  const onEdit = useCallback(p => history.push(`/purchases/${p.id}`), [
    history,
  ]);
  const onDelete = useCallback(p => store.deletePurchase(p.id), [store]);

  function renderList() {
    return store.dataState === 'loading' ? (
      <CenteredLoader />
    ) : (
      <PurchaseList
        purchases={shownPurchases}
        onEditPurchase={onEdit}
        onDeletePurchase={onDelete}
      />
    );
  }

  return isSearching ? (
    <SearchPage onCancel={stopSearching} onSearch={searchPurchases}>
      {renderList()}
    </SearchPage>
  ) : (
    <Scaffold
      nav={<MenuButton onClick={props.openNavigation} />}
      title='Purchases'
      actions={
        <IconButton color='inherit' onClick={() => setIsSearching(true)}>
          <SearchIcon />
        </IconButton>
      }
      content={renderList()}
      fab={
        <Fab color='secondary' onClick={() => history.push('/purchases/new')}>
          <AddIcon />
        </Fab>
      }
    />
  );
});

export default PurchasesPage;
