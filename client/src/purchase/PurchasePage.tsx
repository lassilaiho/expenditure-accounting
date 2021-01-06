import { Paper } from '@material-ui/core';
import Big from 'big.js';
import moment from 'moment';
import React from 'react';
import { Redirect, useParams } from 'react-router-dom';

import BackButton from '../common/BackButton';
import Scaffold from '../common/Scaffold';
import {
  getPurchaseById,
  useApi,
  useAppDispatch,
  useAppSelector,
} from '../data/store';
import CenteredLoader from '../common/CenteredLoader';
import PurchaseEditor from './PurchaseEditor';

interface PurchasePageParams {
  id: string;
}

const PurchasePage: React.FC = () => {
  const api = useApi();
  const dispatch = useAppDispatch();
  const { id: idParam } = useParams<PurchasePageParams>();
  const id = parseInt(idParam ?? '');
  let purchase = useAppSelector(getPurchaseById(id));

  if (idParam === 'new') {
    purchase = {
      id: -1,
      product: -1,
      date: moment.utc(),
      quantity: new Big(1),
      price: new Big(1),
      tags: [],
    };
    return (
      <PurchaseEditor
        purchase={purchase}
        onSave={update => dispatch(api.addPurchase(update))}
      />
    );
  }
  if (isNaN(id)) {
    return <Redirect to='/' />;
  }
  if (purchase) {
    return (
      <PurchaseEditor
        purchase={purchase}
        onSave={update => dispatch(api.updatePurchase(update))}
      />
    );
  }
  return (
    <Scaffold
      nav={<BackButton />}
      title='Edit Purchase'
      content={
        <Paper>
          <CenteredLoader />
        </Paper>
      }
    />
  );
};

export default PurchasePage;
