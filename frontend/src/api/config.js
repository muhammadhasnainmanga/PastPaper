const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

// Use the current origin by default. This works when the frontend and API are
// served together, and Vite proxies /api to the local backend during development.
const apiRoot = (configuredApiUrl || '').replace(/\/+$/, '');

// Accept either the backend origin or an origin that already ends in /api.
export const API_BASE = apiRoot
  ? (apiRoot.endsWith('/api') ? apiRoot : `${apiRoot}/api`)
  : '/api';
