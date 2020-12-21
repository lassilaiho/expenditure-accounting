import { Paper } from '@material-ui/core';
import Big from 'big.js';
import { observer } from 'mobx-react';
import moment from 'moment';
import React from 'react';
import { Redirect, useParams } from 'react-router-dom';

import BackButton from './BackButton';
import Scaffold from './Scaffold';
import { Product, Purchase, useStore } from './data/store';
import CenteredLoader from './CenteredLoader';
import PurchaseEditor from './PurchaseEditor';

interface PurchasePageParams {
  id: string;
}

const PurchasePage: React.FC = observer(() => {
  const store = useStore();
  const { id: idParam } = useParams<PurchasePageParams>();
  if (idParam === 'new') {
    const purchase = new Purchase(
      -1,
      new Product(-1, ''),
      moment.utc(),
      new Big(1),
      new Big(1),
      [],
    );
    return <PurchaseEditor
      purchase={purchase}
      onSave={() => store.addPurchase(purchase)} />;
  }
  const id = parseInt(idParam ?? '');
  if (isNaN(id)) {
    return <Redirect to='/' />;
  }
  const purchase = store.purchasesById.get(id);
  if (purchase) {
    return <PurchaseEditor
      purchase={purchase}
      onSave={() => store.updatePurchase(purchase.id)} />;
  }
  return <Scaffold
    nav={<BackButton />}
    title='Edit Purchase'
    content={
      <Paper>
        <CenteredLoader />
      </Paper>
    }
  />;
});

export default PurchasePage;
