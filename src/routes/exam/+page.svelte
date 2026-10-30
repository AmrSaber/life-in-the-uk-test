<script lang="ts">
	import { page } from '$app/state';
	import { exams, questionById } from '#lib/data.ts';
	import { getSavedExam } from '#lib/storage.svelte.ts';
	import Attempt from './Attempt.svelte';

	const params = $derived(page.url.searchParams);
	const savedId = $derived(params.get('saved'));
	const exam = $derived.by(() => {
		if (savedId) {
			const saved = getSavedExam(savedId);
			return saved && { name: saved.name, questions: saved.questions, timed: false };
		}
		const practice = exams.find((e) => e.id === params.get('id'));
		return practice && { name: practice.name, questions: practice.questions, timed: true };
	});
	// Bumping this remounts the attempt for "Try again" and "Restart".
	let run = $state(0);
</script>

<svelte:head>
	<title>{exam?.name ?? 'Exam not found'} · Life in the UK practice</title>
</svelte:head>

{#if !exam || !exam.questions.length}
	<h1>{exam ? 'This exam has no questions' : 'Exam not found'}</h1>
	<p>
		{#if savedId}
			This saved exam doesn't exist in this browser, or has no questions. Saved exams are kept only
			in the browser where you created them.
		{:else}
			Choose one of the practice exams on the home page.
		{/if}
	</p>
	<p><a class="button" href={savedId ? '/bank' : '/'}>{savedId ? 'Question bank' : 'Home'}</a></p>
{:else}
	{#key `${page.url.search}#${run}`}
		<Attempt
			name={exam.name}
			questions={exam.questions.map((id) => questionById.get(id)!)}
			timed={exam.timed}
			onrestart={() => run++}
		/>
	{/key}
{/if}
