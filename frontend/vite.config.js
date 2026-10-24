import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, proxy: { '/api': 'http://localhost:4000' } }, // open the dev site on your phone via the "Network" link
});
