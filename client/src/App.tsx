import MomentUtil from '@date-io/moment';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React, { useCallback, useState } from 'react';
import { Provider } from 'react-redux';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import ErrorBoundary from './ErrorBoundary';
import DailyExpenditurePage from './expenditure/DailyExpenditurePage';
import { FetchHttpClient } from './data/HttpClient';
import {
  getIsLoggedIn,
  getSessionToken,
  newStore,
  useAppSelector,
  useLocalStorageSession,
} from './data/store';
import ExpenditureDetailsPage from './expenditure/ExpenditureDetailsPage';
import LoginPage from './account/LoginPage';
import MonthlyExpenditurePage from './expenditure/MonthlyExpenditurePage';
import NavigationDrawer from './NavigationDrawer';
import PurchasePage from './purchase/PurchasePage';
import PurchasesPage from './purchase/PurchasesPage';
import SettingsPage from './account/SettingsPage';

const store = newStore(
  new FetchHttpClient(
    typeof process.env.REACT_APP_API_URL === 'string'
      ? process.env.REACT_APP_API_URL
      : 'http://localhost:8080/api',
    () => getSessionToken(store.getState()),
  ),
);

const AppRoot: React.FC = () => {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const loggedIn = useAppSelector(getIsLoggedIn);

  const openNavigation = useCallback(() => setNavigationOpen(true), []);

  return (
    <Router>
      <ErrorBoundary>
        <NavigationDrawer
          open={navigationOpen}
          onClose={() => setNavigationOpen(false)}
        />
        <Switch>
          {loggedIn ? null : (
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
      </ErrorBoundary>
    </Router>
  );
};

const App: React.FC = () => {
  useLocalStorageSession(store);
  return (
    <Provider store={store}>
      <MuiPickersUtilsProvider utils={MomentUtil}>
        <CssBaseline />
        <AppRoot />
      </MuiPickersUtilsProvider>
    </Provider>
  );
};

export default App;
