import CssBaseline from '@material-ui/core/CssBaseline';
import React, { useRef } from 'react';

import Api from './api';
import LoginPage from './LoginPage';
import { Session, SessionContext } from './session';

interface Stores {
  session: Session;
}

const App: React.FC = () => {
  const stores = useRef<Stores | null>(null);
  if (stores.current === null) {
    const api = new Api('http://localhost:8080/api');
    stores.current = {
      session: Session.fromLocalStorage(api),
    };
  }

  return (
    <SessionContext.Provider value={stores.current.session}>
      <CssBaseline />
      <LoginPage />
    </SessionContext.Provider>
  );
};

export default App;
