---
description: Implementation plan for the Life in the UK practice app described in design.md.
created-at: 2026-10-30 11:20:39+00
updated-at: 2026-10-30 11:20:39+00
---

# Implementation plan

This plan implements `design.md`. It aims for the simplest code that delivers the full behaviour: few files, plain Svelte 5 state, native HTML controls and no extra libraries. The cheat sheet and public data URLs are out of scope for now.

## Stack

- SvelteKit 3 and Svelte 5 with TypeScript, scaffolded with `npx sv create` (minimal template, TypeScript, Vitest, Playwright). SvelteKit 3 keeps its configuration in `vite.config.ts`.
- `@sveltejs/adapter-static` with `ssr = false` and `prerender = true` in the root `+layout.ts`. Every route builds to a static HTML shell and runs entirely in the browser, so pages can read query parameters and `localStorage` directly.
- npm on the current Node.js LTS release. Plain scoped CSS plus one global stylesheet for theme variables.
- No runtime dependencies beyond SvelteKit and Svelte.

## File layout

```text
src/
  app.html                  inline theme script to avoid a flash of the wrong theme
  app.css                   theme variables, base styles, focus styles
  lib/
    data.ts                 typed data imports, lookups, tag names, answer helpers
    filter.ts               filterQuestions(): tags, match all, search, starred
    storage.svelte.ts       stars, saved exams and theme, persisted to localStorage
    QuestionCard.svelte     one question in answer, locked or reveal mode
    StarButton.svelte
    TagFilter.svelte
    ConfirmDialog.svelte    native <dialog> wrapper
    *.test.ts               Vitest unit tests next to the code they test
  routes/
    +layout.ts              ssr = false, prerender = true
    +layout.svelte          header (title, nav, theme switch), main slot
    +page.svelte            home
    exam/+page.svelte       practice and saved exams (?id=exam-3 or ?saved=<id>)
    bank/+page.svelte       question bank, starred view, saved exams, editing
    cheat-sheet/+page.svelte placeholder until the cheat sheet is designed
tests/
  smoke.test.ts             Playwright end-to-end smoke tests
.github/workflows/deploy.yml
```

## Data layer (`src/lib/data.ts`)

- Import the JSON files from `data/` directly; Vite bundles them. Do not copy or transform them on disk.
- Export types for `Question`, `Exam` and `Chapter`, plus:
  - `questions` (array, file order) and `questionById` (`Map`).
  - `exams` from `exams.json`.
  - `tagName(slug)`: name from `tags.json`, or the slug when missing.
  - `tagGroups`: tags for the filter, grouped by chapter in `curriculum.json` order. Each chapter tag is followed by its section tags; tags that are not in the curriculum (for example `outdated`) come last.
  - `correctIndexes(q): number[]` normalises the three answer shapes: a number becomes `[n]`, an array stays as it is, and a boolean maps to the index of `"True"` or `"False"` in `options`.
  - `requiredCount(q)` is `correctIndexes(q).length`. It drives the "Choose N answers" label, so q0125 correctly asks for 3.
  - `isCorrect(q, selected)`: same set as `correctIndexes(q)`, all-or-nothing.

## Persisted state (`src/lib/storage.svelte.ts`)

One small module with Svelte 5 `$state`, loaded from `localStorage` on start and written back on every change.

| Key | Shape | Notes |
|-----|-------|-------|
| `lituk:stars` | `string[]` of question IDs | exposed as a `Set` with `toggleStar(id)` and `starAll(ids)` |
| `lituk:saved-exams` | `{ id, name, questions: string[] }[]` | `id` from `crypto.randomUUID()`; create, update, delete and per-question add or remove |
| `lituk:theme` | `"light" \| "dark" \| "auto"` | default `"auto"` |

- Treat unreadable or malformed values as empty and carry on; never crash on bad storage.
- When a saved exam is loaded, ignore question IDs that no longer exist in `questions.json`.
- No storage versioning, cross-tab sync or export and import.

## Layout, theme and home

- **Header:** app title linking home, and links to Question bank, Starred questions (`/bank?starred=1`) and Cheat sheet. On phones the links wrap below the title; no hamburger menu.
- **Theme:** a three-way control (Light, Dark, Auto) as a radio group. It sets `data-theme` on `<html>`. CSS variables cover both themes, `prefers-color-scheme` covers Auto, and `color-scheme` keeps native controls matching. An inline script in `app.html` applies the saved theme before first paint.
- **Home:** a short purpose statement, the 17 practice exams as a responsive grid of links (`/exam?id=exam-N`, showing 24 questions and 45 minutes), links to the bank and the starred view, and the browser-storage notice.

## Question card (`QuestionCard.svelte`)

One component renders a question everywhere. It takes the question, a mode and the current selection.

