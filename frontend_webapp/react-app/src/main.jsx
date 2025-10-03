import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Or your main CSS file
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
