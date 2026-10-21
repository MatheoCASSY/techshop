import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { ScrollToTop } from './components/ScrollToTop';
import './index.css';
import { Providers } from './Providers';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <ScrollToTop />
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
