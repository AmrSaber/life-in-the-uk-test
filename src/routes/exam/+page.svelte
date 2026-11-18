<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { questionById } from '#lib/data.ts';
	import Seo from '#lib/Seo.svelte';
	import { client, getSavedExam } from '#lib/storage.svelte.ts';
	import Attempt from './Attempt.svelte';

	// Saved exams live in the browser, so this page has nothing to index. Practice exams
	// have their own pages at /exam/<id>.
	// Prerendering can't read the query string.
	const params = $derived(client.ready ? page.url.searchParams : new URLSearchParams());
	const savedId = $derived(params.get('saved'));
	const saved = $derived(getSavedExam(savedId));
	// Bumping this remounts the attempt for "Try again" and "Restart".
	let run = $state(0);

	// Old links used /exam?id=<id>.
	$effect(() => {
		const id = params.get('id');
		if (id) goto(resolve('/exam/[id]', { id: id }), { replaceState: true });
	});
</script>

<Seo
	bare
	title="Saved exam · Life in the UK practice"
	description="Practise a saved exam."
	noindex
/>

{#if !client.ready || params.has('id')}
	<!-- Waiting for the browser's saved data (or the redirect). -->
{:else if !saved || !saved.questions.length}
	<h1>{saved ? 'This exam has no questions' : 'Exam not found'}</h1>
	<p>
		{#if savedId}
			This saved exam doesn't exist in this browser, or has no questions. Saved exams are kept only
			in the browser where you created them.
		{:else}
			Choose one of the practice exams on the home page.
		{/if}
	</p>
	<p>
		<a class="button" href={resolve(savedId ? '/bank' : '/')}
			>{savedId ? 'Question bank' : 'Home'}</a
		>
	</p>
{:else}
	{#key `${savedId}#${run}`}
		<Attempt
			name={saved.name}
			questions={saved.questions.map((id) => questionById.get(id)!)}
			timed={false}
			onrestart={() => run++}
		/>
	{/key}
{/if}
