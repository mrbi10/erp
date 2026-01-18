import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { HashRouter } from 'react-router-dom';
import { initBaseUrl } from './constants/API';

const root = ReactDOM.createRoot(document.getElementById('root'));

(async () => {
  await initBaseUrl();

  root.render(
    <HashRouter>
      <App />
    </HashRouter>
  );
})();
