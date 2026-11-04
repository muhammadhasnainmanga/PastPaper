const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredApiUrl) {
  throw new Error('VITE_API_URL is missing. Set it to the Azure backend URL in the frontend build environment.');
}

const apiRoot = configuredApiUrl.replace(/\/+$/, '');

// Accept either the backend origin or an origin that already ends in /api.
export const API_BASE = apiRoot.endsWith('/api') ? apiRoot : `${apiRoot}/api`;
