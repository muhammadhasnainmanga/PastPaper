import { useEffect } from 'react';

const SITE = 'https://pastpaper.hasnainmanga.dev';

function tag(selector, create) {
    let el = document.head.querySelector(selector);
    if (!el) { el = create(); document.head.appendChild(el); }
    return el;
}
const meta = (attr, key) => tag(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });

export function useSeo({ title, description, path = '/', noindex = false }) {
    useEffect(() => {
        const url = `${SITE}${path}`;
        document.title = title;
        meta('name', 'description').setAttribute('content', description);
        meta('property', 'og:title').setAttribute('content', title);
        meta('property', 'og:description').setAttribute('content', description);
        meta('property', 'og:url').setAttribute('content', url);
        tag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; }).setAttribute('href', url);
        meta('name', 'robots').setAttribute('content', noindex ? 'noindex, follow' : 'index, follow');
    }, [title, description, path, noindex]);
}