---
description: Product behaviour and high-level constraints for the Life in the UK practice app.
created-at: 2026-10-29 22:13:50+00
updated-at: 2026-10-30 00:20:06+00
---

# Life in the UK practice exams system design

Help people practise for and pass the Life in the UK test through practice exams, a question bank and a revision cheat sheet.

## General requirements

- Use the latest stable versions of Svelte and SvelteKit. Run the application entirely in the browser.
- Configure its GitHub repository to build and publish the static site on GitHub Pages.
- Support light, dark and automatic appearance. Automatic appearance follows the device preference.
- Treat phones and desktop screens as equal design targets. Both must look polished and work well, with layouts and controls suited to each.
- Prioritise ease of use, accessibility and an intuitive experience. Keep detailed layouts and implementation choices with the implementing agent.
- Use distinct, consistent indicators for question states and selection. Do not rely on colour alone.
- Make controls operable by keyboard with visible focus indicators. Announce answer feedback to screen readers.
- Keep saved personal study data in the current browser. It does not sync across browsers or devices and can be lost when browser data is cleared. In-progress exam attempts are not saved.

## Static data

- Use the `data/` directory and its JSON files as-is. Do not modify, regenerate or restructure them for the app.
- Perform all manipulation, including filtering, shuffling and custom-exam creation, within the app. Never persist transformed data or application state into `data/`.
- Keep saved personal data, such as stars and custom-exam definitions, separately in the browser. The source JSON files remain unchanged.
- Serve every JSON file in `data/` publicly at a directly accessible URL, not only bundled into the app. This app and other interested apps can fetch and use the same files.
- Provide no versioning, stability or backward-compatibility guarantees for external consumers. Changes can break other apps; maintaining their compatibility is out of scope.

## Pages

The following sections describe the main pages and their behaviour. Additional pages can support this functionality where needed.

### Home page

- Show the app's title, explain its purpose and provide access to the other pages.
- List the 17 practice exams. Selecting an exam starts that practice exam.
- Include a short notice explaining that saved study data stays in the current browser, does not sync across devices and can be lost if cleared.

### Exam page

Provide learning-oriented practice using the real exam's question count and time limit, rather than a strict simulation. Present questions one at a time with immediate feedback.

- Shuffle question order at the start of every attempt, including the original 17 exams, custom exams and saved exams. Keep the question set and order fixed for that attempt.
- Provide a list of all questions, identify the current question and distinguish answered from unanswered questions.
- Allow 45 minutes for a practice exam. The pass mark is 18 correct answers out of 24.
- Keep the timer running while feedback and explanations are displayed. The time limit is a reminder of the actual exam's timing, not a strict simulation.
- Do not persist in-progress attempts. Refreshing the page restarts the exam.
- Allow any question to be starred or unstarred manually, including after its answer is locked. Its starred status also applies in the question bank, where users can filter by starred questions alongside other filters.

#### Answering a question

Clearly state how many answers the question requires.

Use the same flow for every question type:

1. Choose an answer or multiple answers as appropriate. Selections remain editable until confirmation.
2. Explicitly confirm with "Check answer".
3. Immediately show correctness, the correct answer and its explanation. Lock the submitted answer so it cannot change during that attempt.
4. Continue to the next question manually. Do not advance automatically while the user is reading feedback.

Score multi-answer questions all-or-nothing: every correct option and no incorrect options must be selected. Otherwise, mark the question incorrect; do not award partial credit.

Show a mnemonic alongside the explanation if one is available; creating mnemonics is currently deferred.

#### Navigating an exam

- Allow moving backwards and forwards or jumping to any question, including unanswered questions.
- Preserve unsubmitted selections while navigating within the current attempt. Refreshing still resets the attempt.
- When revisiting an answered question, show its submitted answer and feedback. Keep the answer locked and do not score it again.
- Ask for confirmation before in-app navigation or a restart discards an unfinished attempt. Explain that the attempt cannot be resumed; stars and saved custom exams remain intact.

#### Finishing and reviewing an exam

