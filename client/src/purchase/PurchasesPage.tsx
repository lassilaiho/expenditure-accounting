import { Button, Fab, IconButton, Snackbar } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import SearchIcon from '@material-ui/icons/Search';
import React, { useCallback, useState } from 'react';

import {
  getDataState,
  useAppDispatch,
  useAppSelector,
  useData,
} from '../data/store';
import SearchPage from '../common/SearchPage';
import Scaffold from '../common/Scaffold';
import CenteredLoader from '../common/CenteredLoader';
import {
  getFilteredPurchases,
  Purchase,
  apiDeletePurchase,
  apiRestorePurchase,
} from '../data/purchases';
import { useRouting } from '../data/ui';
import PurchaseList from './PurchaseList';

const PurchasesPage: React.FC = () => {
  useData();

  const [searchString, setSearchString] = useState<string | null>(null);
  const [undoablePurchaseId, setUndoablePurchaseId] = useState<number | null>(
    null,
  );

  const dispatch = useAppDispatch();
  const purchases = useAppSelector(getFilteredPurchases(searchString ?? ''));
  const dataState = useAppSelector(getDataState);

  const routing = useRouting();

  const stopSearching = useCallback(() => setSearchString(null), []);
  const onEdit = useCallback(p => routing.push(`/purchases/${p.id}`), [
    routing,
  ]);
  const onDelete = useCallback(
    async (p: Purchase) => {
      await dispatch(apiDeletePurchase(p.id));
      setUndoablePurchaseId(p.id);
    },
    [dispatch],
  );
  const undoDelete = async () => {
    if (undoablePurchaseId !== null) {
      await dispatch(apiRestorePurchase(undoablePurchaseId));
      setUndoablePurchaseId(null);
    }
  };

  const renderList = useCallback(() => {
    return dataState !== 'finished' ? (
      <CenteredLoader />
    ) : (
      <PurchaseList
        purchases={purchases}
        onEditPurchase={onEdit}
        onDeletePurchase={onDelete}
      />
    );
  }, [dataState, purchases, onEdit, onDelete]);

  return (
    <>
      {searchString === null ? (
        <Scaffold
          title='Purchases'
          actions={
            <IconButton color='inherit' onClick={() => setSearchString('')}>
              <SearchIcon />
            </IconButton>
          }
          content={renderList()}
          fab={
            <Fab
              color='secondary'
              onClick={() => routing.push('/purchases/new')}
            >
              <AddIcon />
            </Fab>
          }
        />
      ) : (
        <SearchPage onCancel={stopSearching} onSearch={setSearchString}>
          {renderList()}
        </SearchPage>
      )}
      <Snackbar
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        open={undoablePurchaseId !== null}
        autoHideDuration={6000}
        message={'Purchase deleted'}
        action={
          <Button color='secondary' size='small' onClick={undoDelete}>
            UNDO
          </Button>
        }
        onClose={() => setUndoablePurchaseId(null)}
      />
    </>
  );
};

export default PurchasesPage;
