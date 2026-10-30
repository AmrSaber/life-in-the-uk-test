<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { questions } from '#lib/data.ts';
	import { emptyFilters, filterQuestions } from '#lib/filter.ts';
	import {
		createSavedExam,
		deleteSavedExam,
		getSavedExam,
		savedExams,
		starAll,
		stars,
		toggleInSavedExam,
		updateSavedExam
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
	let editName = $state('');

	afterNavigate(({ from, to }) => {
		if (!to) return;
		const p = to.url.searchParams;
		// The header links set the starred filter; other view changes keep it.
		if (!to.url.search || p.has('starred')) filters.starredOnly = p.get('starred') === '1';
		const edit = getSavedExam(p.get('edit'));
		if (edit) {
			selection.clear();
			for (const id of edit.questions) selection.add(id);
			editName = edit.name;
		} else if (from?.url?.searchParams.has('edit')) {
			selection.clear();
		}
	});

	const base = $derived(
		saved ? questions.filter((q) => saved.questions.includes(q.id)) : questions
	);
	const shown = $derived(filterQuestions(base, filters, stars));
	const shownIds = $derived(new Set(shown.map((q) => q.id)));
	const hiddenSelected = $derived([...selection].filter((id) => !shownIds.has(id)).length);
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

	// ---- Saved exams

	let saveOpen = $state(false);
	let newName = $state('');
	let deleteOpen = $state(false);

	function saveNew() {
		const exam = createSavedExam(newName, selection);
		selection.clear();
		newName = '';
		goto(`/bank?saved=${exam.id}`);
	}

	function saveEdit() {
		if (!editing) return;
		updateSavedExam(editing.id, editName, selection);
		goto(`/bank?saved=${editing.id}`);
	}

	async function remove() {
		if (!saved) return;
		const id = saved.id;
		await goto('/bank');
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
	<p><a class="button" href="/bank">Question bank</a></p>
{:else}
	{#if editing}
		<section class="card banner" aria-labelledby="edit-heading">
			<h1 id="edit-heading">Editing: {editing.name}</h1>
			<p class="muted">
				Select the questions this exam should contain. Filters only change what you see; hidden
				selected questions stay in the exam.
			</p>
			<div class="edit-row">
				<label for="edit-name">Name</label>
				<input id="edit-name" type="text" maxlength="80" required bind:value={editName} />
				<button
					type="button"
					class="primary"
					disabled={!editName.trim() || !selection.size}
					onclick={saveEdit}
				>
					Save
				</button>
				<a class="button" href="/bank?saved={editing.id}">Cancel</a>
			</div>
			{#if !editName.trim() || !selection.size}
				<p class="muted hint">
					{!editName.trim() ? 'Enter a name.' : 'Select at least one question.'}
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
						goto(e.currentTarget.value ? `/bank?saved=${e.currentTarget.value}` : '/bank')}
				>
					<option value="">All questions ({questions.length})</option>
					{#each savedExams as exam (exam.id)}
						<option value={exam.id}>{exam.name} ({exam.questions.length} questions)</option>
					{/each}
				</select>
			{:else}
				<p class="muted">
					No saved exams yet. Select questions, then choose “Save as exam” to create one.
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
						<a class="button primary" href="/exam?saved={saved.id}">Start</a>
					{:else}
						<button type="button" class="primary" disabled>Start</button>
					{/if}
					<a class="button" href="/bank?edit={saved.id}">Edit</a>
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
		Showing {shown.length} of {base.length} questions{saved ? ' in this exam' : ''}
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
						{/snippet}
					</QuestionCard>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty card">
			<p>
				{#if saved && !saved.questions.length}
					This saved exam has no questions. Use Edit to add some.
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
				<button type="button" disabled={!shown.length} onclick={selectAllMatching}>
					Select all {shown.length}
				</button>
				<button type="button" disabled={!selection.size} onclick={() => selection.clear()}>
					Clear selection
				</button>
				<button type="button" disabled={!selection.size} onclick={() => starAll(selection)}>
					<span aria-hidden="true">★</span> Star selected
				</button>
				{#if !editing}
					<button
						type="button"
						class="primary"
						disabled={!selection.size}
						onclick={() => (saveOpen = true)}
					>
						Save as exam…
					</button>
				{/if}
			</div>
		</div>
	{/if}
{/if}

<ConfirmDialog
	bind:open={saveOpen}
	title="Save as exam"
	confirmLabel="Save"
	confirmDisabled={!newName.trim()}
	onconfirm={saveNew}
>
	<p>
		Save the {selection.size} selected question{selection.size === 1 ? '' : 's'} as a custom exam.
	</p>
	<label class="field">
		Name
		<input type="text" maxlength="80" required bind:value={newName} />
	</label>
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
	.field {
		display: grid;
		gap: 0.25rem;
		font-weight: 600;
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
