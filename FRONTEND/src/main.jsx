import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Backend connection indicator
const checkBackendConnection = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    if (response.ok) {
      console.log("%c✓ backend is connected", "color: #10b981; font-weight: bold;");
    } else {
      console.log("%c✗ backend not connected", "color: #ef4444; font-weight: bold;");
    }
  } catch (error) {
    console.log("%c✗ backend not connected", "color: #ef4444; font-weight: bold;");
  }
};

checkBackendConnection();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