- **Markup:** a `<fieldset>` with the question as `<legend>`, a "Choose 1 answer" or "Choose 2 answers" hint, and native radio buttons (single, boolean) or checkboxes (multi). Native inputs give keyboard support and screen-reader semantics for free.
- **Modes:**
  - `answer`: inputs editable.
  - `locked`: inputs disabled; each option shows text and icon markers ("✓ Correct answer", "✗ Your answer"), never colour alone. The explanation is shown.
  - `reveal` (bank): the correct options are marked "✓ Correct answer"; the explanation sits in a `<details>` element, closed by default.
- Shows the question's tag names (chapter and section) and a `StarButton` (`aria-pressed`, ★ or ☆ plus a visible or screen-reader label).
- Shows a mnemonic next to the explanation only if a future data field provides one; nothing to build now.

## Exam page (`/exam`)

The page reads `?id=` (a practice exam) or `?saved=` (a saved exam). An unknown ID shows "Exam not found" with a link home.

### Attempt state

All state lives in the page component, so a refresh starts a new attempt.

- `order`: a Fisher-Yates shuffle of the exam's question IDs, taken at start. Saved-exam membership is copied at this moment, so later edits do not affect the running attempt.
- `answers`: per question `{ selected: number[], submitted: boolean }`.
- `current` index, `startedAt`, `finished`.
- Practice exams have a 45-minute limit and an 18-correct pass mark. Saved exams have neither.

### Layout

- **Top bar:** exam name, "Question 5 of 24", the timer as plain "32:10 left" text (practice exams only), and a "Finish" button.
- **Question navigator:** a wrapping grid of numbered buttons. Current: thick outline plus `aria-current`. Answered: ✓ or ✗ beside the number. Unanswered: number only. Each button has an accessible label such as "Question 5, answered, correct".
- **Question card** in `answer` mode, then `locked` mode after checking.
- **Footer:** "Previous", "Check answer" and "Next". On phones these stay at the bottom of the viewport, within thumb reach.

### Flow

1. Selections are editable and kept per question while navigating.
2. "Check answer" is enabled when the number of selected options equals the required count. The hint shows progress, for example "Choose 2 answers (1 selected)".
3. Checking locks the answer, shows the result and explanation, and announces "Correct" or "Incorrect. The correct answer is …" through an `aria-live="polite"` region. Focus stays put; nothing advances automatically.
4. Revisiting a checked question shows it locked with its feedback.
5. After the last unanswered question is checked, "Finish" becomes the primary button. Feedback stays visible until the user presses it.

### Timer

- A `setInterval` every second recomputes the remaining time from `startedAt`. That is accurate even when the tab sleeps.
- The timer element is not a live region, so it never interrupts screen readers. There are no colour changes or warnings.
- At zero, the exam finishes automatically, and unanswered questions count as incorrect.

### Finishing

- "Finish" with unanswered questions opens `ConfirmDialog`: "N questions are unanswered and will count as incorrect. Unchecked selections count as unanswered." With everything answered, it finishes at once.
- **Results:** "17 / 24 correct". Practice exams add "✓ Passed" or "✗ Not passed (pass mark 18)". Saved exams show the score only.
- **Review:** all questions in attempt order as locked cards with stars. A "Show only incorrect and unanswered" checkbox is on by default when any exist. Unanswered cards say "Not answered" and still show the correct answer and explanation.
- "Try again" starts a fresh shuffled attempt; "Home" leaves. Reviewing never changes the score.

### Leaving an unfinished attempt

- `beforeNavigate` cancels in-app navigation when the attempt has any progress (a selection or a checked answer) and is not finished. It opens `ConfirmDialog`: "Leave this exam? Your attempt can't be resumed. Stars and saved exams are kept." Confirming repeats the navigation with `goto`.
- Navigations of type `leave` (reload, closing the tab, external links) pass through without a prompt.
- A "Restart" action in the top bar uses the same dialog.

## Question bank (`/bank`)

The URL selects the view, so the shortcut links and back button work. Filters, search and selection are page state, so they survive switching views within the page but not a refresh.

| URL | View |
|-----|------|
| `/bank` | all questions |
| `/bank?starred=1` | all questions with "Starred only" turned on at load |
| `/bank?saved=<id>` | one saved exam |
| `/bank?edit=<id>` | editing one saved exam |

### Filters (`filter.ts`)

`filterQuestions(list, { tags, matchAll, search, includeExplanations, starredOnly, stars })` is one pure function:

- **Tags:** none selected means no tag filter. Otherwise the question needs any selected tag, or every selected tag when `matchAll` is on.
- **Search:** trimmed, case-insensitive substring match on the question text and options, plus the explanation when `includeExplanations` is on.
- **Starred only:** keeps starred questions.
- All active filters combine with AND.

### Filter UI