- Allow finishing at any time through an explicit "Finish" action. After the last answer, keep its feedback visible until the user chooses to finish.
- Before finishing early, show the number of unanswered questions and ask for confirmation if any remain. Unsubmitted selections count as unanswered; unanswered questions count as incorrect.
- When the time limit expires, finish automatically and count all unanswered questions as incorrect.
- Show the final score as correct answers out of the total. Include pass/fail for standard practice exams, but not for custom exams.
- Make incorrect and unanswered questions easy to find during review. Show submitted answers, correct answers and explanations, and allow questions to be starred.
- Reviewing answers never changes the final score.

### Question bank

List all questions without repetition. Present each question similarly to the exam, but with the correct answer already indicated.

- Show the related chapter information and make the explanation available. Explanations can be hidden by default.
- Support filtering by tags and starred status.
- When several curriculum sections are selected, match questions in any selected section. Search, starred status and other active filters further narrow those results.
- Use case-insensitive substring search across question text and answer options, not fuzzy search.
- Provide an "Include explanations" search option, off by default. Enabling it adds explanation text to the search scope.
- Allow questions to be starred or unstarred manually for later revision. Stars persist across attempts and the question bank; incorrect answers are not starred automatically.
- Show clear empty-state messages when no questions match the current filters or no saved exams exist.

Starred questions are a filtered view of the question bank, not a separate page. Provide a "Starred questions" shortcut that opens the bank with the starred-only filter applied. This filter can be combined with tags and search.

#### Selection and custom exams

- Keep question-bank selections temporary and separate from stars. Selection identifies questions for bulk actions or custom exams; it does not star them.
- Allow users to select some or all questions and create a custom exam from that selection.
- Preserve selections when filters or search change, so users can combine questions from different sections.
- Make "select all" add every question matching the current filters and search, including matches not currently displayed.
- Show the total selected and how many selected questions are hidden by the current filters. Provide "Clear selection" to remove the complete selection.
- Support starring the selected questions in bulk or using them to create a custom exam. Apply these actions to the complete selection, including hidden questions.
- Disable selection-based actions when no questions are selected.
- Custom exams use the same question, immediate-feedback and answer-locking behaviour as the practice exams, but have no time limit.
- Show a score for custom exams without a pass/fail result.

#### Saved custom exams

Saved custom exams are named question collections within the question bank, not a separate page.

- Save a selection of questions as a custom exam. Require a non-empty name and at least one question when saving.
- List saved exams in a chooser showing each name and question count. Opening one shows its questions, with "Start", "Edit" and "Delete" actions.
- Tags, search and the starred filter can further narrow the saved-exam view. Filtering alone never changes its membership.
- Start the complete saved collection as a fresh, untimed exam, not just the questions currently visible through additional filters.
- "Edit" shows the whole question bank with the saved exam's current questions preselected. Allow changing its name and selecting or deselecting questions.
- Clearly label this state "Editing: [exam name]" to distinguish editing a collection from creating a new one.
- Use the question bank's filtering and selection behaviour while editing, including retaining selections when hidden by filters.
- "Save" updates the name and complete selection, then returns to the saved-exam view. "Cancel" returns without changing anything. Browsing or filtering never overwrites a saved exam.
- Rename through the editing view. Ask for confirmation before deletion; remove only that collection, not its questions, stars or other saved exams.
- Include per-question options for adding the question to or removing it from existing saved exams. Show which saved exams already contain it.
- Apply saved-exam membership changes to future attempts, not an attempt already in progress.
- Save the selected questions themselves, not a dynamic search or filter that could produce a different collection later.
- Allow a question to belong to several saved exams without copying the question.
- Keep the saved exam definition in the browser, but do not save in-progress answers. Refreshing still starts a fresh attempt.

### Cheat sheet

Group related information from the questions into a curated reference for quick revision and memorisation.

- Focus on the information tested by the questions, not additional facts from their explanations. Explanations provide context rather than extra material to memorise.
- Help users understand the underlying facts, not just memorise a particular answer's wording. Real exam questions can be reworded or test another aspect of the same information.
- Keep passing the exam as the goal: cover the relevant information in the questions, rather than only the text of their correct options.
