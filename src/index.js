import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { WagmiConfig } from 'wagmi';
import { config } from './web3';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <WagmiConfig config={config}>
    <App />
  </WagmiConfig>
);