- A search box with an "Include explanations" checkbox next to it.
- `TagFilter`: a `<details>` panel ("Tags (2 selected)") with checkboxes grouped by chapter (chapter tag as the group's first checkbox, its sections indented below) and the extra tags last. A "Match all" checkbox and a "Clear tags" button sit at the top of the panel.
- A "Starred only" checkbox.
- A result line: "Showing 34 of 406 questions".
- Empty state: "No questions match these filters," with a "Clear filters" button.

### Question list

- Every matching question renders as a `QuestionCard` in `reveal` mode, with a "Select" checkbox, its star and a "Saved exams" `<details>` menu. The menu lists each saved exam as a checkbox, so you can see and change membership in one place. With no saved exams it says so.
- Render the full list without pagination; 406 cards are fine for a browser.

### Saved-exam chooser

- A "View" `<select>` above the list: "All questions" and then each saved exam as "Name (12 questions)". Choosing one navigates to `?saved=<id>`. With no saved exams, a short note replaces it: "No saved exams yet. Select questions and choose Save as exam."
- **Saved view:** a heading with the name and count, plus "Start" (`/exam?saved=<id>`), "Edit" and "Delete". The list shows the exam's questions narrowed by the active filters; filtering never changes membership. "Start" always uses the full saved list.
- **Delete:** `ConfirmDialog`, then remove only that saved exam and return to `/bank`.

### Selection and bulk actions

- Selection is a `Set` of question IDs in page state, separate from stars, and kept while filters change.
- A selection bar sticks to the bottom of the viewport in browse and edit views: "12 selected, 3 hidden by filters", then "Select all matching", "Clear selection", "Star selected" and "Save as exam…". All except "Select all matching" are disabled while nothing is selected.
- "Select all matching" adds every question that matches the current filters, including any off screen.
- "Save as exam…" opens a dialog with a required name field. Saving creates the exam from the full selection, clears the selection and navigates to its saved view.
- The saved view hides selection checkboxes and the selection bar.

### Editing a saved exam

- "Edit" sets the selection to the exam's questions and navigates to `?edit=<id>`.
- A banner reads "Editing: [name]" and holds a name field, "Save" and "Cancel". The full bank is shown with the normal filters and selection bar.
- "Save" requires a non-empty name and at least one selected question, updates the exam, clears the selection and returns to `?saved=<id>`. "Cancel" clears the selection and returns without changes.
- Editing replaces any earlier browse selection; this is acceptable and keeps the state model to one selection.

## Accessibility and responsive design

- Semantic HTML first: native buttons, links, inputs, `<fieldset>`, `<details>` and `<dialog>` (`showModal()` traps focus and handles Escape).
- A clear `:focus-visible` outline in both themes. Touch targets of at least 44 px. Body text at 1 rem or more with comfortable line height.
- States use icons and text as well as colour, and contrast meets WCAG AA in both themes.
- Mobile first: single column, sticky bottom action bars on the exam and bank pages. Wider screens get a constrained reading width; the exam navigator moves beside the question.
- Each page sets a descriptive `<title>`.

## Testing

- **Vitest unit tests:**
  - `data.test.ts`: `correctIndexes` and `isCorrect` for all three types, including the 3-answer multi question and all-or-nothing scoring. Integrity checks: every exam question ID exists, and every boolean question has `["True", "False"]` options.
  - `filter.test.ts`: any and all tag matching, search with and without explanations, starred only, and combinations.
- **Playwright smoke tests (`tests/smoke.test.ts`):**
  - Start a practice exam, answer one question, see feedback, finish and see the score.
  - In the bank, filter, select, save as exam, start it and see that it has no timer.
- Run `npm run check`, `npm test` and `npm run build` before each commit.

## Deployment

- `.github/workflows/deploy.yml`: on push to `main`, run `npm ci`, `npm test` and `npm run build`, then publish `build/` with `actions/upload-pages-artifact` and `actions/deploy-pages`.
- Add `static/.nojekyll`. Leave `paths.base` empty, because the site will use a custom domain; add the `CNAME` when the domain is known.
- In the repository settings, set GitHub Pages to deploy from GitHub Actions.

## Build order

Each step ends in a working app and its own commit.

1. **Scaffold:** `sv create`, adapter-static, root `+layout.ts`, deploy workflow, empty pages.
2. **Data and storage:** `data.ts`, `filter.ts`, `storage.svelte.ts` with unit tests.
3. **Layout, theme and home page.**
4. **Question card and exam page:** answering, navigation, timer, finishing, review and the leave confirmation.
5. **Question bank:** list, filters, stars and the starred shortcut.
6. **Selection and saved exams:** bulk actions, save, saved view, start, edit and delete.
7. **Polish:** accessibility and mobile pass, Playwright smoke tests.
8. **Cheat sheet:** designed separately later.

## Out of scope

- Cheat sheet content (step 8) and explicit public data URLs.
- Score history, statistics, export or import of saved data, cross-tab or cross-device sync.
- Option shuffling, "leave site" browser prompts and timer warnings, as decided in `design.md`.
- Pagination or virtualised lists.
