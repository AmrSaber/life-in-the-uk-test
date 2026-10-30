<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { questions } from '#lib/data.ts';
	import { emptyFilters, filterQuestions } from '#lib/filter.ts';
	import {
		addToSavedExam,
		createSavedExam,
		deleteSavedExam,
		getSavedExam,
		savedExams,
		starAll,
		unstarAll,
		stars,
		toggleInSavedExam,
		updateSavedExam,
		type SavedExam
	} from '#lib/storage.svelte.ts';
	import ConfirmDialog from '#lib/ConfirmDialog.svelte';
	import QuestionCard from '#lib/QuestionCard.svelte';
	import TagFilter from '#lib/TagFilter.svelte';

	// The URL picks the view: all questions, ?starred=1, ?saved=<id> or ?edit=<id>.
	const params = $derived(page.url.searchParams);
	const saved = $derived(getSavedExam(params.get('saved')));
	const editing = $derived(getSavedExam(params.get('edit')));
	const missing = $derived((params.has('saved') && !saved) || (params.has('edit') && !editing));
	const selectable = $derived(!saved);

	const filters = $state({
		...emptyFilters(),
		starredOnly: page.url.searchParams.get('starred') === '1'
	});
	// Temporary and separate from stars; survives filter changes but not a refresh.
	const selection = new SvelteSet<string>();
	// Editing works on a draft of the exam's questions; Save writes it back, Cancel drops it.
	let editName = $state('');
	let draft: string[] = $state([]);

	afterNavigate(({ from, to }) => {
		if (!to) return;
		const p = to.url.searchParams;
		// The header links set the starred filter; other view changes keep it.
		if (!to.url.search || p.has('starred')) filters.starredOnly = p.get('starred') === '1';
		const edit = getSavedExam(p.get('edit'));
		const wasEditing = from?.url?.searchParams.has('edit');
		if (edit || wasEditing) selection.clear();
		if (edit) {
			draft = [...edit.questions];
			editName = edit.name;
		}
	});

	const examIds = $derived(saved?.questions ?? (editing ? draft : null));
	const base = $derived(examIds ? questions.filter((q) => examIds.includes(q.id)) : questions);
	const shown = $derived(filterQuestions(base, filters, stars));
	const shownIds = $derived(new Set(shown.map((q) => q.id)));
	const hiddenSelected = $derived([...selection].filter((id) => !shownIds.has(id)).length);
	const allShownSelected = $derived(shown.every((q) => selection.has(q.id)));
	const allSelectedStarred = $derived(
		selection.size > 0 && [...selection].every((id) => stars.has(id))
	);
	const filtersActive = $derived(
		filters.tags.length > 0 || filters.search.trim() !== '' || filters.starredOnly
	);

	function clearFilters() {
		Object.assign(filters, emptyFilters());
	}

	function toggleSelect(id: string) {
		if (selection.has(id)) selection.delete(id);
		else selection.add(id);
	}

	function selectAllMatching() {
		for (const q of shown) selection.add(q.id);
	}

	function removeSelectedFromDraft() {
		draft = draft.filter((id) => !selection.has(id));
		selection.clear();
	}

	// ---- Save to exam: add the selection to any existing exams and/or new ones

	let saveOpen = $state(false);
	let newName = $state('');
	// New exams are only created on OK, so cancelling leaves no empty exams behind.
	let pending: SavedExam[] = $state([]);
	const ticked = new SvelteSet<string>();
	const saveTargets = $derived([...savedExams, ...pending]);

	function openSave() {
		pending = [];
		ticked.clear();
		newName = '';
		saveOpen = true;
	}

	function addPending() {
		const name = newName.trim();
		if (!name) return;
		const id = `new-${pending.length}`;
		pending.push({ id, name, questions: [] });
		ticked.add(id);
		newName = '';
	}

	function saveToExams() {
		for (const exam of saveTargets) {
			if (!ticked.has(exam.id)) continue;
			if (exam.id.startsWith('new-')) createSavedExam(exam.name, selection);
			else addToSavedExam(exam.id, selection);
		}
		selection.clear();
	}

	// ---- Editing and deleting

	let deleteOpen = $state(false);

	function saveEdit() {
		if (!editing) return;
		updateSavedExam(editing.id, editName, draft);
		goto(resolve(`/bank?saved=${editing.id}`));
	}

	async function remove() {
		if (!saved) return;
		const id = saved.id;
		await goto(resolve('/bank'));
		deleteSavedExam(id);
	}

	const title = $derived(
		editing
			? `Editing: ${editing.name}`
			: saved
				? saved.name
				: filters.starredOnly
					? 'Starred questions'
					: 'Question bank'
	);
