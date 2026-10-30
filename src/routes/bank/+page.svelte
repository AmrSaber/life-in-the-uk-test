<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { questions } from '#lib/data.ts';
	import { emptyFilters, filterQuestions } from '#lib/filter.ts';
	import { stars } from '#lib/storage.svelte.ts';
	import QuestionCard from '#lib/QuestionCard.svelte';
	import TagFilter from '#lib/TagFilter.svelte';

	const isStarredLink = (url: URL) => url.searchParams.get('starred') === '1';
	const filters = $state({ ...emptyFilters(), starredOnly: isStarredLink(page.url) });

	// Follow the "Starred questions" shortcut both ways; the checkbox can still override it.
	afterNavigate((nav) => {
		if (nav.to) filters.starredOnly = isStarredLink(nav.to.url);
	});

	const shown = $derived(filterQuestions(questions, filters, stars));
	const filtersActive = $derived(
		filters.tags.length > 0 || filters.search.trim() !== '' || filters.starredOnly
	);

	function clearFilters() {
		Object.assign(filters, emptyFilters());
	}
</script>

<svelte:head>
	<title
		>{filters.starredOnly ? 'Starred questions' : 'Question bank'} · Life in the UK practice</title
	>
</svelte:head>

<h1>Question bank</h1>

<search class="filters" aria-label="Filter questions">
	<div class="search-row">
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
	<div class="filter-row">
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

<p class="count" role="status">Showing {shown.length} of {questions.length} questions</p>

{#if shown.length}
	<ul class="list">
		{#each shown as q (q.id)}
			<li><QuestionCard question={q} mode="reveal" /></li>
		{/each}
	</ul>
{:else}
	<div class="empty card">
		<p>
			{filters.starredOnly && !stars.size
				? "You haven't starred any questions yet. Use the Star button on a question to save it for revision."
				: 'No questions match these filters.'}
		</p>
		<button type="button" onclick={clearFilters}>Clear filters</button>
	</div>
{/if}

<style>
	h1 {
		margin-top: 0.5rem;
	}
	.filters {
		display: grid;
		gap: 0.5rem;
	}
	.search-row,
	.filter-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	.search-row input[type='search'] {
		flex: 1;
		min-width: min(100%, 18rem);
	}
	.filter-row :global(.tag-filter) {
		flex-basis: 100%;
	}
	.filter-row :global(.tag-filter:not([open])) {
		flex-basis: auto;
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
	.empty {
		text-align: center;
	}
</style>
