import React from 'react';
import ReactDOM from 'react-dom';
import 'typeface-roboto';

import App from './App';
import * as serviceWorker from './serviceWorkerRegistration';

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.register();
