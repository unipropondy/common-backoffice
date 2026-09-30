import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { applyAuditToFormData, buildAuditPayload, getLoggedInUserId } from './utils/audit';

// 🔥 ADD THIS
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient(); // 🔥 create client

// Routes that should NOT get the X-User-Id header (no user logged in yet)
const PUBLIC_ROUTES = ['/api/login', '/api/check-target-password'];

const isPublicRoute = (url = '') =>
  PUBLIC_ROUTES.some((route) => url.includes(route));

axios.interceptors.request.use((config) => {
  const userId = getLoggedInUserId();

  // Skip audit injection for public/unauthenticated routes
  if (userId && config && typeof config === 'object' && !isPublicRoute(config.url)) {
    if (config.data instanceof FormData) {
      config.data = applyAuditToFormData(config.data, config.method, userId);
    } else if (config.data && typeof config.data === 'string') {
      try {
        const parsed = JSON.parse(config.data);
        const audited = buildAuditPayload(config.method, parsed, userId);
        config.data = JSON.stringify(audited);
      } catch {
        // ignore non-JSON payloads
      }
    } else if (config.data && typeof config.data === 'object') {
      config.data = buildAuditPayload(config.method, config.data, userId);
    }

    const selectedDb = localStorage.getItem('selected_db');
    
    config.headers = {
      ...config.headers,
      'X-User-Id': userId,
    };

    if (selectedDb) {
      config.headers['X-Db-Name'] = selectedDb;
    }
  }

  return config;
});

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const userId = getLoggedInUserId();
  const method = (init.method || 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input?.url || '';

  // Inject headers for non-public routes regardless of method
  if (userId && !isPublicRoute(url)) {
    const selectedDb = localStorage.getItem('selected_db');
    const headers = new Headers(init.headers || {});
    headers.set('X-User-Id', userId);
    if (selectedDb) {
      headers.set('X-Db-Name', selectedDb);
    }
    init.headers = headers;
  }

  // Inject audit payload for mutating requests
  if (userId && ['POST', 'PUT', 'PATCH'].includes(method) && !isPublicRoute(url)) {
    let body = init.body;

    if (body instanceof FormData) {
      body = applyAuditToFormData(body, method, userId);
    } else if (body !== undefined && body !== null) {
      if (typeof body === 'string') {
        try {
          const parsed = JSON.parse(body);
          const audited = buildAuditPayload(method, parsed, userId);
          body = JSON.stringify(audited);
        } catch {
          // keep as-is for non-JSON payloads
        }
      } else if (typeof body === 'object') {
        body = JSON.stringify(buildAuditPayload(method, body, userId));
      }
    }

    return originalFetch(input, {
      ...init,
      method,
      body,
    });
  }

  return originalFetch(input, init);
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* 🔥 WRAP HERE */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

reportWebVitals();