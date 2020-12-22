import DateFnsUtil from '@date-io/date-fns';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { observer } from 'mobx-react';
import React, { useRef, useState } from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import DailyExpenditurePage from './DailyExpenditurePage';
import Api from './data/api';
import { Session, SessionContext } from './data/session';
import { Store, StoreContext } from './data/store';
import ExpenditureDetailsPage from './ExpenditureDetailsPage';
import LoginPage from './LoginPage';
import MonthlyExpenditurePage from './MonthlyExpenditurePage';
import NavigationDrawer from './NavigationDrawer';
import PurchasePage from './PurchasePage';
import PurchasesPage from './PurchasesPage';
import SettingsPage from './SettingsPage';

interface Stores {
  session: Session;
  store: Store;
}

const App: React.FC = observer(() => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const stores = useRef<Stores | null>(null);
  if (stores.current === null) {
    const apiUrl =
      typeof process.env.REACT_APP_API_URL === 'string'
        ? process.env.REACT_APP_API_URL
        : 'http://localhost:8080/api';
    const api = new Api(apiUrl);
    stores.current = {
      session: Session.fromLocalStorage(api),
      store: new Store(api),
    };
  }
  const { session, store } = stores.current;

  function openNavigation() {
    setNavigationOpen(true);
  }

  return (
    <SessionContext.Provider value={session}>
      <StoreContext.Provider value={store}>
        <MuiPickersUtilsProvider utils={DateFnsUtil}>
          <CssBaseline />
          <Router>
            <NavigationDrawer
              open={navigationOpen}
              onClose={() => setNavigationOpen(false)}
            />
            <Switch>
              {session.isLoggedIn ? null : (
                <Route path='/'>
                  <LoginPage openNavigation={openNavigation} />
                </Route>
              )}
              <Route path='/purchases/:id'>
                <PurchasePage />
              </Route>
              <Route path='/purchases'>
                <PurchasesPage openNavigation={openNavigation} />
              </Route>
              <Route path='/expenditure/daily'>
                <DailyExpenditurePage openNavigation={openNavigation} />
              </Route>
              <Route path='/expenditure/monthly'>
                <MonthlyExpenditurePage openNavigation={openNavigation} />
              </Route>
              <Route path='/expenditure/'>
                <ExpenditureDetailsPage />
              </Route>
              <Route path='/settings'>
                <SettingsPage openNavigation={openNavigation} />
              </Route>
              <Route path='/'>
                <Redirect to='/purchases' />
              </Route>
            </Switch>
          </Router>
        </MuiPickersUtilsProvider>
      </StoreContext.Provider>
    </SessionContext.Provider>
  );
});

export default App;
