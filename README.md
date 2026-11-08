# PastPaper (frontend)

React + Vite frontend with a Node.js API.

```bash
npm install
npm run dev     # http://localhost:5173 (and a Network link for your phone)
npm run build
```

The frontend uses `/api` on its current origin by default. In development, Vite
proxies `/api` to `http://localhost:3000`, matching the backend's default port.
Set `VITE_PROXY_TARGET` if your local backend uses another address. For a
separately hosted backend, set `VITE_API_URL` to its origin (or origin ending in
`/api`) when building the frontend. If frontend and backend share an origin, no
frontend API setting is needed.

## Structure
- `src/data/streams.js`  streams, subjects per class, paper counts (swap for an API later)
- `src/styles/global.css`  colour tokens, glass surface, buttons
- `src/components/Background`  grid + floating dots (canvas)
- `src/components/Navbar`, `Hero`, `ClassToggle`, `StreamsSection` (slider + cards), `Footer`
- `src/pages`  Home (done), PastPapers and Developer (placeholders)