</script>

<svelte:head>
	<title>{title} · Life in the UK practice</title>
</svelte:head>

{#if missing}
	<h1>Saved exam not found</h1>
	<p>It might have been deleted, or it was saved in a different browser.</p>
	<p><a class="button" href={resolve('/bank')}>Question bank</a></p>
{:else}
	{#if editing}
		<section class="card banner" aria-labelledby="edit-heading">
			<h1 id="edit-heading">Editing: {editing.name}</h1>
			<p class="muted">
				Select questions to remove them, or rename the exam. To add questions, use “Save to exam” in
				the question bank.
			</p>
			<div class="edit-row">
				<label for="edit-name">Name</label>
				<input id="edit-name" type="text" maxlength="80" required bind:value={editName} />
				<button
					type="button"
					class="primary"
					disabled={!editName.trim() || !draft.length}
					onclick={saveEdit}
				>
					Save
				</button>
				<a class="button" href={resolve(`/bank?saved=${editing.id}`)}>Cancel</a>
			</div>
			{#if !editName.trim() || !draft.length}
				<p class="muted hint">
					{!editName.trim() ? 'Enter a name.' : 'An exam needs at least one question.'}
				</p>
			{/if}
		</section>
	{:else}
		<h1>Question bank</h1>
		<div class="view-row">
			{#if savedExams.length}
				<label for="view">View</label>
				<select
					id="view"
					value={saved?.id ?? ''}
					onchange={(e) =>
						goto(resolve(e.currentTarget.value ? `/bank?saved=${e.currentTarget.value}` : '/bank'))}
				>
					<option value="">All questions ({questions.length})</option>
					{#each savedExams as exam (exam.id)}
						<option value={exam.id}>{exam.name} ({exam.questions.length} questions)</option>
					{/each}
				</select>
			{:else}
				<p class="muted">
					No saved exams yet. Select questions, then choose “Save to exam” to create one.
				</p>
			{/if}
		</div>

		{#if saved}
			<section class="card saved-head" aria-labelledby="saved-heading">
				<h2 id="saved-heading">{saved.name}</h2>
				<p class="muted">
					{saved.questions.length} question{saved.questions.length === 1 ? '' : 's'} · untimed, no pass
					mark
				</p>
				<div class="saved-actions">
					{#if saved.questions.length}
						<a class="button primary" href={resolve(`/exam?saved=${saved.id}`)}>Start</a>
					{:else}
						<button type="button" class="primary" disabled>Start</button>
					{/if}
					<a class="button" href={resolve(`/bank?edit=${saved.id}`)}>Edit</a>
					<button type="button" class="danger" onclick={() => (deleteOpen = true)}>Delete</button>
				</div>
			</section>
		{/if}
	{/if}

	<search class="filters" aria-label="Filter questions">
		<div class="row">
			<label class="visually-hidden" for="search">Search questions</label>
			<input
				id="search"
				type="search"
				placeholder="Search questions and answers"
				bind:value={filters.search}
			/>
			<label class="check">
				<input type="checkbox" bind:checked={filters.includeExplanations} />
				Include explanations
			</label>
		</div>
		<div class="row">
			<TagFilter bind:tags={filters.tags} bind:matchAll={filters.matchAll} />
			<label class="check">
				<input type="checkbox" bind:checked={filters.starredOnly} />
				<span aria-hidden="true">★</span> Starred only
			</label>
			{#if filtersActive}
				<button type="button" onclick={clearFilters}>Clear filters</button>
			{/if}
		</div>
	</search>

	<p class="count" role="status">
		Showing {shown.length} of {base.length} questions{examIds ? ' in this exam' : ''}
	</p>

	{#if shown.length}
		<ul class="list">
			{#each shown as q (q.id)}
				<li class:selected={selectable && selection.has(q.id)}>
					<QuestionCard question={q} mode="reveal">
						{#snippet actions()}
							{#if selectable}
								<label class="check select">
									<input
										type="checkbox"
										checked={selection.has(q.id)}
										onchange={() => toggleSelect(q.id)}
									/>
									Select<span class="visually-hidden"> this question</span>
								</label>
							{/if}
							{@const inExams = savedExams.filter((e) => e.questions.includes(q.id))}
							<!-- Hidden while editing: direct membership changes would bypass the draft. -->
							{#if !editing}
								<details class="menu">
									<summary class="button">
										Saved exams{inExams.length ? ` (${inExams.length})` : ''}
									</summary>
									<div class="menu-panel">
										{#if savedExams.length}
											<p class="muted">Include this question in:</p>
											{#each savedExams as exam (exam.id)}
												<label class="check">
													<input
														type="checkbox"
														checked={exam.questions.includes(q.id)}
														onchange={() => toggleInSavedExam(exam.id, q.id)}
													/>
													{exam.name}
												</label>
											{/each}
										{:else}
											<p class="muted">No saved exams yet.</p>
										{/if}
									</div>
								</details>
							{/if}
						{/snippet}
					</QuestionCard>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty card">
			<p>
				{#if examIds && !examIds.length}
					{editing
						? 'All questions are removed. Cancel to keep the exam as it was.'
						: 'This saved exam has no questions.'}
				{:else if filters.starredOnly && !stars.size}
					You haven't starred any questions yet. Use the Star button on a question to save it for
					revision.
				{:else}
					No questions match these filters.
				{/if}
			</p>
			{#if filtersActive}
				<button type="button" onclick={clearFilters}>Clear filters</button>
			{/if}
		</div>
	{/if}

	{#if selectable}
		<div class="selection-bar" role="region" aria-label="Selected questions">
			<p role="status">
				<strong>{selection.size} selected</strong>{#if hiddenSelected}, {hiddenSelected} hidden by filters{/if}
			</p>
			<div class="bar-actions">
				<button type="button" disabled={allShownSelected} onclick={selectAllMatching}>
					Select all {shown.length}
				</button>
				<button type="button" disabled={!selection.size} onclick={() => selection.clear()}>
					Clear selection
				</button>
				{#if allSelectedStarred}
					<button type="button" onclick={() => unstarAll(selection)}>
						<span aria-hidden="true">☆</span> Unstar selected
					</button>
				{:else}
					<button type="button" disabled={!selection.size} onclick={() => starAll(selection)}>
						<span aria-hidden="true">★</span> Star selected
					</button>
				{/if}
				{#if editing}
					<button
						type="button"
						class="danger"
						disabled={!selection.size}
						onclick={removeSelectedFromDraft}
					>
						Remove selected from exam
					</button>
				{:else}
					<button type="button" class="primary" disabled={!selection.size} onclick={openSave}>
						Save to exam…
					</button>
				{/if}
			</div>
		</div>
	{/if}
{/if}

<ConfirmDialog
	bind:open={saveOpen}
	title="Save to exam"
	confirmLabel="OK"
	confirmDisabled={!ticked.size}
	onconfirm={saveToExams}
>
	<p>
		Add the {selection.size} selected question{selection.size === 1 ? '' : 's'} to these exams:
	</p>
	{#if saveTargets.length}
		<ul class="targets">
			{#each saveTargets as exam (exam.id)}
				<li>
					<label class="check">
						<input
							type="checkbox"
							checked={ticked.has(exam.id)}
							onchange={() => (ticked.has(exam.id) ? ticked.delete(exam.id) : ticked.add(exam.id))}
						/>
						{exam.name}
						<span class="muted">
							{exam.id.startsWith('new-') ? '(new)' : `(${exam.questions.length})`}
						</span>
					</label>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="muted">No saved exams yet. Create one below.</p>
	{/if}
	<div class="new-exam">
		<label class="visually-hidden" for="new-exam">New exam name</label>
		<input
			id="new-exam"
			type="text"
			maxlength="80"
			placeholder="New exam name"
			bind:value={newName}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					addPending();
				}
			}}
		/>
		<button type="button" disabled={!newName.trim()} onclick={addPending}>Add</button>
	</div>
</ConfirmDialog>

<ConfirmDialog
	bind:open={deleteOpen}
	title="Delete “{saved?.name}”?"
	confirmLabel="Delete"
	danger
	onconfirm={remove}
>
	<p>This removes only this saved exam. Your questions, stars and other saved exams are kept.</p>
</ConfirmDialog>

<style>
	h1 {
		margin-top: 0.5rem;
	}
	.view-row,
	.row,
	.edit-row,
	.saved-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	.view-row {
		margin-bottom: 1rem;
	}
	.view-row p {
		margin: 0;
	}
	.view-row select {
		flex: 1;
		max-width: 28rem;
	}
	.banner,
	.saved-head {
		margin-bottom: 1rem;
		border-color: var(--accent);
		border-width: 2px;
	}
	.banner h1,
	.saved-head h2 {
		margin: 0;
	}
	.banner p,
	.saved-head p {
		margin: 0.25rem 0 0.75rem;
	}
	.edit-row {
		gap: 0.5rem;
	}
	.edit-row label {
		font-weight: 600;
	}
	.edit-row input {
		flex: 1;
		min-width: min(100%, 14rem);
	}
	.banner .hint {
		margin: 0.5rem 0 0;
	}
	.saved-actions {
		gap: 0.5rem;
	}
	.filters {
		display: grid;
		gap: 0.5rem;
	}
	.row input[type='search'] {
		flex: 1;
		min-width: min(100%, 18rem);
	}
	.row :global(.tag-filter[open]) {
		flex-basis: 100%;
	}
	.count {
		color: var(--muted);
		margin: 1rem 0 0.5rem;
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 1rem;
	}
	.selected > :global(.card) {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}
	.select {
		padding: 0 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-weight: 600;
	}
	.menu {
		position: relative;
	}
	.menu summary {
		list-style: none;
	}
	.menu summary::-webkit-details-marker {
		display: none;
	}
	.menu-panel {
		position: absolute;
		right: 0;
		top: calc(100% + 0.25rem);
		z-index: 5;
		min-width: 16rem;
		max-width: calc(100vw - 2rem);
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 4px 16px rgb(0 0 0 / 20%);
	}
	.menu-panel p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
	}
	.menu-panel .check {
		display: flex;
	}
	.empty {
		text-align: center;
	}
	.selection-bar {
		position: sticky;
		bottom: 0;
		z-index: 4;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		margin: 1rem -1rem 0;
		padding: 0.6rem 1rem;
		background: var(--surface);
		border-top: 1px solid var(--border);
		box-shadow: 0 -2px 10px rgb(0 0 0 / 8%);
	}
	.selection-bar p {
		margin: 0;
	}
	.bar-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.targets {
		list-style: none;
		padding: 0;
		margin: 0 0 0.5rem;
		max-height: 40vh;
		overflow-y: auto;
	}
	.targets .muted {
		font-size: 0.9rem;
	}
	.new-exam {
		display: flex;
		gap: 0.5rem;
	}
	.new-exam input {
		flex: 1;
		min-width: 0;
	}
	@media (max-width: 40rem) {
		.selection-bar {
			margin: 1rem -0.75rem 0;
			padding: 0.5rem 0.75rem;
		}
		.bar-actions {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
		}
		.bar-actions button {
			padding: 0.4em 0.5em;
			font-size: 0.95rem;
		}
	}
</style>
