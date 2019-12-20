import CssBaseline from '@material-ui/core/CssBaseline';
import { observer } from 'mobx-react';
import React, { useRef } from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch
} from 'react-router-dom';

import Api from './api';
import DailyExpenditurePage from './DailyExpenditurePage';
import ExpenditureDetailsPage from './ExpenditureDetailsPage';
import LoginPage from './LoginPage';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';
import { ProductStore, ProductStoreContext } from './product';
import { PurchaseStore, PurchaseStoreContext } from './purchases';
import PurchasesPage from './PurchasesPage';
import { Session, SessionContext } from './session';
import { TagStore, TagStoreContext } from './tags';

interface Stores {
  session: Session;
  purchases: PurchaseStore;
  products: ProductStore;
  tags: TagStore;
}

const App: React.FC = observer(() => {
  const stores = useRef<Stores | null>(null);
  if (stores.current === null) {
    const api = new Api('http://localhost:8080/api');
    const tags = new TagStore(api);
    const products = new ProductStore(tags);
    stores.current = {
      session: Session.fromLocalStorage(api),
      purchases: new PurchaseStore(api, products),
      products,
      tags,
    };
  }
  const { session, purchases, products, tags } = stores.current;

  return (
    <SessionContext.Provider value={session}>
      <ProductStoreContext.Provider value={products}>
        <PurchaseStoreContext.Provider value={purchases}>
          <TagStoreContext.Provider value={tags}>
            <CssBaseline />
            <Router>
              <Switch>
                {session.isLoggedIn
                  ? null
                  : <Route path='/'>
                    <LoginPage />
                  </Route>}
                <Route path='/purchases'>
                  <PurchasesPage />
                </Route>
                <Route path='/expenditure/daily'>
                  <DailyExpenditurePage />
                </Route>
                <Route path='/expenditure/monthly'>
                  <MonthlyExpenditurePage />
                </Route>
                <Route path='/expenditure/'>
                  <ExpenditureDetailsPage />
                </Route>
                <Route path='/'>
                  <Redirect to='/purchases' />
                </Route>
              </Switch>
            </Router>
          </TagStoreContext.Provider>
        </PurchaseStoreContext.Provider>
      </ProductStoreContext.Provider>
    </SessionContext.Provider>
  );
});

export default App;
