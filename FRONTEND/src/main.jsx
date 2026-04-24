import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('App Initialized');

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
