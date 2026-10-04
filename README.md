# PastPaper (frontend)

React + Vite. Node.js backend comes later.

```bash
npm install
npm run dev     # http://localhost:5173 (and a Network link for your phone)
npm run build
```

## Structure
- `src/data/streams.js`  streams, subjects per class, paper counts (swap for an API later)
- `src/styles/global.css`  colour tokens, glass surface, buttons
- `src/components/Background`  grid + floating dots (canvas)
- `src/components/Navbar`, `Hero`, `ClassToggle`, `StreamsSection` (slider + cards), `Footer`
- `src/pages`  Home (done), PastPapers and Developer (placeholders)
