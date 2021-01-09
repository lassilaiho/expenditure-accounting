import MomentUtil from '@date-io/moment';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
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
import { newStore, useAppSelector } from './data/store';
import ExpenditureDetailsPage from './expenditure/ExpenditureDetailsPage';
import LoginPage from './account/LoginPage';
import MonthlyExpenditurePage from './expenditure/MonthlyExpenditurePage';
import NavigationDrawer from './NavigationDrawer';
import PurchasePage from './purchase/PurchasePage';
import PurchasesPage from './purchase/PurchasesPage';
import SettingsPage from './account/SettingsPage';
import {
  getSessionToken,
  getIsLoggedIn,
  useLocalStorageSession,
} from './data/session';

const store = newStore(
  new FetchHttpClient(
    typeof process.env.REACT_APP_API_URL === 'string'
      ? process.env.REACT_APP_API_URL
      : 'http://localhost:8080/api',
    () => getSessionToken(store.getState()),
  ),
);

const AppRoot: React.FC = () => {
  const loggedIn = useAppSelector(getIsLoggedIn);
  return (
    <Router>
      <ErrorBoundary>
        <NavigationDrawer />
        <Switch>
          {loggedIn ? null : (
            <Route path='/'>
              <LoginPage />
            </Route>
          )}
          <Route path='/purchases/:id'>
            <PurchasePage />
          </Route>
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
          <Route path='/settings'>
            <SettingsPage />
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
