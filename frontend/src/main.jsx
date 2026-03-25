import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './assets/styles/globals.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ReaderProvider } from './context/ReaderContext';

import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-client-id'}>
        <AuthProvider>
          <CartProvider>
            <ReaderProvider>
              <App />
            </ReaderProvider>
          </CartProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
