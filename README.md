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
