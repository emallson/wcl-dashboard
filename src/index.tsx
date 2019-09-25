import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import './index.css';
import App from './App';
import buildStore from './store';
import * as serviceWorker from './serviceWorker';
// import whyDidYouRender from '@welldone-software/why-did-you-render/dist/no-classes-transpile/umd/whyDidYouRender.min.js';

// whyDidYouRender(React);

const { store, persistor } = buildStore()

ReactDOM.render(<Provider store={store}><PersistGate persistor={persistor}><App /></PersistGate></Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
