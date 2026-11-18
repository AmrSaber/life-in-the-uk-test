<script lang="ts">
	import { resolve } from '$app/paths';
	import { EXAM_MINUTES, PASS_MARK, questionById } from '#lib/data.ts';
	import { client } from '#lib/storage.svelte.ts';
	import Seo from '#lib/Seo.svelte';
	import { breadcrumbs } from '#lib/site.ts';
	import Attempt from '../Attempt.svelte';

	let { data } = $props();
	const exam = $derived(data.exam);
	const questions = $derived(exam.questions.map((id) => questionById.get(id)!));
	// Bumping this remounts the attempt for "Try again" and "Restart".
	let run = $state(0);
</script>

<Seo
	bare
	title="Life in the UK Practice Test: {exam.name} ({questions.length} Questions)"
	description="Take a free Life in the UK mock test: {questions.length} questions, {EXAM_MINUTES} minutes and a pass mark of {PASS_MARK}, with the correct answer and an explanation for every question."
	jsonLd={[
		breadcrumbs([
			{ name: 'Home', path: '/' },
			{ name: exam.name, path: `/exam/${exam.id}` }
		])
	]}
/>

{#if client.ready}
	{#key run}
		<Attempt name={exam.name} {questions} timed onrestart={() => run++} />
	{/key}
{:else}
	<!-- Crawlers and the first paint get this; the attempt takes over once the page is interactive,
	because it shuffles the questions and starts the timer. -->
	<h1>{exam.name}</h1>
	<p class="muted">
		{questions.length} questions · {EXAM_MINUTES} minutes · pass mark {PASS_MARK}
	</p>
	<h2>Questions in this exam</h2>
	<ol>
		{#each questions as q (q.id)}
			<li><a href={resolve('/question/[id]', { id: q.id })}>{q.question}</a></li>
		{/each}
	</ol>
{/if}
