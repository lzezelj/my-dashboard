import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.tsx';
import { canonicalOrigin } from './config.ts';
import { getCanonicalRedirect } from './utils/canonicalRedirect.ts';

const redirectUrl = getCanonicalRedirect(window.location, canonicalOrigin);

if (redirectUrl) {
  window.location.replace(redirectUrl);
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}
