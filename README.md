# Life in the UK practice

Practise for the Life in the UK test with timed practice exams, a searchable question bank and saved custom exams. The app runs entirely in the browser and is published on GitHub Pages.

See [design.md](design.md) for product behaviour and [plan.md](plan.md) for the implementation plan.

## Development

Use the current Node.js LTS release.

```sh
npm install
npm run dev          # dev server
npm run check        # type check
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright smoke tests against a production build
npm run build        # static site in build/
```

## Data

The question data lives in [`data/`](data). The app imports these JSON files directly and never writes to them. Stars and saved exams are stored in the browser's `localStorage`.

## SEO

Every page prerenders to static HTML. Pages that depend on saved browser data (stars, saved exams, theme) read it after mount through `loadStored()` in `src/lib/storage.svelte.ts`, so the first render matches the HTML.

- `src/lib/Seo.svelte` sets the title, description, canonical URL, social tags and JSON-LD. The site URL lives in `src/lib/site.ts`.
- Indexable pages: home, `/bank`, `/cheat-sheet`, `/exam/<id>`, `/topic/<slug>` and `/question/<id>`. `/sitemap.xml` lists them from the data files.
- `/exam?saved=<id>` is `noindex`. The old `/exam?id=<id>` links redirect to `/exam/<id>`.
- The service worker precaches the app and exam pages, but not question and topic pages.
