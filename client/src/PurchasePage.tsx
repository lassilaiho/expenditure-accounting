import {
  AppBar,
  CircularProgress,
  Container,
  Paper,
  Toolbar,
  Typography
} from '@material-ui/core';
import { observer } from 'mobx-react';
import React from 'react';
import { Redirect, useParams } from 'react-router-dom';

import BackButton from './BackButton';
import { useStore, Purchase, Product } from './data/store';
import PurchaseEditor from './PurchaseEditor';

const PurchasePage: React.FC = observer(() => {
  const store = useStore();
  const { id: idParam } = useParams();
  if (idParam === 'new') {
    const purchase = new Purchase(
      -1,
      new Product(-1, ''),
      new Date(),
      1,
      1,
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
  return <>
    <AppBar position='sticky'>
      <Toolbar>
        <BackButton />
        <Typography variant='h6'>Edit Purchase</Typography>
      </Toolbar>
    </AppBar>
    <Container fixed>
      <Paper>
        <CircularProgress color='secondary' />
      </Paper>
    </Container>
  </>;
});

export default PurchasePage;
