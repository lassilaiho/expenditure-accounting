import CssBaseline from '@material-ui/core/CssBaseline';
import { observer } from 'mobx-react';
import React, { useRef } from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch
} from 'react-router-dom';

import DailyExpenditurePage from './DailyExpenditurePage';
import Api from './data/api';
import { Session, SessionContext } from './data/session';
import { Store, StoreContext } from './data/store';
import ExpenditureDetailsPage from './ExpenditureDetailsPage';
import LoginPage from './LoginPage';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';
import PurchasesPage from './PurchasesPage';

interface Stores {
  session: Session;
  store: Store;
}

const App: React.FC = observer(() => {
  const stores = useRef<Stores | null>(null);
  if (stores.current === null) {
    const api = new Api('http://localhost:8080/api');
    stores.current = {
      session: Session.fromLocalStorage(api),
      store: new Store(api),
    };
  }
  const { session, store } = stores.current;

  return (
    <SessionContext.Provider value={session}>
      <StoreContext.Provider value={store}>
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
      </StoreContext.Provider>
    </SessionContext.Provider>
  );
});

export default App;
